import { authJsonOk, requireJsonRouteAuth } from "@/server/auth/route-auth";
import { readAllChannelQueueHealth } from "@/server/channels/health";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireJsonRouteAuth(request);
  if (auth instanceof Response) {
    return auth;
  }

  const payload = await readAllChannelQueueHealth();
  return authJsonOk(payload, auth);
}
