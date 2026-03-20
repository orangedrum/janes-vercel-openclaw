import { requireJsonRouteAuth } from "@/server/auth/route-auth";
import { logError } from "@/server/log";
import { getInitializedMeta } from "@/server/store/store";
import { jsonError } from "@/shared/http";

type ChannelSummaryEntry = {
  connected: boolean;
  lastError: string | null;
};

type ChannelSummaryResponse = {
  slack: ChannelSummaryEntry;
  telegram: ChannelSummaryEntry;
  discord: ChannelSummaryEntry;
};

export async function GET(request: Request): Promise<Response> {
  const auth = await requireJsonRouteAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const meta = await getInitializedMeta();

    const body: ChannelSummaryResponse = {
      slack: {
        connected: meta.channels.slack !== null,
        lastError: meta.channels.slack?.lastError ?? null,
      },
      telegram: {
        connected: meta.channels.telegram !== null,
        lastError: meta.channels.telegram?.lastError ?? null,
      },
      discord: {
        connected: meta.channels.discord !== null,
        lastError: meta.channels.discord?.endpointError ?? null,
      },
    };

    const response = Response.json(body);
    if (auth.setCookieHeader) {
      response.headers.append("Set-Cookie", auth.setCookieHeader);
    }
    return response;
  } catch (error) {
    logError("channels.summary_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonError(error);
  }
}
