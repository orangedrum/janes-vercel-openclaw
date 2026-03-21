import {
  buildDeploymentContract,
  type DeploymentContract,
} from "@/server/deployment-contract";
import { getCurrentDeploymentId } from "@/server/launch-verify/state";
import { logError, logInfo } from "@/server/log";
import {
  createOperationContext,
} from "@/server/observability/operation-context";
import { getPublicOrigin } from "@/server/public-url";
import {
  claimDueScheduledTasks,
  pruneScheduledTasks,
} from "@/server/scheduler/store";
import {
  isBusyStatus,
  probeGatewayReady,
  reconcileSandboxHealth,
  type ProbeResult,
  type SandboxHealthResult,
} from "@/server/sandbox/lifecycle";
import { getInitializedMeta } from "@/server/store/store";
import type {
  OperationContext,
  ScheduledTaskRecord,
  SingleMeta,
} from "@/shared/types";
import type { WatchdogCheck, WatchdogReport } from "@/shared/watchdog";
import {
  readWatchdogReport,
  writeWatchdogReport,
} from "@/server/watchdog/state";

export type RunSandboxWatchdogOptions = {
  request: Request;
  repair?: boolean;
};

export type WatchdogDeps = {
  buildContract: (options: { request?: Request }) => Promise<DeploymentContract>;
  getMeta: () => Promise<SingleMeta>;
  probe: () => Promise<ProbeResult>;
  reconcile: (options: {
    origin: string;
    reason: string;
    op?: OperationContext;
  }) => Promise<SandboxHealthResult>;
  readPrevious: () => Promise<WatchdogReport>;
  writeReport: (report: WatchdogReport) => Promise<WatchdogReport>;
  claimDueScheduledTasks: (
    nowMs: number,
    limit: number,
  ) => Promise<ScheduledTaskRecord[]>;
  pruneScheduledTasks: (nowMs: number) => Promise<void>;
  executeScheduledTask: (options: {
    task: ScheduledTaskRecord;
    origin: string;
  }) => Promise<void>;
  now: () => number;
};

const WATCHDOG_SCHEDULED_SCAN_CHECK_ID = "scheduled.scan" as never;
const WATCHDOG_SCHEDULED_DISPATCH_CHECK_ID = "scheduled.dispatch" as never;

async function dispatchWatchdogScheduledTask(options: {
  task: ScheduledTaskRecord;
  origin: string;
}): Promise<void> {
  const { executeScheduledTask } = await import("@/server/scheduler/execute");

  await executeScheduledTask({
    task: options.task,
    origin: options.origin,
  });
}

const defaultDeps: WatchdogDeps = {
  buildContract: buildDeploymentContract,
  getMeta: getInitializedMeta,
  probe: probeGatewayReady,
  reconcile: reconcileSandboxHealth,
  readPrevious: readWatchdogReport,
  writeReport: writeWatchdogReport,
  claimDueScheduledTasks,
  pruneScheduledTasks: async (nowMs: number) => {
    await pruneScheduledTasks(nowMs);
  },
  executeScheduledTask: dispatchWatchdogScheduledTask,
  now: () => Date.now(),
};

