#!/usr/bin/env node

/**
 * Machine-readable remote deployment readiness gate.
 *
 * Posts to /api/admin/launch-verify to run the full launch verification
 * contract (preflight + store self-test + sandbox + gateway).
 *
 * Falls back to GET /api/admin/preflight when --preflight-only is set,
 * for lightweight config-only checks.
 *
 * Exit codes:
 *   0 — pass (deployment is ready)
 *   1 — contract-fail (verification returned data that violates the launch contract)
 *   2 — bad-args (missing or invalid CLI arguments)
 *   3 — fetch-fail (network error reaching the endpoint)
 *   4 — bad-response (non-OK HTTP status or non-JSON response)
 *
 * Secrets:
 *   --protection-bypass flag or VERCEL_AUTOMATION_BYPASS_SECRET env var.
 *   Never passed as positional args, never logged unredacted.
 *
 * Usage:
 *   node scripts/check-deploy-readiness.mjs --base-url <url> [--json-only]
 *   node scripts/check-deploy-readiness.mjs --base-url <url> --preflight-only [--json-only]
 *   node scripts/check-deploy-readiness.mjs --base-url <url> --mode destructive [--json-only]
 */

import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "base-url": { type: "string" },
    "protection-bypass": { type: "string" },
    "timeout-ms": { type: "string", default: "180000" },
    mode: { type: "string", default: "safe" },
    "preflight-only": { type: "boolean", default: false },
    "expect-store": { type: "string", default: "upstash" },
    "expect-ai-gateway-auth": { type: "string", default: "oidc" },
    "expect-ok": { type: "boolean", default: true },
    "json-only": { type: "boolean", default: false },
  },
});

const jsonOnly = values["json-only"];
const preflightOnly = values["preflight-only"];

function redactSecret(input, secret) {
  if (!secret) return input;
  return input.split(secret).join("[redacted]");
}

function log(message) {
  if (!jsonOnly) {
    process.stderr.write(`[check-deploy-readiness] ${message}\n`);
  }
}

function fail(code, message, details = {}) {
  const payload = { ok: false, code, message, ...details };
  const rendered = jsonOnly
    ? JSON.stringify(payload)
    : JSON.stringify(payload, null, 2);
  console.error(rendered);
  switch (code) {
    case "MISSING_BASE_URL":
    case "INVALID_TIMEOUT":
    case "INVALID_MODE":
      process.exit(2);
      break;
    case "FETCH_FAILED":
      process.exit(3);
      break;
    case "INVALID_RESPONSE":
    case "BAD_STATUS":
      process.exit(4);
      break;
    default:
      process.exit(1);
  }
}

// --- Resolve inputs ---

const baseUrl =
  values["base-url"]?.trim() ||
  process.env.OPENCLAW_BASE_URL?.trim() ||
  "";

if (!baseUrl) {
  fail(
    "MISSING_BASE_URL",
    "Provide --base-url or set OPENCLAW_BASE_URL env var.",
  );
}

const timeoutMs = Number.parseInt(values["timeout-ms"], 10);
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  fail("INVALID_TIMEOUT", "--timeout-ms must be a positive integer.");
}

const mode = values.mode;
if (mode !== "safe" && mode !== "destructive") {
  fail("INVALID_MODE", "--mode must be 'safe' or 'destructive'.");
}

const bypass =
  values["protection-bypass"]?.trim() ||
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ||
  "";

// --- Run check ---

if (preflightOnly) {
  await runPreflightCheck();
} else {
  await runLaunchVerify();
}

// --- Launch-verify flow ---

