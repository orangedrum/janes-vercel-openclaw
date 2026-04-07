import { getRequestContext } from "@/app/request-context";
import { buildResponse } from "@/components/api-route-errors";
import { getMeta, getSandboxController } from "@/server/sandbox/controller";
import { summarizeRestoreCosts, formatCostSummary } from "@/server/cost-calculator";

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = await getRequestContext(request);
    if (!auth.isValid) {
      return buildResponse(401, { error: "Unauthorized" });
    }

    const meta = await getMeta();
    if (!meta) {
      return buildResponse(404, { error: "No sandbox metadata found" });
    }

    // batches per week can be passed as query param, defaults to 3
    const url = new URL(request.url);
    const batchesPerWeek = parseInt(url.searchParams.get("batches") || "3", 10);

    const summary = summarizeRestoreCosts(meta.lastRestoreMetrics, meta.restoreHistory, batchesPerWeek);
    const formatted = formatCostSummary(summary);

    return buildResponse(200, {
      ok: true,
      summary,
      formatted,
      note: "Cost projection assumes batchesPerWeek create + feedback cycles. Adjust 'batches' param to update.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return buildResponse(500, { error: message });
  }
}
