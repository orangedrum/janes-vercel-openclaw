import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWorkerSandboxBatchSkill,
  buildWorkerSandboxBatchScript,
  OPENCLAW_WORKER_SANDBOX_BATCH_SCRIPT_PATH,
} from "@/server/openclaw/config";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("worker-sandbox-batch skill describes the batch entrypoint and JSON contract", () => {
  const skill = buildWorkerSandboxBatchSkill();

  assert.match(skill, /^---\nname: worker-sandbox-batch/m);
  assert.match(skill, /Fan out multiple bounded jobs/);
  assert.match(skill, new RegExp(escapeRegExp(OPENCLAW_WORKER_SANDBOX_BATCH_SCRIPT_PATH)));
  assert.match(skill, /WorkerSandboxBatchExecuteRequest shape/);
  assert.match(skill, /maxConcurrency/);
  assert.match(skill, /continueOnError/);
  assert.match(skill, /passAiGatewayKey/);
  assert.match(skill, /Response shape/);
  assert.match(skill, /totalJobs/);
  assert.match(skill, /succeeded/);
  assert.match(skill, /failed/);
  assert.match(skill, /results/);
});

test("worker-sandbox-batch skill includes cron-friendly scheduling example", () => {
  const skill = buildWorkerSandboxBatchSkill();

  assert.match(skill, /Scheduling with cron/);
  assert.match(skill, /openclaw cron add/);
  assert.match(skill, /--cron/);
  assert.match(skill, /--session isolated/);
});

test("worker-sandbox-batch script posts to the internal batch route with bearer auth", () => {
  const script = buildWorkerSandboxBatchScript();

  assert.match(script, /Could not resolve host origin from openclaw\.json/);
  assert.match(script, /worker-sandbox:v1\\0/);
  assert.match(script, /authorization:\s*"Bearer "\s*\+\s*bearer/);
  assert.match(script, /\/api\/internal\/worker-sandboxes\/execute-batch/);
  assert.match(script, /method:\s*"POST"/);
  assert.match(script, /"content-type":\s*"application\/json"/);
});

test("worker-sandbox-batch script reads request from file argument and outputs JSON to stdout", () => {
  const script = buildWorkerSandboxBatchScript();

  assert.match(script, /process\.argv\[2\]/);
  assert.match(script, /readFile\(requestPath/);
  assert.match(script, /console\.log\(text\)/);
  assert.match(script, /console\.error\(text\)/);
  assert.match(script, /process\.exit\(1\)/);
});

test("worker-sandbox-batch script exits non-zero on missing argument", () => {
  const script = buildWorkerSandboxBatchScript();

  assert.match(script, /Usage: execute-batch\.mjs <request-json-path>/);
  assert.match(script, /process\.exit\(1\)/);
});
