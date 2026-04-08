import { requireJsonRouteAuth, authJsonOk, authJsonError } from "@/server/auth/route-auth";
import { getStore } from "@/server/store/store";
import { summarizeRestoreCosts, formatCostSummary } from "@/server/cost-calculator";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireJsonRouteAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const store = getStore();
    const meta = await store.getMeta();
    if (!meta) {
      return authJsonError(new Error("No sandbox metadata found"), auth, { status: 404 });
    }

    // batches per week can be passed as query param, defaults to 3
    const url = new URL(request.url);
    const batchesPerWeek = parseInt(url.searchParams.get("batches") || "3", 10);

    const summary = summarizeRestoreCosts(meta.lastRestoreMetrics, meta.restoreHistory, batchesPerWeek);
    const formatted = formatCostSummary(summary);

    return authJsonOk({
      ok: true,
      summary,
      formatted,
      note: "Cost projection assumes batchesPerWeek create + feedback cycles. Adjust 'batches' param to update.",
    }, auth);
  } catch (err) {
    return authJsonError(err, auth);
  }
}
