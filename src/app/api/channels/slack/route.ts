import { ApiError } from "@/shared/http";
import { authJsonError, authJsonOk, requireJsonRouteAuth } from "@/server/auth/route-auth";
import {
  buildChannelConnectability,
  buildChannelConnectBlockedResponse,
} from "@/server/channels/connectability";
import { fetchSlackAuthIdentity } from "@/server/channels/slack/auth";
import { setSlackChannelConfig } from "@/server/channels/state";
import { getPublicChannelState } from "@/server/channels/state";
import { getInitializedMeta } from "@/server/store/store";

function parseNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} must be a non-empty string`);
  }

  return value.trim();
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireJsonRouteAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const url = new URL(request.url);
    const meta = await getInitializedMeta();
    const state = await getPublicChannelState(request);

    if (url.searchParams.get("diagnostics") === "1" && meta.channels.slack?.botToken) {
      const diagnostics = await fetchSlackAuthIdentity(meta.channels.slack.botToken)
        .then((identity) => ({
          authValid: true,
          ...identity,
        }))
        .catch((error) => ({
          authValid: false,
          error: error instanceof Error ? error.message : String(error),
        }));

      return authJsonOk({ ...state.slack, diagnostics }, auth);
    }

    return authJsonOk(state.slack, auth);
  } catch (error) {
    return authJsonError(error, auth);
  }
}

export async function PUT(request: Request): Promise<Response> {
  const auth = await requireJsonRouteAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  const connectability = await buildChannelConnectability("slack", request);
  if (!connectability.canConnect) {
    return buildChannelConnectBlockedResponse(auth, connectability);
  }

  try {
    const body = (await request.json()) as {
      signingSecret?: unknown;
      botToken?: unknown;
    };
    const signingSecret = parseNonEmptyString(body.signingSecret, "signingSecret");
    const botToken = parseNonEmptyString(body.botToken, "botToken");
    const authTest = await fetchSlackAuthIdentity(botToken).catch((error) => {
      const code = error instanceof Error ? error.message : String(error);
      throw new ApiError(400, code, code);
    });

    const configuredAt = Date.now();
    await setSlackChannelConfig({
      signingSecret,
      botToken,
      configuredAt,
      team: authTest.team,
      user: authTest.user,
      botId: authTest.botId,
    });

    const state = await getPublicChannelState(request);
    return authJsonOk(state.slack, auth);
  } catch (error) {
    return authJsonError(error, auth);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const auth = await requireJsonRouteAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    await setSlackChannelConfig(null);
    const state = await getPublicChannelState(request);
    return authJsonOk(state.slack, auth);
  } catch (error) {
    return authJsonError(error, auth);
  }
}
