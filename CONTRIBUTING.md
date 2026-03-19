# Contributing

## Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run typecheck
npm run build
```

Tests use Node's built-in `node:test` runner.

### Verification

Use this for all local automation and CI:

```bash
node scripts/verify.mjs
```

Run a subset:

```bash
node scripts/verify.mjs --steps=test,typecheck
```

### Remote smoke testing

```bash
npm run smoke:remote -- --base-url https://my-app.vercel.app
npm run smoke:remote -- --base-url https://my-app.vercel.app --destructive --timeout 180
```

See `CLAUDE.md` for the full list of smoke test flags.

## Architecture

The app has two planes:

- **Control plane** — a single metadata record in Upstash Redis (or in-memory for local dev). Tracks sandbox ID, snapshot ID, lifecycle status, firewall state, and the OpenClaw gateway token.
- **Enforcement plane** — the `@vercel/sandbox` SDK creates, restores, snapshots, and updates the sandbox network policy.

### Request flow

1. User opens `/gateway`
2. App authenticates the request
3. If no sandbox is running, schedules create/restore with `after()` and returns a waiting page
4. Once ready, proxies the request to the sandbox on port `3000`
5. HTML responses are modified to rewrite WebSocket connections and inject the gateway token

### Lifecycle states

`uninitialized` → `creating` → `setup` → `booting` → `running` → `stopped`

Also: `restoring`, `error`

### Restore fast path

`src/server/openclaw/restore-assets.ts` splits restore files into static (scripts, skills) and dynamic (`openclaw.json`). Static files use a manifest-based hash (`RestorePhaseMetrics.assetSha256`) to skip redundant uploads. Readiness is probed locally first, then publicly. Per-phase timings are recorded as `RestorePhaseMetrics` on metadata.

### Firewall modes

| Mode | Network policy |
| ---- | -------------- |
| `disabled` | `allow-all` |
| `learning` | `allow-all` (observes shell commands to discover domains) |
| `enforcing` | `{ allow: [...] }` |

### Channel delivery

1. Public webhook validates the platform signature
2. Handler publishes to a Vercel Queue topic
3. Private queue consumer restores the sandbox if needed
4. Consumer sends the message to OpenClaw's chat completions endpoint
5. App delivers the reply back to the originating channel

## Project structure

```
src/
├── app/
│   ├── api/                    # Auth, admin, firewall, status, health
│   ├── gateway/[[...path]]/    # Reverse proxy route
│   └── admin/                  # Admin page
├── components/
│   └── admin-shell.tsx         # Admin UI
├── server/
│   ├── auth/                   # Session cookies and Vercel OAuth
│   ├── channels/               # Channel adapters, queue driver
│   ├── firewall/               # Domain parsing, state, policy mapping
│   ├── openclaw/               # Config generation and bootstrap
│   ├── proxy/                  # HTML injection, waiting page
│   ├── sandbox/                # Lifecycle orchestration
│   └── store/                  # Upstash and in-memory backends
└── shared/
    └── types.ts                # Metadata and firewall types
```

## Environment variables

Full reference:

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `UPSTASH_REDIS_REST_URL` | Yes | Persistent store endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Persistent store token |
| `VERCEL_AUTH_MODE` | No | `admin-secret` (default) or `sign-in-with-vercel` |
| `NEXT_PUBLIC_VERCEL_APP_CLIENT_ID` | Sign-in mode | OAuth client ID |
| `VERCEL_APP_CLIENT_SECRET` | Sign-in mode | OAuth client secret |
| `SESSION_SECRET` | Sign-in mode | Cookie encryption secret |
| `OPENCLAW_PACKAGE_SPEC` | No | OpenClaw version to install (defaults to `openclaw@latest`). On Vercel the deployment contract **fails** when unset or unpinned (e.g. `openclaw@latest`); the runtime still falls back to `openclaw@latest` with a warning log. Pin to `openclaw@1.2.3` for deterministic restores and repeatable benchmarks. |
| `OPENCLAW_SANDBOX_VCPUS` | No | vCPU count for sandbox create and snapshot restore (valid: 1, 2, 4, 8; default: 1). Keep fixed during benchmarks. |
| `OPENCLAW_SANDBOX_SLEEP_AFTER_MS` | No | How long the sandbox stays alive after last activity, in milliseconds (60000–2700000; default: 1800000 = 30 min). Heartbeat and touch-throttle intervals are derived proportionally. Existing running sandboxes cannot be shortened in place. If you increase this value, the next touch/heartbeat can top the sandbox timeout up to the new target. If you decrease it, the lower value becomes exact on the next create or restore. |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | No | Appended to webhook URLs to pass Deployment Protection |
| `CRON_SECRET` | No | Enables `/api/cron/drain-channels` diagnostic backstop |
| `NEXT_PUBLIC_APP_URL` | No | Base origin override |
| `NEXT_PUBLIC_BASE_DOMAIN` | No | Preferred external host for webhook URLs |
| `BASE_DOMAIN` | No | Legacy alias for `NEXT_PUBLIC_BASE_DOMAIN` |
| `KV_REST_API_URL` | No | Alias for Upstash REST URL |
| `KV_REST_API_TOKEN` | No | Alias for Upstash REST token |

## Routes

| Route | Purpose |
| ----- | ------- |
| `/` | Admin shell |
| `/gateway` | Proxied OpenClaw UI |
| `/api/status` | Current sandbox state and heartbeat |
| `/api/admin/ensure` | Trigger create or restore |
| `/api/admin/stop` | Snapshot and stop |
| `/api/admin/preflight` | Deployment readiness checks |
| `/api/admin/launch-verify` | Full launch verification |
| `/api/channels/slack/webhook` | Public Slack webhook |
| `/api/channels/telegram/webhook` | Public Telegram webhook |
| `/api/channels/discord/webhook` | Public Discord interactions endpoint |

See `CLAUDE.md` for the complete route table and detailed system documentation.
