import type { ChannelName } from "@/shared/channels";
import type {
  ChannelQueueHealth,
  ChannelQueueHealthPayload,
} from "@/shared/channel-queue-health";
import {
  channelFailedKey,
  channelProcessingKey,
  channelQueueKey,
} from "@/server/channels/keys";
import { getStore } from "@/server/store/store";

const CHANNELS: ChannelName[] = ["slack", "telegram", "discord"];

type QueueLengthStore = {
  getQueueLength(key: string): Promise<number>;
};

export async function readChannelQueueHealth(
  channel: ChannelName,
  store: QueueLengthStore = getStore(),
): Promise<ChannelQueueHealth> {
  const [queued, processing, failed] = await Promise.all([
    store.getQueueLength(channelQueueKey(channel)),
    store.getQueueLength(channelProcessingKey(channel)),
    store.getQueueLength(channelFailedKey(channel)),
  ]);

  return {
    channel,
    counts: { queued, processing, failed },
    hasBacklog: queued + processing > 0,
    hasFailures: failed > 0,
  };
}

export async function readAllChannelQueueHealth(
  store: QueueLengthStore = getStore(),
): Promise<ChannelQueueHealthPayload> {
  const channels = await Promise.all(
    CHANNELS.map((channel) => readChannelQueueHealth(channel, store)),
  );

  return {
    generatedAt: new Date().toISOString(),
    channels,
  };
}
