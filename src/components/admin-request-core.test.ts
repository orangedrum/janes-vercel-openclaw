import assert from "node:assert/strict";
import test from "node:test";

import { fetchAdminJsonCore, type ReadJsonDeps } from "./admin-request-core";

function makeDeps(overrides: Partial<ReadJsonDeps> = {}): ReadJsonDeps {
  return {
    setStatus: () => {},
    toastError: () => {},
    ...overrides,
  };
}

function mockFetch(status: number, body: unknown = null): typeof fetch {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
}

function throwingFetch(error: Error): typeof fetch {
  return async () => {
    throw error;
  };
}

test("fetchAdminJsonCore toasts network errors", async () => {
  const errors: string[] = [];

  const result = await fetchAdminJsonCore("/api/admin/logs", makeDeps({
    fetchFn: throwingFetch(new Error("Failed to fetch")),
    toastError: (message) => errors.push(message),
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(errors, ["Failed to fetch"]);
});

test("fetchAdminJsonCore toasts HTTP errors", async () => {
  const errors: string[] = [];

  const result = await fetchAdminJsonCore("/api/admin/logs", makeDeps({
    fetchFn: mockFetch(500, { message: "nope" }),
    toastError: (message) => errors.push(message),
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(errors, ["Request failed (HTTP 500)"]);
});
