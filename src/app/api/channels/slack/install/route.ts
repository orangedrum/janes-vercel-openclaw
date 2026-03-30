import { randomBytes, timingSafeEqual } from "node:crypto";

import { requireAdminAuth } from "@/server/auth/admin-auth";
import {
  encryptPayload,
  getCookieValue,
  isSecureRequest,
  serializeCookie,
  decryptPayload,
} from "@/server/auth/session";
import { buildChannelConnectability } from "@/server/channels/connectability";
import { SLACK_BOT_SCOPES } from "@/server/channels/slack/app-definition";
import { getSlackInstallConfig } from "@/server/channels/slack/install-config";
import { logInfo, logWarn } from "@/server/log";
import { getPublicOrigin } from "@/server/public-url";

export const SLACK_OAUTH_STATE_COOKIE = "slack_oauth_state";
export const SLACK_OAUTH_CTX_COOKIE = "slack_oauth_ctx";

const SLACK_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";

export type SlackOAuthContext = {
  next: string;
};

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  const installConfig = getSlackInstallConfig();
  if (!installConfig.enabled) {
    logWarn("slack_install.missing_app_credentials");
    return redirectToAdmin(request, "missing_app_credentials");
  }

  const connectability = await buildChannelConnectability("slack", request);
  if (!connectability.canConnect) {
    logWarn("slack_install.connect_blocked", {
      issues: connectability.issues.map((i) => i.id),
    });
    return redirectToAdmin(request, "connect_blocked");
  }

  const state = randomBytes(24).toString("base64url");
  const secure = isSecureRequest(request);
  const redirectUri = `${getPublicOrigin(request)}/api/channels/slack/install/callback`;

  const url = new URL(SLACK_AUTHORIZE_URL);
  url.searchParams.set("client_id", installConfig.clientId!);
  url.searchParams.set("scope", SLACK_BOT_SCOPES.join(","));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  logInfo("slack_install.authorize_redirect", { redirectUri });

  const headers = new Headers({ Location: url.toString() });
  headers.append(
    "Set-Cookie",
    serializeCookie(SLACK_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: 5 * 60,
      path: "/",
      sameSite: "Lax",
      secure,
    }),
  );
  headers.append(
    "Set-Cookie",
    await serializeSlackOAuthContextCookie({ next: "/admin" }, secure),
  );

  return new Response(null, { status: 302, headers });
}

function redirectToAdmin(request: Request, error: string): Response {
  const url = new URL("/admin", request.url);
  url.searchParams.set("slack_install_error", error);
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() },
  });
}

// ── Cookie helpers ──

export async function serializeSlackOAuthContextCookie(
  value: SlackOAuthContext,
  secure: boolean,
): Promise<string> {
  const encrypted = await encryptPayload({ next: value.next }, "5m");
  return serializeCookie(SLACK_OAUTH_CTX_COOKIE, encrypted, {
    httpOnly: true,
    maxAge: 5 * 60,
    path: "/",
    sameSite: "Lax",
    secure,
  });
}

export async function readSlackOAuthContextFromRequest(
  request: Request,
): Promise<SlackOAuthContext | null> {
  const raw = getCookieValue(request, SLACK_OAUTH_CTX_COOKIE);
  if (!raw) return null;

  const payload = await decryptPayload<{ next?: string }>(raw);
  if (!payload || typeof payload.next !== "string") return null;

  return { next: payload.next };
}

export function timingSafeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
