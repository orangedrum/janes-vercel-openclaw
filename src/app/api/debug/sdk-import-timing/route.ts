import { requireMutationAuth } from "@/server/auth/route-auth";

export async function POST(request: Request) {
  const auth = await requireMutationAuth(request);
  if (auth instanceof Response) return auth;

  const t1 = Date.now();
  const { Sandbox } = await import("@vercel/sandbox");
  const importMs = Date.now() - t1;

  const t2 = Date.now();
  const { Sandbox: Sandbox2 } = await import("@vercel/sandbox");
  const import2Ms = Date.now() - t2;

  // Prevent tree-shaking
  const proof = typeof Sandbox === "function" && typeof Sandbox2 === "function";

  return Response.json({ importMs, import2Ms, proof });
}
