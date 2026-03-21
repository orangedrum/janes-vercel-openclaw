import assert from "node:assert/strict";
import test from "node:test";

import type { ScheduledTaskRecord } from "@/shared/types";
import { _resetStoreForTesting } from "@/server/store/store";

import {
  claimDueScheduledTasks,
  completeScheduledTask,
  failScheduledTask,
  pruneScheduledTasks,
  readScheduledTaskIndex,
  resolveTelegramTarget,
  saveTelegramTarget,
  writeScheduledTaskIndex,
} from "./store";

function withTestStore<T>(fn: () => T | Promise<T>): T | Promise<T> {
  const env = process.env as Record<string, string | undefined>;
  const previousNodeEnv = env.NODE_ENV;
  env.NODE_ENV = "test";
  _resetStoreForTesting();

  const restore = () => {
    if (previousNodeEnv === undefined) {
      delete env.NODE_ENV;
    } else {
      env.NODE_ENV = previousNodeEnv;
    }
    _resetStoreForTesting();
  };

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(restore);
    }

    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

function makeTask(
  overrides: Partial<ScheduledTaskRecord> & Pick<ScheduledTaskRecord, "id" | "name">,
): ScheduledTaskRecord {
  return {
    id: overrides.id,
    name: overrides.name,
    enabled: overrides.enabled ?? true,
    createdAt: overrides.createdAt ?? 1_000,
    updatedAt: overrides.updatedAt ?? 1_000,
    schedule: overrides.schedule ?? { kind: "every", everyMs: 60_000 },
    nextRunAtMs: overrides.nextRunAtMs ?? 1_000,
    lastRunAtMs: overrides.lastRunAtMs ?? null,
    lastFinishedAtMs: overrides.lastFinishedAtMs ?? null,
    deleteAfterRun: overrides.deleteAfterRun ?? false,
    sessionTarget: overrides.sessionTarget ?? "main",
    resolvedSessionKey: overrides.resolvedSessionKey ?? null,
    wakeMode: overrides.wakeMode ?? "now",
    payload: overrides.payload ?? { kind: "systemEvent", text: "hello" },
    delivery: overrides.delivery ?? { mode: "none" },
    execution: overrides.execution ?? {
      state: "scheduled",
      attemptCount: 0,
      consecutiveFailures: 0,
      leaseExpiresAtMs: null,
      claimToken: null,
      lastError: null,
    },
    cleanupAfterMs: overrides.cleanupAfterMs ?? null,
  };
}

test("readScheduledTaskIndex returns an empty index when the store has no scheduler value", async () => {
  await withTestStore(async () => {
    const index = await readScheduledTaskIndex(123);

    assert.deepEqual(index, {
      version: 1,
      updatedAt: 123,
      tasks: [],
    });
  });
});

test("claimDueScheduledTasks claims due tasks and recovers stale leases before claiming them", async () => {
  await withTestStore(async () => {
    await writeScheduledTaskIndex({
      version: 1,
      updatedAt: 0,
      tasks: [
        makeTask({ id: "due-now", name: "Due now", nextRunAtMs: 2_000 }),
        makeTask({
          id: "future",
          name: "Future",
          nextRunAtMs: 5_000,
        }),
        makeTask({
          id: "stale-lease",
          name: "Stale lease",
          nextRunAtMs: 1_500,
          execution: {
            state: "claimed",
            attemptCount: 1,
            consecutiveFailures: 0,
            leaseExpiresAtMs: 1_999,
            claimToken: "stale-token",
            lastError: "old error",
          },
        }),
      ],
    });

    const claimed = await claimDueScheduledTasks(2_000, 2);
    const index = await readScheduledTaskIndex();

    assert.equal(claimed.length, 2);
    assert.deepEqual(
      claimed.map((task) => task.id).sort(),
      ["due-now", "stale-lease"],
    );
    assert.ok(claimed.every((task) => task.execution.state === "claimed"));
    assert.ok(claimed.every((task) => task.execution.claimToken));
    assert.ok(claimed.every((task) => task.execution.leaseExpiresAtMs === 602_000));
    assert.ok(claimed.every((task) => task.lastRunAtMs === 2_000));
    assert.equal(
      index.tasks.find((task) => task.id === "future")?.execution.state,
      "scheduled",
    );
  });
});

test("completeScheduledTask deletes one-time tasks marked deleteAfterRun", async () => {
  await withTestStore(async () => {
    await writeScheduledTaskIndex({
      version: 1,
      updatedAt: 0,
      tasks: [
        makeTask({
          id: "delete-me",
          name: "Delete me",
          schedule: { kind: "at", at: "2026-03-21T17:00:00.000Z" },
          deleteAfterRun: true,
          execution: {
            state: "claimed",
            attemptCount: 1,
            consecutiveFailures: 0,
            leaseExpiresAtMs: 10_000,
            claimToken: "claim-1",
            lastError: null,
          },
        }),
      ],
    });

    await completeScheduledTask("delete-me", 4_000);

    const index = await readScheduledTaskIndex();
    assert.equal(index.tasks.length, 0);
  });
});