export async function runSandboxWatchdog(
  options: RunSandboxWatchdogOptions,
  deps: WatchdogDeps = defaultDeps,
): Promise<WatchdogReport> {
  const startedAt = deps.now();
  const deploymentId = getCurrentDeploymentId();
  const checks: WatchdogCheck[] = [];

  const addCheck = (
    id: WatchdogCheck["id"],
    status: WatchdogCheck["status"],
    stepStartedAt: number,
    message: string,
  ): void => {
    checks.push({
      id,
      status,
      durationMs: Math.max(0, deps.now() - stepStartedAt),
      message,
    });
  };

  let previous: WatchdogReport = {
    deploymentId,
    ranAt: null,
    status: "idle",
    sandboxStatus: "uninitialized",
    triggeredRepair: false,
    consecutiveFailures: 0,
    lastError: null,
    checks: [],
  };
  let meta: SingleMeta = { status: "uninitialized" } as SingleMeta;
  let status: WatchdogReport["status"] = "idle";
  let triggeredRepair = false;
  let lastError: string | null = null;

  try {
    previous = await deps.readPrevious();
    meta = await deps.getMeta();

    // Check deployment contract
    const contractStartedAt = deps.now();
    const contract = await deps.buildContract({ request: options.request });
    const failingRequirementIds = contract.requirements
      .filter((requirement) => requirement.status === "fail")
      .map((requirement) => requirement.id);

    if (failingRequirementIds.length > 0) {
      lastError = `Deployment contract failing: ${failingRequirementIds.join(", ")}`;
      addCheck("contract", "fail", contractStartedAt, lastError);
    } else {
      addCheck(
        "contract",
        "pass",
        contractStartedAt,
        `Deployment contract passed with ${contract.requirements.length} evaluated requirements.`,
      );
    }

    // Detect stuck busy states: restoring/creating with no sandboxId for >90s.
    // This is the watchdog's secondary safety net — the primary recovery is
    // in ensureSandboxRunning(), but watchdog catches it during low-traffic
    // periods when no user requests trigger the ensure path.
    if (isBusyStatus(meta.status) && !meta.sandboxId) {
      const ageMs = deps.now() - meta.updatedAt;
      const threshold = 90_000;

      if (ageMs > threshold) {
        const stuckMsg = `Sandbox stuck in ${meta.status} for ${Math.round(ageMs / 1000)}s with no sandboxId.`;
        addCheck("probe", "fail", deps.now(), stuckMsg);
        lastError = stuckMsg;

        if (options.repair !== false) {
          const repairStartedAt = deps.now();
          try {
            const watchdogOp = createOperationContext({
              trigger: "watchdog",
              reason: "watchdog:stuck_busy",
            });
            // ensureSandboxRunning now handles CAS-safe reset internally
            const result = await deps.reconcile({
              origin: getPublicOrigin(options.request),
              reason: "watchdog:stuck_busy",
              op: watchdogOp,
            });
            triggeredRepair = true;
            addCheck("reconcile", "pass", repairStartedAt,
              `Stuck ${meta.status} recovery triggered (result: ${result.status}).`);
            status = "repairing";
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            addCheck("reconcile", "fail", repairStartedAt, `Stuck recovery failed: ${errMsg}`);
            status = "failed";
          }
        } else {
          addCheck("reconcile", "skip", deps.now(), "Repair disabled for this run.");
          status = "failed";
        }
      } else {
        addCheck("probe", "skip", deps.now(),
          `Sandbox status is ${meta.status} (age ${Math.round(ageMs / 1000)}s, threshold ${Math.round(threshold / 1000)}s); waiting for operation.`);
        addCheck("reconcile", "skip", deps.now(), "Operation still within threshold.");
        status = failingRequirementIds.length > 0 ? "failed" : "idle";
      }
    } else if (meta.status !== "running" || !meta.sandboxId) {
      // Original: skip non-running/stopped/error/uninitialized
      addCheck(
        "probe",
        "skip",
        deps.now(),
        `Sandbox status is ${meta.status}; watchdog does not wake idle sandboxes.`,
      );
      addCheck(
        "reconcile",
        "skip",
        deps.now(),
        "No repair needed because metadata does not claim the sandbox is running.",
      );
      status = failingRequirementIds.length > 0 ? "failed" : "idle";
    } else {
      const probeStartedAt = deps.now();
      const probe = await deps.probe();

      if (probe.ready) {
        addCheck(
          "probe",
          "pass",
          probeStartedAt,
          "Gateway probe returned the openclaw-app marker.",
        );
        addCheck(
          "reconcile",
          "skip",
          deps.now(),
          "Probe passed; no repair scheduled.",
        );
        status = failingRequirementIds.length > 0 ? "failed" : "ok";
      } else {
        lastError =
          probe.error ??
          `Gateway probe failed (status=${probe.statusCode ?? "unknown"} markerFound=${probe.markerFound ?? false}).`;
        addCheck("probe", "fail", probeStartedAt, lastError);

        if (options.repair === false) {
          addCheck(
            "reconcile",
            "skip",
            deps.now(),
            "Repair disabled for this run.",
          );
          status = "failed";
        } else {
          const reconcileStartedAt = deps.now();
          const watchdogOp = createOperationContext({
            trigger: "watchdog",
            reason: "watchdog:probe_failed",
            sandboxId: meta.sandboxId,
            status: meta.status,
          });
          const reconciliation = await deps.reconcile({
            origin: getPublicOrigin(options.request),
            reason: "watchdog",
            op: watchdogOp,
          });

          triggeredRepair = reconciliation.repaired;

          if (reconciliation.status === "recovering" || reconciliation.repaired) {
            addCheck(
              "reconcile",
              "pass",
              reconcileStartedAt,
              `Recovery scheduled from status ${meta.status}.`,
            );
            status = failingRequirementIds.length > 0 ? "failed" : "repairing";
          } else {
            addCheck(
              "reconcile",
              "fail",
              reconcileStartedAt,
              reconciliation.error ??
                "Health reconciliation did not schedule recovery.",
            );
            status = "failed";
          }
        }
      }
    }

    const scheduledScanStartedAt = deps.now();
    const dueScheduledTasks = await deps.claimDueScheduledTasks(deps.now(), 10);

    if (dueScheduledTasks.length === 0) {
      addCheck(
        WATCHDOG_SCHEDULED_SCAN_CHECK_ID,
        "skip",
        scheduledScanStartedAt,
        "No due scheduled tasks.",
      );
    } else {
      addCheck(
        WATCHDOG_SCHEDULED_SCAN_CHECK_ID,
        "pass",
        scheduledScanStartedAt,
        `Claimed ${dueScheduledTasks.length} due scheduled task(s).`,
      );

      const origin = getPublicOrigin(options.request);

      for (const task of dueScheduledTasks) {
        const dispatchStartedAt = deps.now();

        try {
          await deps.executeScheduledTask({ task, origin });
          addCheck(
            WATCHDOG_SCHEDULED_DISPATCH_CHECK_ID,
            "pass",
            dispatchStartedAt,
            `Scheduled task ${task.id} dispatched.`,
          );
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);

          lastError = `Scheduled task ${task.id} failed: ${errMsg}`;
          status = "failed";
          addCheck(
            WATCHDOG_SCHEDULED_DISPATCH_CHECK_ID,
            "fail",
            dispatchStartedAt,
            lastError,
          );
        }
      }

      await deps.pruneScheduledTasks(deps.now());
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    logError("watchdog.run_failed", {
      error: lastError,
    });
    status = "failed";
  }

  const report: WatchdogReport = {
    deploymentId,
    ranAt: new Date(startedAt).toISOString(),
    status,
    sandboxStatus: meta.status,
    triggeredRepair,
    consecutiveFailures:
      status === "failed" ? previous.consecutiveFailures + 1 : 0,
    lastError,
    checks,
  };

  logInfo("watchdog.run_completed", {
    deploymentId,
    status,
    sandboxStatus: meta.status,
    triggeredRepair,
    consecutiveFailures: report.consecutiveFailures,
  });

  return deps.writeReport(report);
}
