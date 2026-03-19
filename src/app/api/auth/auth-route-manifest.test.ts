/**
 * Auth route manifest tests.
 *
 * 1. Verifies the checked-in manifest matches the current admin/firewall route surface.
 * 2. Verifies every discovered admin/firewall route handler calls an auth gate.
 *
 * If test 1 fails, run: node scripts/generate-protected-route-manifest.mjs
 *
 * Run: npm test src/app/api/auth/auth-route-manifest.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import test from "node:test";

const API_ROOT = join(process.cwd(), "src", "app", "api");
const ROUTE_ROOTS = [join(API_ROOT, "admin"), join(API_ROOT, "firewall")];

const METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

const AUTH_TOKENS = [
  "requireJsonRouteAuth(",
  "requireMutationAuth(",
  "requireAdminAuth(",
  "requireAdminMutationAuth(",
] as const;

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function exportedMethods(source: string): string[] {
  return METHODS.filter((method) => {
    const fnPattern = new RegExp(
      `export\\s+async\\s+function\\s+${method}\\b`,
      "m",
    );
    const constPattern = new RegExp(
      `export\\s+const\\s+${method}\\s*=`,
      "m",
    );
    return fnPattern.test(source) || constPattern.test(source);
  });
}

function toApiPath(routeFile: string): string {
  const rel = relative(API_ROOT, routeFile).split(sep).join("/");
  return `/api/${rel.replace(/\/route\.ts$/, "")}`;
}

function discoverRoutes(): Array<{
  method: string;
  path: string;
  file: string;
  source: string;
}> {
  return ROUTE_ROOTS.flatMap((root) => {
    try {
      return walk(root);
    } catch {
      return [] as string[];
    }
  })
    .filter(
      (file) =>
        file.endsWith(`${sep}route.ts`) || file.endsWith("/route.ts"),
    )
    .filter((file) => !file.endsWith(".test.ts"))
    .flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const path = toApiPath(file);
      return exportedMethods(source).map((method) => ({
        method,
        path,
        file,
        source,
      }));
    })
    .sort((a, b) =>
      `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`),
    );
}

function readManifest(): { routes: Array<{ method: string; path: string }> } {
  const manifestPath = join(
    process.cwd(),
    "src",
    "app",
    "api",
    "auth",
    "protected-route-manifest.json",
  );
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

test("protected route manifest matches current admin/firewall surface", () => {
  const discovered = discoverRoutes().map(({ method, path }) => ({
    method,
    path,
  }));
  const manifest = readManifest();

  assert.deepEqual(
    discovered,
    manifest.routes,
    [
      "Protected route manifest is stale.",
      "Run: node scripts/generate-protected-route-manifest.mjs",
    ].join("\n"),
  );
});

test("every discovered admin/firewall route uses an auth gate", () => {
  const missing = discoverRoutes()
    .filter(
      ({ source }) =>
        !AUTH_TOKENS.some((token) => source.includes(token)),
    )
    .map(({ method, file }) => `${method} ${relative(process.cwd(), file)}`);

  assert.deepEqual(
    missing,
    [],
    `Routes missing auth gate:\n${missing.map((f) => `  - ${f}`).join("\n")}`,
  );
});