test("completeScheduledTask reschedules repeating and cron tasks", async () => {
  await withTestStore(async () => {
    const cronLastRunAt = Date.parse("2026-03-21T10:15:00.000Z");
    const cronFinishedAt = Date.parse("2026-03-21T10:16:00.000Z");

    await writeScheduledTaskIndex({
      version: 1,
      updatedAt: 0,
      tasks: [
        makeTask({
          id: "every-task",
          name: "Every task",
          schedule: { kind: "every", everyMs: 60_000 },
          lastRunAtMs: 2_000,
          execution: {
            state: "claimed",
            attemptCount: 1,
            consecutiveFailures: 2,
            leaseExpiresAtMs: 20_000,
            claimToken: "claim-every",
            lastError: "previous failure",
          },
        }),
        makeTask({
          id: "cron-task",
          name: "Cron task",
          schedule: { kind: "cron", expr: "15 * * * *" },
          nextRunAtMs: cronLastRunAt,
          lastRunAtMs: cronLastRunAt,
          execution: {
            state: "running",
            attemptCount: 3,
            consecutiveFailures: 1,
            leaseExpiresAtMs: cronFinishedAt + 10_000,
            claimToken: "claim-cron",
            lastError: "transient",
          },
        }),
      ],
    });

    await completeScheduledTask("every-task", 3_000);
    await completeScheduledTask("cron-task", cronFinishedAt);

    const index = await readScheduledTaskIndex();
    const everyTask = index.tasks.find((task) => task.id === "every-task");
    const cronTask = index.tasks.find((task) => task.id === "cron-task");

    assert.equal(everyTask?.nextRunAtMs, 62_000);
    assert.equal(everyTask?.lastFinishedAtMs, 3_000);
    assert.deepEqual(everyTask?.execution, {
      state: "scheduled",
      attemptCount: 0,
      consecutiveFailures: 0,
      leaseExpiresAtMs: null,
      claimToken: null,
      lastError: null,
    });

    assert.equal(cronTask?.nextRunAtMs, Date.parse("2026-03-21T11:15:00.000Z"));
    assert.equal(cronTask?.lastFinishedAtMs, cronFinishedAt);
    assert.equal(cronTask?.execution.state, "scheduled");
    assert.equal(cronTask?.execution.consecutiveFailures, 0);
  });
});

test("failScheduledTask backs off retries and disables the task after five consecutive failures", async () => {
  await withTestStore(async () => {
    await writeScheduledTaskIndex({
      version: 1,
      updatedAt: 0,
      tasks: [
        makeTask({
          id: "failing-task",
          name: "Failing task",
          execution: {
            state: "running",
            attemptCount: 1,
            consecutiveFailures: 0,
            leaseExpiresAtMs: 15_000,
            claimToken: "claim-fail",
            lastError: null,
          },
        }),
      ],
    });

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      await failScheduledTask("failing-task", attempt * 1_000, `boom-${attempt}`);
      const task = (await readScheduledTaskIndex()).tasks.find((entry) => entry.id === "failing-task");
      assert.equal(task?.enabled, true);
      assert.equal(task?.execution.state, "scheduled");
      assert.equal(task?.execution.consecutiveFailures, attempt);
      assert.equal(task?.nextRunAtMs, attempt * 1_000 + 300_000);
      assert.equal(task?.execution.lastError, `boom-${attempt}`);
    }

    await failScheduledTask("failing-task", 5_000, "boom-5");

    const task = (await readScheduledTaskIndex()).tasks.find((entry) => entry.id === "failing-task");
    assert.equal(task?.enabled, false);
    assert.equal(task?.nextRunAtMs, null);
    assert.equal(task?.execution.state, "disabled");
    assert.equal(task?.execution.consecutiveFailures, 5);
    assert.equal(task?.execution.lastError, "boom-5");
  });
});

test("pruneScheduledTasks removes records whose cleanup deadline has passed", async () => {
  await withTestStore(async () => {
    await writeScheduledTaskIndex({
      version: 1,
      updatedAt: 0,
      tasks: [
        makeTask({
          id: "prune-me",
          name: "Prune me",
          cleanupAfterMs: 900,
        }),
        makeTask({
          id: "keep-me",
          name: "Keep me",
          cleanupAfterMs: 1_500,
        }),
      ],
    });

    const prunedCount = await pruneScheduledTasks(1_000);
    const index = await readScheduledTaskIndex();

    assert.equal(prunedCount, 1);
    assert.deepEqual(
      index.tasks.map((task) => task.id),
      ["keep-me"],
    );
  });
});

test("resolveTelegramTarget prefers explicit values and otherwise returns the remembered target", async () => {
  await withTestStore(async () => {
    await saveTelegramTarget("-100123", 42);

    const remembered = await resolveTelegramTarget(null);
    const explicit = await resolveTelegramTarget("-100777:9");

    assert.deepEqual(remembered, {
      chatId: "-100123",
      messageThreadId: 42,
      updatedAt: remembered?.updatedAt,
    });
    assert.deepEqual(explicit, {
      chatId: "-100777",
      messageThreadId: 9,
      updatedAt: explicit?.updatedAt,
    });
  });
});

test("resolveTelegramTarget rejects invalid explicit targets", async () => {
  await withTestStore(async () => {
    await assert.rejects(
      () => resolveTelegramTarget("not-a-chat-id"),
      /scheduler\.telegram_target_invalid/,
    );
  });
});
