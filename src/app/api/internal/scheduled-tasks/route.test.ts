import assert from "node:assert/strict";
import test from "node:test";

import { readScheduledTaskIndex } from "@/server/scheduler/store";
import { _resetStoreForTesting } from "@/server/store/store";
import { buildPostRequest, callRoute } from "@/test-utils/route-caller";

import { POST } from "./route";

async function withTestEnv(fn: () => Promise<void>): Promise<void> {
  const keys = [
    "NODE_ENV",
    "VERCEL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
    "OPENCLAW_SCHEDULER_HOST_SECRET",
  ];
  const originals: Record<string, string | undefined> = {};

  for (const key of keys) {
    originals[key] = process.env[key];
  }

  (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  delete process.env.VERCEL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.OPENCLAW_SCHEDULER_HOST_SECRET;

  _resetStoreForTesting();

  try {
    await fn();
  } finally {
    for (const key of keys) {
      if (originals[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originals[key];
      }
    }
    _resetStoreForTesting();
  }
}

function buildAuthorizedRequest(body: string): Request {
  return buildPostRequest("/api/internal/scheduled-tasks", body, {
    authorization: "Bearer test-scheduler-secret",
  });
}

test("POST /api/internal/scheduled-tasks returns 401 when the host secret is missing", async () => {
  await withTestEnv(async () => {
    const request = buildPostRequest(
      "/api/internal/scheduled-tasks",
      JSON.stringify({
        name: "unauthorized task",
        schedule: { kind: "at", at: "2026-03-21T18:00:00.000Z" },
        payload: { kind: "systemEvent", text: "hello" },
      }),
      { authorization: "Bearer test-scheduler-secret" },
    );

    const result = await callRoute(POST, request);

    assert.equal(result.status, 401);
    assert.deepEqual(result.json, {
      error: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });
});

test("POST /api/internal/scheduled-tasks returns 400 when name is missing", async () => {
  await withTestEnv(async () => {
    process.env.OPENCLAW_SCHEDULER_HOST_SECRET = "test-scheduler-secret";

    const request = buildAuthorizedRequest(
      JSON.stringify({
        schedule: { kind: "at", at: "2026-03-21T18:00:00.000Z" },
        payload: { kind: "systemEvent", text: "hello" },
      }),
    );

    const result = await callRoute(POST, request);

    assert.equal(result.status, 400);
    assert.deepEqual(result.json, {
      error: "INVALID_NAME",
      message: "name must be a non-empty string.",
    });
  });
});

test("POST /api/internal/scheduled-tasks stores one-time tasks with sandbox defaults", async () => {
  await withTestEnv(async () => {
    process.env.OPENCLAW_SCHEDULER_HOST_SECRET = "test-scheduler-secret";

    const scheduledAt = "2026-03-21T18:00:00.000Z";
    const request = buildAuthorizedRequest(
      JSON.stringify({
        name: "One-time sandbox task",
        schedule: { kind: "at", at: scheduledAt },
        payload: { kind: "systemEvent", text: "Run once" },
      }),
    );

    const result = await callRoute(POST, request);

    assert.equal(result.status, 200);
    const body = result.json as { ok: boolean; taskId: string; nextRunAtMs: number };
    assert.equal(body.ok, true);
    assert.ok(body.taskId);
    assert.equal(body.nextRunAtMs, Date.parse(scheduledAt));

    const index = await readScheduledTaskIndex();
    assert.equal(index.tasks.length, 1);

    const [task] = index.tasks;
    assert.equal(task?.id, body.taskId);
    assert.equal(task?.name, "One-time sandbox task");
    assert.equal(task?.enabled, true);
    assert.deepEqual(task?.schedule, { kind: "at", at: scheduledAt });
    assert.equal(task?.nextRunAtMs, Date.parse(scheduledAt));
    assert.equal(task?.deleteAfterRun, true);
    assert.equal(task?.sessionTarget, "isolated");
    assert.deepEqual(task?.delivery, { mode: "none" });
    assert.equal(task?.wakeMode, "now");
    assert.equal(task?.cleanupAfterMs, null);
    assert.deepEqual(task?.execution, {
      state: "scheduled",
      attemptCount: 0,
      consecutiveFailures: 0,
      leaseExpiresAtMs: null,
      claimToken: null,
      lastError: null,
    });
  });
});

test("POST /api/internal/scheduled-tasks computes nextRunAtMs for repeating tasks", async () => {
  await withTestEnv(async () => {
    process.env.OPENCLAW_SCHEDULER_HOST_SECRET = "test-scheduler-secret";
    const originalDateNow = Date.now;
    Date.now = () => 10_000;

    try {
      const request = buildAuthorizedRequest(
        JSON.stringify({
          name: "Repeating sandbox task",
          schedule: { kind: "every", everyMs: 120_000 },
          payload: { kind: "agentTurn", message: "Ping agent" },
        }),
      );

      const result = await callRoute(POST, request);

      assert.equal(result.status, 200);
      assert.deepEqual(result.json, {
        ok: true,
        taskId: (result.json as { taskId: string }).taskId,
        nextRunAtMs: 130_000,
      });

      const index = await readScheduledTaskIndex();
      assert.equal(index.tasks.length, 1);
      assert.equal(index.tasks[0]?.nextRunAtMs, 130_000);
      assert.equal(index.tasks[0]?.deleteAfterRun, false);
    } finally {
      Date.now = originalDateNow;
    }
  });
});

test("POST /api/internal/scheduled-tasks computes nextRunAtMs for cron tasks", async () => {
  await withTestEnv(async () => {
    process.env.OPENCLAW_SCHEDULER_HOST_SECRET = "test-scheduler-secret";
    const originalDateNow = Date.now;
    Date.now = () => 20_000;

    try {
      const request = buildAuthorizedRequest(
        JSON.stringify({
          name: "Cron sandbox task",
          schedule: { kind: "cron", expr: "*/5 * * * *" },
          payload: { kind: "systemEvent", text: "Cron tick" },
        }),
      );

      const result = await callRoute(POST, request);

      assert.equal(result.status, 200);
      assert.deepEqual(result.json, {
        ok: true,
        taskId: (result.json as { taskId: string }).taskId,
        nextRunAtMs: 320_000,
      });

      const index = await readScheduledTaskIndex();
      assert.equal(index.tasks.length, 1);
      assert.equal(index.tasks[0]?.nextRunAtMs, 320_000);
      assert.equal(index.tasks[0]?.deleteAfterRun, false);
    } finally {
      Date.now = originalDateNow;
    }
  });
});
