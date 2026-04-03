/**
 * Shared admin read (GET) helper for panels.
 *
 * Centralises auth-expiry handling, error surfacing, and event emission
 * so that Logs, Firewall, Snapshots, and future read-only admin surfaces
 * all behave consistently.
 */

import {
  createAdminActionRequestId,
  emitAdminActionEvent,
} from "@/components/admin-shell";

export type ReadJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number | null };

export type ReadJsonDeps = {
  setStatus: (status: null) => void;
  toastError: (message: string) => void;
  fetchFn?: typeof fetch;
};

/**
 * Fetch a JSON admin GET endpoint with shared auth/error handling.
 *
 * - 401 clears auth state via `deps.setStatus(null)` and toasts.
 * - Non-401 errors surface visible panel error state.
 * - Emits `admin.read.error` for both auth and HTTP errors.
 */
export async function fetchAdminJsonCore<T>(
  action: string,
  deps: ReadJsonDeps,
): Promise<ReadJsonResult<T>> {
  const requestId = createAdminActionRequestId();
  const doFetch = deps.fetchFn ?? fetch;

  try {
    const response = await doFetch(action, {
      cache: "no-store" as RequestCache,
      headers: { accept: "application/json" },
    });

    if (response.status === 401) {
      deps.setStatus(null);
      const error = "Session expired. Sign in again.";
      emitAdminActionEvent({
        event: "admin.read.error",
        requestId,
        action,
        status: 401,
        code: "unauthorized",
        error,
      });
      deps.toastError(error);
      return { ok: false, error, status: 401 };
    }

    if (!response.ok) {
      const error = `Request failed (HTTP ${response.status})`;
      emitAdminActionEvent({
        event: "admin.read.error",
        requestId,
        action,
        status: response.status,
        code: "http-error",
        error,
      });
      deps.toastError(error);
      return { ok: false, error, status: response.status };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Network error";
    emitAdminActionEvent({
      event: "admin.read.error",
      requestId,
      action,
      status: null,
      code: "network-error",
      error,
    });
    deps.toastError(error);
    return { ok: false, error, status: null };
  }
}
