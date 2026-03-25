import type { ChannelName } from "@/shared/channels";
import { getOpenclawInstanceId } from "@/server/env";

function buildKey(suffix: string): string {
  return `${getOpenclawInstanceId()}:${suffix}`;
}

export function metaKey(): string {
  return buildKey("meta");
}

export function initLockKey(): string {
  return buildKey("lock:init");
}

export function lifecycleLockKey(): string {
  return buildKey("lock:lifecycle");
}

export function startLockKey(): string {
  return buildKey("lock:start");
}

export function tokenRefreshLockKey(): string {
  return buildKey("lock:token-refresh");
}

export function cronNextWakeKey(): string {
  return buildKey("cron-next-wake-ms");
}

export function cronJobsKey(): string {
  return buildKey("cron-jobs-json");
}

export function adminSecretKey(): string {
  return buildKey("admin-secret");
}

export function learningLockKey(): string {
  return buildKey("lock:learning-refresh");
}

export function debugLockKey(): string {
  return buildKey("lock:debug-timing");
}

export function channelQueueKey(channel: ChannelName): string {
  return buildKey(`channels:${channel}:queue`);
}

export function channelProcessingKey(channel: ChannelName): string {
  return buildKey(`channels:${channel}:processing`);
}

export function channelFailedKey(channel: ChannelName): string {
  return buildKey(`channels:${channel}:failed`);
}

export function channelDrainLockKey(channel: ChannelName): string {
  return buildKey(`channels:${channel}:drain-lock`);
}

export function channelSessionHistoryKey(
  channel: ChannelName,
  sessionKey: string,
): string {
  return buildKey(`channels:${channel}:history:${sessionKey}`);
}

export function channelDedupKey(channel: ChannelName, dedupId: string): string {
  return buildKey(`channels:${channel}:dedup:${dedupId}`);
}
