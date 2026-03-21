import assert from "node:assert/strict";
import { test } from "node:test";

import type { SingleMeta } from "@/shared/types";
import type { WatchdogReport } from "@/shared/watchdog";
import { runSandboxWatchdog } from "@/server/watchdog/run";

const PREVIOUS: WatchdogReport = {
  deploymentId: "dpl_test",
  ranAt: "2026-03-16T07:40:00.000Z",
  status: "ok",
  sandboxStatus: "running",
  triggeredRepair: false,
  consecutiveFailures: 2,
  lastError: null,
  checks: [],
};

function findCheck(report: WatchdogReport, id: string) {
  return report.checks.find((check) => (check.id as string) === id);
}

function makeDeps(overrides: Partial<Parameters<typeof runSandboxWatchdog>[1]> = {}) {
  return {
    buildContract: async () => ({
      ok: true,
      authMode: "admin-secret" as const,
      storeBackend: "upstash" as const,
      aiGatewayAuth: "oidc" as const,
      openclawPackageSpec: "openclaw@1.2.3",
      requirements: [],
    }),
    getMeta: async () =>
      ({ status: "running", sandboxId: "sbx_123" }) as SingleMeta,
    probe: async () => ({ ready: true }),
    reconcile: async () => ({
      status: "recovering" as const,
      repaired: true,
      meta: { status: "booting" } as SingleMeta,
    }),
    readPrevious: async () => PREVIOUS,
    writeReport: async (next: WatchdogReport) => next,
    claimDueScheduledTasks: async () => [],
    pruneScheduledTasks: async () => {},
    executeScheduledTask: async () => {},
    now: (() => {
      let current = 0;
      return () => (current += 10);
    })(),
    ...overrides,
  };
}

test("running sandbox with healthy probe reports ok", async () => {
  const report = await runSandboxWatchdog(
    { request: new Request("https://app.test/api/cron/watchdog") },
    makeDeps(),
  );

  assert.equal(report.status, "ok");
  assert.equal(report.triggeredRepair, false);
  assert.equal(report.consecutiveFailures, 0);
  assert.equal(findCheck(report, "scheduled.scan")?.status, "skip");
});

test("running sandbox with failed probe schedules repair", async () => {
  const report = await runSandboxWatchdog(
    { request: new Request("https://app.test/api/cron/watchdog") },
    makeDeps({
      probe: async () => ({ ready: false, error: "ECONNREFUSED" }),
    }),
  );

  assert.equal(report.status, "repairing");
  assert.equal(report.triggeredRepair, true);
  assert.equal(report.consecutiveFailures, 0);
  assert.equal(
    report.checks.find((check) => check.id === "reconcile")?.status,
    "pass",
  );
});

test("stopped sandbox stays idle and skips repair", async () => {
  const report = await runSandboxWatchdog(
    { request: new Request("https://app.test/api/cron/watchdog") },
    makeDeps({
      getMeta: async () =>
        ({ status: "stopped", sandboxId: null }) as SingleMeta,
    }),
  );

  assert.equal(report.status, "idle");
  assert.equal(report.triggeredRepair, false);
  assert.equal(
    report.checks.find((check) => check.id === "probe")?.status,
    "skip",
  );
});

test("failed probe with repair disabled reports failed", async () => {
  const report = await runSandboxWatchdog(
    { request: new Request("https://app.test/api/cron/watchdog"), repair: false },
    makeDeps({
      probe: async () => ({ ready: false, error: "timeout" }),
    }),
  );

  assert.equal(report.status, "failed");
  assert.equal(report.triggeredRepair, false);
  assert.equal(report.consecutiveFailures, 3); // previous was 2
});

test("consecutive failures increment on failure and reset on success", async () => {
  const failReport = await runSandboxWatchdog(
    { request: new Request("https://app.test/api/cron/watchdog"), repair: false },
    makeDeps({
      probe: async () => ({ ready: false, error: "timeout" }),
    }),
  );
  assert.equal(failReport.consecutiveFailures, 3);

  const okReport = await runSandboxWatchdog(
    { request: new Request("https://app.test/api/cron/watchdog") },
    makeDeps(),
  );
  assert.equal(okReport.consecutiveFailures, 0);
});

test("test_watchdog_dispatches_claimed_scheduled_tasks_when_tasks_are_due", async () => {
  const dispatched: Array<{ id: string; origin: string }> = [];
  let pruneCalls = 0;

  const report = await runSandboxWatchdog(
    { request: new Request("https://app.test/api/cron/watchdog") },
    makeDeps({
      claimDueScheduledTasks: async () => [{ id: "task-1" }, { id: "task-2" }] as never,
      executeScheduledTask: async ({ task, origin }) => {
        dispatched.push({ id: task.id, origin });
      },
      pruneScheduledTasks: async () => {
        pruneCalls += 1;
      },
    }),
  );

  assert.equal(findCheck(report, "scheduled.scan")?.status, "pass");
  assert.equal(
    findCheck(report, "scheduled.scan")?.message,
    "Claimed 2 due scheduled task(s).",
  );
  assert.deepEqual(dispatched, [
    { id: "task-1", origin: "https://app.test" },
    { id: "task-2", origin: "https://app.test" },
  ]);
  assert.equal(
    report.checks.filter((check) => (check.id as string) === "scheduled.dispatch")
      .length,
    2,
  );
  assert.ok(
    report.checks.some(
      (check) =>
        (check.id as string) === "scheduled.dispatch" &&
        check.status === "pass" &&
        check.message === "Scheduled task task-1 dispatched.",
    ),
  );
  assert.ok(
    report.checks.some(
      (check) =>
        (check.id as string) === "scheduled.dispatch" &&
        check.status === "pass" &&
        check.message === "Scheduled task task-2 dispatched.",
    ),
  );
  assert.equal(pruneCalls, 1);
});

test("test_watchdog_marks_report_failed_when_scheduled_dispatch_errors", async () => {
  const dispatched: string[] = [];
  let pruneCalls = 0;

  const report = await runSandboxWatchdog(
    { request: new Request("https://app.test/api/cron/watchdog") },
    makeDeps({
      claimDueScheduledTasks: async () => [{ id: "task-fail" }, { id: "task-pass" }] as never,
      executeScheduledTask: async ({ task }) => {
        dispatched.push(task.id);
        if (task.id === "task-fail") {
          throw new Error("boom");
        }
      },
      pruneScheduledTasks: async () => {
        pruneCalls += 1;
      },
    }),
  );

  assert.equal(report.status, "failed");
  assert.equal(report.lastError, "Scheduled task task-fail failed: boom");
  assert.deepEqual(dispatched, ["task-fail", "task-pass"]);
  assert.ok(
    report.checks.some(
      (check) =>
        (check.id as string) === "scheduled.dispatch" &&
        check.status === "fail" &&
        check.message === "Scheduled task task-fail failed: boom",
    ),
  );
  assert.ok(
    report.checks.some(
      (check) =>
        (check.id as string) === "scheduled.dispatch" &&
        check.status === "pass" &&
        check.message === "Scheduled task task-pass dispatched.",
    ),
  );
  assert.equal(pruneCalls, 1);
});
