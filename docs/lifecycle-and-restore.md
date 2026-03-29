# Sandbox Lifecycle and Restore

## Lifecycle states

The sandbox moves through these states:

| State | Meaning |
| ----- | ------- |
| `uninitialized` | No sandbox has been created yet |
| `creating` | A fresh sandbox is being created and bootstrapped |
| `setup` | Bootstrap is writing config files and installing OpenClaw |
| `booting` | The gateway is starting up |
| `running` | The sandbox is healthy and serving requests |
| `stopped` | The sandbox was snapshotted and stopped |
| `restoring` | A snapshot restore is in progress |
| `error` | Something went wrong; may be recoverable |

## What "ensure running" does

Calling ensure does not always mean "create from scratch." The app picks the cheapest path:

- If no sandbox exists yet, it creates one from scratch (full bootstrap).
- If a snapshot exists and the sandbox is stopped, it restores from that snapshot.
- If the sandbox is already running and healthy, it does nothing.

The work is scheduled with `after()` so the API responds immediately with a waiting state. The browser polls until the sandbox is ready.

## What stop and snapshot mean today

Today, stopping and snapshotting both use the same flow: take a snapshot, then stop the sandbox. If that changes in the future, this page and the API reference should be updated together.

## Restore fast path

Restoring from a snapshot is faster than creating from scratch because most of the sandbox state is already in the snapshot. The restore path splits files into two groups to avoid redundant work.

### Static restore assets

These are files that only change when the app version changes: the startup script, force-pair script, skill markdown, skill scripts, and the built-in image-gen override.

Static assets are only rewritten when the restore asset hash (`assetSha256`) has changed since the last restore. If the app version has not changed, these uploads are skipped entirely.

### Dynamic restore assets

These are files that change with runtime configuration, primarily `openclaw.json`. Dynamic files are always checked against the current desired state using a config hash comparison.

### Readiness checks

Restore readiness is checked in two stages:

1. **Local-first readiness** — `curl http://localhost:3000/` inside the sandbox checks whether the gateway process started.
2. **Public readiness** — a fetch through the proxied app route checks whether the proxy, DNS, and public networking all work.

This separation makes it easy to tell whether a failure is inside the sandbox or in the path between the sandbox and the outside world.

## Cron wake behavior

OpenClaw has a built-in cron scheduler that persists jobs to `~/.openclaw/cron/jobs.json`. When the sandbox sleeps, the scheduler dies. The app bridges that gap:

1. **Before snapshot:** the app reads `jobs.json` from the sandbox, extracts the earliest next run time, and saves both the wake time and the full jobs payload to the durable store.
2. **On heartbeat:** the same data is refreshed in the store so it survives even if the sandbox times out naturally without an explicit stop.
3. **Every 5 minutes:** the watchdog cron (`/api/cron/watchdog`) checks if the saved wake time has passed. If it has and the sandbox is stopped, the watchdog restores the sandbox. OpenClaw's native cron takes over from there.
4. **After restore:** if `jobs.json` is empty on the restored sandbox but the store has a copy, the app writes the stored jobs back and restarts the gateway so the cron module reloads them.
5. **After wake:** the wake key is cleared only when the cron restore outcome is confirmed successful. If restore fails, the key is retained so the next watchdog run can retry.

The watchdog never runs chat completions, delivers messages, or interacts with channels. It only wakes the sandbox.

## Restore-prepared state

A sandbox can be "running" right now but still not be a good future restore target. The app tracks this separately.

### Statuses

| Status | Meaning |
| ------ | ------- |
| `unknown` | No information yet |
| `dirty` | The current snapshot does not match the desired config |
| `preparing` | A prepare cycle is in progress |
| `ready` | The snapshot is a verified reusable restore target |
| `failed` | Preparation was attempted and failed |

### Reasons

Common reasons for the current status:

- `snapshot-missing` — there is no snapshot to evaluate
- `dynamic-config-changed` — runtime config has drifted since the snapshot was taken
- `static-assets-changed` — app version changed and static assets no longer match
- `deployment-changed` — the deployment itself has changed
- `prepare-failed` — a prepare attempt did not succeed
- `prepared` — the snapshot matches desired state and is verified

### Example metadata

```json
{
  "restorePreparedStatus": "ready",
  "restorePreparedReason": "prepared",
  "snapshotDynamicConfigHash": "abc123",
  "runtimeDynamicConfigHash": "abc123",
  "snapshotAssetSha256": "def456",
  "runtimeAssetSha256": "def456"
}
```

### Why this matters

Launch verification and the watchdog both use restore-prepared state to decide whether a snapshot is safe to use. A stale snapshot that would boot with the wrong config is worse than no snapshot at all, because the sandbox would come up in a misconfigured state that is hard to diagnose.

## Where to read next

- [Preflight and Launch Verification](preflight-and-launch-verification.md) — how the app proves config and runtime readiness
- [API Reference](api-reference.md) — the exact request and response shapes for lifecycle endpoints
