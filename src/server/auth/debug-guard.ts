import { logInfo } from "@/server/log";

/**
 * Check whether debug routes are explicitly enabled.
 *
 * Only "1", "true", "yes", and "on" (case-insensitive, trimmed) count as
 * enabled. Everything else — including "false", "0", "", and undefined —
 * evaluates to disabled.
 */
export function isDebugRoutesEnabled(
  raw: string | undefined = process.env.ENABLE_DEBUG_ROUTES,
): boolean {
  switch (raw?.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    default:
      return false;
  }
}

/**
 * Gate debug routes behind the ENABLE_DEBUG_ROUTES env var.
 * Returns a 404 response when the guard is not satisfied, or null to proceed.
 */
export function requireDebugEnabled(): Response | null {
  if (!isDebugRoutesEnabled()) {
    logInfo("debug_guard.blocked", { reason: "debug_routes_disabled" });
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}
