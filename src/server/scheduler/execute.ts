import { logInfo, logWarn } from "@/server/log";
import {
  ensureFreshGatewayToken,
  ensureSandboxReady,
  getSandboxDomain,
  touchRunningSandbox,
} from "@/server/sandbox/lifecycle";
import { getInitializedMeta } from "@/server/store/store";
import { sendMessage } from "@/server/channels/telegram/bot-api";
import type { ScheduledTaskRecord } from "@/shared/types";
import {
  completeScheduledTask,
  failScheduledTask,
  resolveTelegramTarget,
} from "@/server/scheduler/store";

export async function executeScheduledTask(params: {
  task: ScheduledTaskRecord;
  origin: string;
}): Promise<void> {
  const { task, origin } = params;

  try {
    logInfo("scheduler.execute_start", { taskId: task.id, name: task.name });

    await ensureSandboxReady({ origin, reason: `scheduled:${task.id}` });
    await touchRunningSandbox();
    await ensureFreshGatewayToken();

    const gatewayUrl = await getSandboxDomain();
    const meta = await getInitializedMeta();

    const sessionKey = resolveSessionKey(task);
    const messages =
      task.payload.kind === "agentTurn"
        ? [{ role: "user" as const, content: task.payload.message }]
        : [
            {
              role: "user" as const,
              content: `[Scheduled event]\n${task.payload.text}`,
            },
          ];

    const response = await fetch(
      new URL("/v1/chat/completions", gatewayUrl),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${meta.gatewayToken}`,
          "x-openclaw-session-key": sessionKey,
        },
        body: JSON.stringify({
          model: "default",
          stream: false,
          messages,
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `gateway_${response.status}: ${body.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const replyText =
      payload.choices?.[0]?.message?.content ?? "";

    if (
      task.delivery.mode === "announce" &&
      task.delivery.channel === "telegram"
    ) {
      const target = await resolveTelegramTarget(
        task.delivery.to ?? null,
      );
      const botToken = meta.channels?.telegram?.botToken;
      if (!botToken) throw new Error("telegram_not_configured");
      if (!target) throw new Error("telegram_target_unknown");

      await sendMessage(botToken, target.chatId, replyText || "Done.", {
        messageThreadId: target.messageThreadId,
      });
    }

    await completeScheduledTask(task.id, Date.now());

    logInfo("scheduler.execute_success", {
      taskId: task.id,
      name: task.name,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    logWarn("scheduler.execute_failed", {
      taskId: task.id,
      name: task.name,
      error: message,
    });

    await failScheduledTask(task.id, Date.now(), message).catch(
      () => {},
    );

    throw error;
  }
}

function resolveSessionKey(task: ScheduledTaskRecord): string {
  if (task.sessionTarget === "main") return "main";
  if (task.sessionTarget === "isolated") return `cron:${task.id}`;
  if (task.sessionTarget.startsWith("session:")) {
    return task.sessionTarget.slice("session:".length);
  }
  if (task.sessionTarget === "current" && task.resolvedSessionKey) {
    return task.resolvedSessionKey;
  }
  return `cron:${task.id}`;
}
