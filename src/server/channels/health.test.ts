import assert from "node:assert/strict";
import test from "node:test";

import { readChannelQueueHealth } from "@/server/channels/health";
import {
  channelFailedKey,
  channelProcessingKey,
  channelQueueKey,
} from "@/server/channels/keys";

test("readChannelQueueHealth aggregates queued, processing, and failed lengths", async () => {
  const lengths = new Map<string, number>([
    [channelQueueKey("slack"), 4],
    [channelProcessingKey("slack"), 1],
    [channelFailedKey("slack"), 2],
  ]);

  const result = await readChannelQueueHealth("slack", {
    getQueueLength: async (key: string) => lengths.get(key) ?? 0,
  });

  assert.deepStrictEqual(result, {
    channel: "slack",
    counts: { queued: 4, processing: 1, failed: 2 },
    hasBacklog: true,
    hasFailures: true,
  });
});

test("readChannelQueueHealth reports clear when all counts are zero", async () => {
  const result = await readChannelQueueHealth("telegram", {
    getQueueLength: async () => 0,
  });

  assert.deepStrictEqual(result, {
    channel: "telegram",
    counts: { queued: 0, processing: 0, failed: 0 },
    hasBacklog: false,
    hasFailures: false,
  });
});

test("readChannelQueueHealth reports backlog without failures", async () => {
  const lengths = new Map<string, number>([
    [channelQueueKey("discord"), 3],
    [channelProcessingKey("discord"), 0],
    [channelFailedKey("discord"), 0],
  ]);

  const result = await readChannelQueueHealth("discord", {
    getQueueLength: async (key: string) => lengths.get(key) ?? 0,
  });

  assert.equal(result.hasBacklog, true);
  assert.equal(result.hasFailures, false);
});
