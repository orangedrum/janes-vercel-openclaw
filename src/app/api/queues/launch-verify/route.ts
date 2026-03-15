import { handleCallback } from "@vercel/queue";

import { isRetryable } from "@/server/channels/driver";
import {
  ensureSandboxReady,
  getSandboxDomain,
  touchRunningSandbox,
} from "@/server/sandbox/lifecycle";
import { logError, logInfo } from "@/server/log";
import {
  runLaunchVerifyCompletion,
  saveLaunchVerifyQueueResult,
  type LaunchVerifyQueueProbe,
} from "@/server/launch-verify/queue-probe";

const MAX_DELIVERY_COUNT = 8;
const BACKOFF_BASE_SECONDS = 5;
const BACKOFF_MAX_SECONDS = 300;

function retry(
  error: unknown,
  metadata: { messageId: string; deliveryCount: number },
) {
  const retryable = isRetryable(error);

  logError("launch_verify.queue_consumer_error", {
    messageId: metadata.messageId,
    deliveryCount: metadata.deliveryCount,
    retryable,
    error: error instanceof Error ? error.message : String(error),
  });

  if (!retryable || metadata.deliveryCount > MAX_DELIVERY_COUNT) {
    return { acknowledge: true as const };
  }

  return {
    afterSeconds: Math.min(
      BACKOFF_MAX_SECONDS,
      2 ** metadata.deliveryCount * BACKOFF_BASE_SECONDS,
    ),
  };
}

export const POST = handleCallback<LaunchVerifyQueueProbe>(
  async (probe, metadata) => {
    try {
      logInfo("launch_verify.queue_consumer_received", {
        kind: probe.kind,
        probeId: probe.probeId,
        messageId: metadata.messageId,
        deliveryCount: metadata.deliveryCount,
      });

      if (probe.kind === "ack") {
        await saveLaunchVerifyQueueResult({
          probeId: probe.probeId,
          ok: true,
          completedAt: Date.now(),
          messageId: metadata.messageId,
          message: "Queue callback executed successfully.",
        });
        return;
      }

      const readyMeta = await ensureSandboxReady({
        origin: probe.origin,
        reason: `launch-verify:${probe.probeId}`,
        timeoutMs: probe.sandboxReadyTimeoutMs ?? 90_000,
      });

      const gatewayUrl = await getSandboxDomain();
      const replyText = await runLaunchVerifyCompletion({
        gatewayUrl,
        gatewayToken: readyMeta.gatewayToken,
        prompt: probe.prompt,
        expectedText: probe.expectedText,
        requestTimeoutMs: probe.requestTimeoutMs ?? 90_000,
      });

      await touchRunningSandbox();

      await saveLaunchVerifyQueueResult({
        probeId: probe.probeId,
        ok: true,
        completedAt: Date.now(),
        messageId: metadata.messageId,
        message: "Queue callback completed sandbox wake and chat round-trip.",
        replyText,
      });

      logInfo("launch_verify.queue_consumer_success", {
        probeId: probe.probeId,
        messageId: metadata.messageId,
      });
    } catch (error) {
      const retryable = isRetryable(error);
      const exhausted = metadata.deliveryCount >= MAX_DELIVERY_COUNT;

      if (!retryable || exhausted) {
        await saveLaunchVerifyQueueResult({
          probeId: probe.probeId,
          ok: false,
          completedAt: Date.now(),
          messageId: metadata.messageId,
          message: "Queue callback failed.",
          error: error instanceof Error ? error.message : String(error),
        });
      }

      throw error;
    }
  },
  {
    visibilityTimeoutSeconds: 600,
    retry,
  },
);
