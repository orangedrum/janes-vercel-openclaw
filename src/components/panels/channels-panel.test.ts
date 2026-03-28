import assert from "node:assert/strict";
import test from "node:test";

import {
  getPreflightBlockerIds,
  summarizePreflight,
  formatPreflightFetchError,
} from "./channels-panel";

test("getPreflightBlockerIds returns failing check IDs", () => {
  const ids = getPreflightBlockerIds({
    ok: false,
    checks: [
      { id: "store", status: "fail", message: "Durable state missing." },
      { id: "webhook-bypass", status: "warn", message: "Bypass not configured." },
      { id: "ai-gateway", status: "fail", message: "AI gateway unavailable." },
    ],
  });
  assert.deepEqual([...(ids ?? [])].sort(), ["ai-gateway", "store"]);
});

test("getPreflightBlockerIds returns null when preflight is null", () => {
  assert.equal(getPreflightBlockerIds(null), null);
});

test("getPreflightBlockerIds returns null when preflight.ok is true", () => {
  const ids = getPreflightBlockerIds({
    ok: true,
    checks: [{ id: "store", status: "fail", message: "ignored when ok" }],
  });
  assert.equal(ids, null);
});

test("summarizePreflight keeps blocker ids separate from required action ids", () => {
  const summary = summarizePreflight({
    ok: false,
    checks: [
      { id: "store", status: "fail", message: "Using in-memory state." },
      { id: "ai-gateway", status: "fail", message: "OIDC token is not available." },
    ],
    actions: [
      {
        id: "configure-upstash",
        status: "required",
        message: "Add a durable store.",
        remediation: "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
        env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      },
      {
        id: "configure-ai-gateway-auth",
        status: "required",
        message: "Enable AI Gateway auth.",
        remediation: "Enable OIDC or set AI_GATEWAY_API_KEY.",
        env: ["AI_GATEWAY_API_KEY"],
      },
      {
        id: "set-webhook-bypass",
        status: "recommended",
        message: "Bypass is recommended.",
        remediation: "Set VERCEL_AUTOMATION_BYPASS_SECRET.",
        env: ["VERCEL_AUTOMATION_BYPASS_SECRET"],
      },
    ],
  });
  assert.deepEqual(summary.blockerIds, ["store", "ai-gateway"]);
  assert.deepEqual(summary.blockerMessages, [
    "Using in-memory state.",
    "OIDC token is not available.",
  ]);
  assert.deepEqual(summary.requiredActionIds, [
    "configure-upstash",
    "configure-ai-gateway-auth",
  ]);
  assert.deepEqual(summary.requiredRemediations, [
    "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    "Enable OIDC or set AI_GATEWAY_API_KEY.",
  ]);
});

test("summarizePreflight returns an empty summary for null input", () => {
  assert.deepEqual(summarizePreflight(null), {
    ok: null,
    blockerIds: [],
    blockerMessages: [],
    requiredActionIds: [],
    requiredRemediations: [],
  });
});

test("formatPreflightFetchError prefers an explicit error message", () => {
  assert.equal(
    formatPreflightFetchError(
      new Error("Failed to load deployment preflight: HTTP 500"),
    ),
    "Failed to load deployment preflight: HTTP 500",
  );
  assert.equal(
    formatPreflightFetchError(null),
    "Failed to load deployment preflight. Refresh the panel or open /api/admin/preflight.",
  );
});
