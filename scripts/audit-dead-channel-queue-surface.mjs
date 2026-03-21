#!/usr/bin/env node
/**
 * Machine-readable audit: detect dead channel-queue surface left over
 * after the migration to Workflow DevKit.
 *
 * Exit 0 + JSON { schemaVersion: 1, ok: true, violations: [] } when clean.
 * Exit 1 + JSON { schemaVersion: 1, ok: false, violations: [...] } when drift detected.
 *
 * Launch-verify queue references (/api/queues/launch-verify,
 * src/server/launch-verify/queue-probe.ts) are intentionally excluded.
 */
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SELF_REL = "scripts/audit-dead-channel-queue-surface.mjs";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".json",
  ".js",
  ".cjs",
  ".mjs",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
  ".sh",
]);

const TARGETS = [
  "src",
  "scripts",
  "README.md",
  "CLAUDE.md",
  ".env.example",
  "package.json",
  "vercel.json",
];

/** Banned tokens — each hit outside the self-exclusion list is a violation. */
const BANNED = [
  { id: "queueDepth", pattern: /\bqueueDepth\b/g },
  { id: "channel-store-drain", pattern: /\bchannel\.store\.drain\b/g },
  { id: "preflight-drain-recovery", pattern: /\bdrain-recovery\b/g },
  {
    id: "channel-queue-routes",
    pattern: /\/api\/queues\/channels\/(?:slack|telegram|discord)\b/g,
  },
  { id: "channel-queue-health-card", pattern: /\bChannelQueueHealthCard\b/g },
  { id: "vercel-queue-dependency", pattern: /\b@vercel\/queue\b/g },
  {
    id: "stale-channel-transport-docs",
    pattern:
      /Channel delivery uses Vercel Queues as the primary durable transport\./g,
  },
];

/** Files that legitimately reference banned tokens (meta-guards, this script). */
const EXCLUDED_FILES = new Set([SELF_REL]);

function collectFiles(pathName) {
  const absolutePath = join(ROOT, pathName);
  if (!existsSync(absolutePath)) return [];

  const stat = lstatSync(absolutePath);
  if (stat.isFile()) return [pathName];
  if (!stat.isDirectory()) return [];

  const results = [];
  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.isDirectory()) {
      results.push(...collectFiles(join(pathName, entry.name)));
    } else if (entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name))) {
      results.push(join(pathName, entry.name));
    }
  }
  return results;
}

function lineAndColumn(text, index) {
  const before = text.slice(0, index);
  const lines = before.split("\n");
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function collectViolations(filePath, text) {
  const violations = [];
  for (const rule of BANNED) {
    // Reset lastIndex for each file since patterns use /g
    rule.pattern.lastIndex = 0;
    for (const match of text.matchAll(rule.pattern)) {
      const at = match.index ?? 0;
      const { line, column } = lineAndColumn(text, at);
      violations.push({
        id: rule.id,
        file: filePath,
        line,
        column,
        match: match[0],
      });
    }
  }
  return violations;
}

// --- main ---

const files = Array.from(new Set(TARGETS.flatMap(collectFiles))).sort();

const violations = files
  .filter((f) => !EXCLUDED_FILES.has(f))
  .flatMap((file) =>
    collectViolations(file, readFileSync(join(ROOT, file), "utf8")),
  );

const report = {
  schemaVersion: 1,
  ok: violations.length === 0,
  violations,
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
