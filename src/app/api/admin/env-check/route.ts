import { requireJsonRouteAuth, authJsonOk, authJsonError } from "@/server/auth/route-auth";
import { jsonOk } from "@/shared/http";
import { getStore } from "@/server/store/store";
import { checkEnvironment, formatEnvWarnings, getStartupWarnings } from "@/server/env-checker";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireJsonRouteAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
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

    return authJsonOk({
      ok: true,
      results,
      warnings,
      formattedText,
      hasBlockers: warnings.hasBlockers,
      suppressedChecks: suppressedList,
      suppressAll,
      note: "Critical vars must be set. Optional vars enhance features (email validation, AI Gateway, channels). Pass ?suppressed=VAR1,VAR2 to hide warnings.",
    }, auth);
  } catch (err) {
    return authJsonError(err, auth);
  }
}

export async function PUT(request: Request): Promise<Response> {
  const auth = await requireJsonRouteAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const body = (await request.json()) as { suppress?: string[] | null; suppressAll?: boolean };

    // Store suppressed checks in metadata
    const store = getStore();
    const meta = await store.getMeta();
    if (!meta) {
      return authJsonError(new Error("No metadata found"), auth, { status: 404 });
    }

    // TODO: implement persistent storage of suppressed env checks when metadata extensibility is added
    // For now, just return the current state

    return authJsonOk({
      ok: true,
      message: "Env check suppression preferences noted (will persist in future version)",
    }, auth);
  } catch (err) {
    return authJsonError(err, auth);
  }
}