async function runLaunchVerify() {
  const url = new URL("/api/admin/launch-verify", baseUrl);
  if (bypass) {
    url.searchParams.set("x-vercel-protection-bypass", bypass);
  }
  const redactedUrl = redactSecret(url.toString(), bypass);
  log(`POST ${redactedUrl} mode=${mode}`);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    fail("FETCH_FAILED", "Failed to fetch /api/admin/launch-verify.", {
      url: redactedUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  log(`status=${response.status}`);

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    fail("INVALID_RESPONSE", "launch-verify did not return JSON.", {
      status: response.status,
      url: redactedUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!response.ok || !payload || typeof payload !== "object") {
    fail("BAD_STATUS", "launch-verify request failed.", {
      status: response.status,
      url: redactedUrl,
      payload,
    });
  }

  // --- Validate launch contract ---
  const phases = Array.isArray(payload.phases) ? payload.phases : [];
  const failures = [];

  if (values["expect-ok"] && payload.ok !== true) {
    failures.push("payload.ok !== true");
  }

  for (const phase of phases) {
    if (phase.status === "fail") {
      failures.push(`phase ${phase.id} failed: ${phase.error ?? phase.message}`);
    }
  }

  const result = {
    ok: failures.length === 0,
    url: redactedUrl,
    status: response.status,
    mode: payload.mode ?? mode,
    summary: {
      ok: payload.ok ?? null,
      startedAt: payload.startedAt ?? null,
      completedAt: payload.completedAt ?? null,
      phaseCount: phases.length,
    },
    phases: phases.map((p) => ({
      id: p.id,
      status: p.status,
      durationMs: p.durationMs,
      message: p.message,
      ...(p.error ? { error: p.error } : {}),
    })),
    failures,
  };

  const rendered = jsonOnly
    ? JSON.stringify(result)
    : JSON.stringify(result, null, 2);

  if (result.ok) {
    log("PASS — deployment verified");
    console.log(rendered);
    process.exit(0);
  } else {
    log(`FAIL — ${failures.length} contract violation(s)`);
    console.error(rendered);
    process.exit(1);
  }
}

// --- Preflight-only flow (backward compatible) ---

async function runPreflightCheck() {
  const url = new URL("/api/admin/preflight", baseUrl);
  if (bypass) {
    url.searchParams.set("x-vercel-protection-bypass", bypass);
  }
  const redactedUrl = redactSecret(url.toString(), bypass);
  log(`GET ${redactedUrl}`);

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    fail("FETCH_FAILED", "Failed to fetch /api/admin/preflight.", {
      url: redactedUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  log(`status=${response.status}`);

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    fail("INVALID_RESPONSE", "Preflight did not return JSON.", {
      status: response.status,
      url: redactedUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!response.ok || !payload || typeof payload !== "object") {
    fail("BAD_STATUS", "Preflight request failed.", {
      status: response.status,
      url: redactedUrl,
      payload,
    });
  }

  const checks = Array.isArray(payload.checks) ? payload.checks : [];
  const actions = Array.isArray(payload.actions) ? payload.actions : [];
  const channels =
    payload.channels && typeof payload.channels === "object"
      ? payload.channels
      : {};

  const failures = [];

  if (values["expect-ok"] && payload.ok !== true) {
    failures.push("payload.ok !== true");
  }
  if (payload.storeBackend !== values["expect-store"]) {
    failures.push(
      `storeBackend=${payload.storeBackend ?? "null"}, expected=${values["expect-store"]}`,
    );
  }
  if (payload.aiGatewayAuth !== values["expect-ai-gateway-auth"]) {
    failures.push(
      `aiGatewayAuth=${payload.aiGatewayAuth ?? "null"}, expected=${values["expect-ai-gateway-auth"]}`,
    );
  }
  if (checks.some((check) => check && check.status === "fail")) {
    failures.push("checks contain fail");
  }
  if (
    Object.values(channels).some(
      (channel) =>
        channel &&
        typeof channel === "object" &&
        channel.status === "fail",
    )
  ) {
    failures.push("channels contain fail");
  }

  const result = {
    ok: failures.length === 0,
    url: redactedUrl,
    status: response.status,
    summary: {
      ok: payload.ok ?? null,
      authMode: payload.authMode ?? null,
      publicOrigin: payload.publicOrigin ?? null,
      storeBackend: payload.storeBackend ?? null,
      aiGatewayAuth: payload.aiGatewayAuth ?? null,
      webhookBypassEnabled: payload.webhookBypassEnabled ?? null,
      cronSecretConfigured: payload.cronSecretConfigured ?? null,
    },
    failingChecks: checks.filter((check) => check && check.status === "fail"),
    requiredActions: actions.filter(
      (action) => action && action.status === "required",
    ),
    channelStatuses: Object.fromEntries(
      Object.entries(channels).map(([name, info]) => [
        name,
        info && typeof info === "object" ? info.status ?? null : null,
      ]),
    ),
    failures,
  };

  const rendered = jsonOnly
    ? JSON.stringify(result)
    : JSON.stringify(result, null, 2);

  if (result.ok) {
    log("PASS — deployment is channel-ready");
    console.log(rendered);
    process.exit(0);
  } else {
    log(`FAIL — ${failures.length} contract violation(s)`);
    console.error(rendered);
    process.exit(1);
  }
}
