import { requireMutationAuth } from "@/server/auth/route-auth";
import { getInitializedMeta, mutateMeta } from "@/server/store/store";
import { resolveAiGatewayCredentialOptional } from "@/server/env";
import { buildGatewayConfig } from "@/server/openclaw/config";
import { toNetworkPolicy } from "@/server/firewall/policy";
import { buildRestoreAssetManifest } from "@/server/openclaw/restore-assets";

export async function POST(request: Request) {
  const auth = await requireMutationAuth(request);
  if (auth instanceof Response) return auth;

  const timings: Array<{ step: string; ms: number }> = [];
  const mark = async <T>(step: string, fn: () => T | Promise<T>): Promise<T> => {
    const t = Date.now();
    const result = await fn();
    timings.push({ step, ms: Date.now() - t });
    return result;
  };

  await mark("getInitializedMeta_1", () => getInitializedMeta());
  const credential = await mark("resolveAiGatewayCredential", () =>
    resolveAiGatewayCredentialOptional(),
  );
  await mark("mutateMeta_restoring", () =>
    mutateMeta(() => {
      /* no-op for timing */
    }),
  );
  const latest = await mark("getInitializedMeta_2", () => getInitializedMeta());
  await mark("buildGatewayConfig", () =>
    buildGatewayConfig(credential?.token, "https://test.example.com"),
  );
  await mark("toNetworkPolicy", () =>
    toNetworkPolicy(latest.firewall.mode, latest.firewall.allowlist),
  );
  await mark("buildRestoreAssetManifest", () => buildRestoreAssetManifest());

  return Response.json({
    timings,
    total: timings.reduce((s, t) => s + t.ms, 0),
  });
}
