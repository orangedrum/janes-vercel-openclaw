import { getRequestContext } from "@/app/request-context";
import { buildResponse } from "@/components/api-route-errors";
import { checkEnvironment, formatEnvWarnings, getStartupWarnings } from "@/server/env-checker";
import { getMeta } from "@/server/sandbox/controller";

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = await getRequestContext(request);
    if (!auth.isValid) {
      return buildResponse(401, { error: "Unauthorized" });
    }

    const url = new URL(request.url);
    const suppressedStr = url.searchParams.get("suppressed");
    const suppressAll = url.searchParams.get("suppressAll") === "true";

    const suppressedList = suppressedStr ? suppressedStr.split(",") : [];

    const results = checkEnvironment({
      warnings: suppressedList,
      suppressAll,
    });

    const warnings = getStartupWarnings({
      warnings: suppressedList,
      suppressAll,
    });

    const formattedText = formatEnvWarnings(warnings);

    return buildResponse(200, {
      ok: true,
      results,
      warnings,
      formattedText,
      hasBlockers: warnings.hasBlockers,
      suppressedChecks: suppressedList,
      suppressAll,
      note: "Critical vars must be set. Optional vars enhance features (email validation, AI Gateway, channels). Pass ?suppressed=VAR1,VAR2 to hide warnings.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return buildResponse(500, { error: message });
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const auth = await getRequestContext(request);
    if (!auth.isValid) {
      return buildResponse(401, { error: "Unauthorized" });
    }

    const body = (await request.json()) as { suppress?: string[] | null; suppressAll?: boolean };

    // Store suppressed checks in metadata
    const meta = await getMeta();
    if (!meta) {
      return buildResponse(404, { error: "No metadata found" });
    }

    // TODO: implement persistent storage of suppressed env checks when metadata extensibility is added
    // For now, just return the current state

    return buildResponse(200, {
      ok: true,
      message: "Env check suppression preferences noted (will persist in future version)",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return buildResponse(500, { error: message });
  }
}
