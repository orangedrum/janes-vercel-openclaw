#!/usr/bin/env node
/**
 * Generate a sorted manifest of all protected admin and firewall route handlers.
 *
 * Usage:
 *   node scripts/generate-protected-route-manifest.mjs
 *
 * Output:
 *   - Writes src/app/api/auth/protected-route-manifest.json
 *   - Prints the manifest JSON to stdout (machine-readable)
 *   - Exits 0 on success
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const API_ROOT = join(process.cwd(), "src", "app", "api");
const ROUTE_ROOTS = [
  join(API_ROOT, "admin"),
  join(API_ROOT, "firewall"),
];
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function walk(dir) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function exportedMethods(source) {
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

function toApiPath(routeFile) {
  const rel = relative(API_ROOT, routeFile).split(sep).join("/");
  return `/api/${rel.replace(/\/route\.ts$/, "")}`;
}

const routes = ROUTE_ROOTS
  .flatMap((root) => {
    try {
      return walk(root);
    } catch {
      return [];
    }
  })
  .filter(
    (file) =>
      file.endsWith(`${sep}route.ts`) || file.endsWith("/route.ts"),
  )
  .flatMap((file) => {
    const source = readFileSync(file, "utf8");
    const path = toApiPath(file);
    return exportedMethods(source).map((method) => ({ method, path }));
  })
  .sort((a, b) =>
    `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`),
  );

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  roots: ["src/app/api/admin", "src/app/api/firewall"],
  routes,
};

const outFile = join(
  process.cwd(),
  "src",
  "app",
  "api",
  "auth",
  "protected-route-manifest.json",
);

writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`);

// Machine-readable output
const summary = {
  ok: true,
  routeCount: routes.length,
  outputFile: relative(process.cwd(), outFile),
};
process.stdout.write(`${JSON.stringify(summary)}\n`);
