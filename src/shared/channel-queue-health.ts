import type { ChannelName } from "@/shared/channels";

export type ChannelQueueHealth = {
  channel: ChannelName;
  counts: {
    queued: number;
    processing: number;
    failed: number;
  };
  hasBacklog: boolean;
  hasFailures: boolean;
};

export type ChannelQueueHealthPayload = {
  generatedAt: string;
  channels: ChannelQueueHealth[];
};
