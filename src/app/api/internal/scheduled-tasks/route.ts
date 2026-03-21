import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import type {
  ScheduledTaskDelivery,
  ScheduledTaskPayload,
  ScheduledTaskRecord,
  ScheduledTaskSchedule,
} from "@/shared/types";
import { ApiError, jsonError, jsonOk } from "@/shared/http";
import { getSchedulerHostSecret } from "@/server/env";
import {
  readScheduledTaskIndex,
  validateCronExpression,
  withSchedulerLock,
  writeScheduledTaskIndex,
} from "@/server/scheduler/store";

const SCHEDULED_TASK_CRON_FALLBACK_DELAY_MS = 5 * 60 * 1000;

type JsonObject = Record<string, unknown>;

type CreateScheduledTaskInput = {
  name: string;
  schedule: ScheduledTaskSchedule;
  payload: ScheduledTaskPayload;
  delivery: ScheduledTaskDelivery;
  sessionTarget: string;
  deleteAfterRun: boolean;
};

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

function isAuthorized(request: Request): boolean {
  const configuredSecret = getSchedulerHostSecret();
  if (!configuredSecret) {
    return false;
  }

  const bearer = getBearerToken(request);
  const hmac = (s: string) =>
    createHmac("sha256", "scheduler-auth-cmp").update(s).digest();
  return timingSafeEqual(hmac(bearer), hmac(configuredSecret));
}

function requireNonEmptyString(
  value: unknown,
  code: string,
  message: string,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, code, message);
  }

  return value.trim();
}

function parseSchedule(input: unknown): ScheduledTaskSchedule {
  if (!isJsonObject(input) || typeof input.kind !== "string") {
    throw new ApiError(
      400,
      "INVALID_SCHEDULE",
      "schedule must be an object with a kind.",
    );
  }

  switch (input.kind) {
    case "at": {
      const at = requireNonEmptyString(
        input.at,
        "INVALID_SCHEDULE_AT",
        "schedule.at must be a non-empty string.",
      );
      const atMs = new Date(at).getTime();
      if (!Number.isFinite(atMs)) {
        throw new ApiError(
          400,
          "INVALID_SCHEDULE_AT",
          "schedule.at must be a valid date string.",
        );
      }
      return { kind: "at", at };
    }

    case "every": {
      if (
        typeof input.everyMs !== "number" ||
        !Number.isFinite(input.everyMs) ||
        input.everyMs < 60_000
      ) {
        throw new ApiError(
          400,
          "INVALID_SCHEDULE_EVERY_MS",
          "schedule.everyMs must be at least 60000 (1 minute).",
        );
      }
      return { kind: "every", everyMs: input.everyMs };
    }

    case "cron": {
      const expr = requireNonEmptyString(
        input.expr,
        "INVALID_SCHEDULE_EXPR",
        "schedule.expr must be a non-empty string.",
      );
      const tz = input.tz === undefined
        ? undefined
        : requireNonEmptyString(
            input.tz,
            "INVALID_SCHEDULE_TZ",
            "schedule.tz must be a non-empty string when provided.",
          );
      try {
        validateCronExpression(expr, tz);
      } catch {
        throw new ApiError(
          400,
          "INVALID_SCHEDULE_EXPR",
          "schedule.expr must be a valid 5-field cron expression.",
        );
      }
      return tz === undefined ? { kind: "cron", expr } : { kind: "cron", expr, tz };
    }

    default:
      throw new ApiError(
        400,
        "INVALID_SCHEDULE_KIND",
        "schedule.kind must be one of: at, every, cron.",
      );
  }
}

function parsePayload(input: unknown): ScheduledTaskPayload {
  if (!isJsonObject(input) || typeof input.kind !== "string") {
    throw new ApiError(
      400,
      "INVALID_PAYLOAD",
      "payload must be an object with a kind.",
    );
  }

  switch (input.kind) {
    case "systemEvent": {
      const text = requireNonEmptyString(
        input.text,
        "INVALID_PAYLOAD_TEXT",
        "payload.text must be a non-empty string.",
      );
      return { kind: "systemEvent", text };
    }

    case "agentTurn": {
      const message = requireNonEmptyString(
        input.message,
        "INVALID_PAYLOAD_MESSAGE",
        "payload.message must be a non-empty string.",
      );
      if (input.model === undefined) {
        return { kind: "agentTurn", message };
      }

      const model = requireNonEmptyString(
        input.model,
        "INVALID_PAYLOAD_MODEL",
        "payload.model must be a non-empty string when provided.",
      );
      return { kind: "agentTurn", message, model };
    }

    default:
      throw new ApiError(
        400,
        "INVALID_PAYLOAD_KIND",
        "payload.kind must be one of: systemEvent, agentTurn.",
      );
  }
}

function parseDelivery(input: unknown): ScheduledTaskDelivery {
  if (input === undefined) {
    return { mode: "none" };
  }

  if (!isJsonObject(input) || typeof input.mode !== "string") {
    throw new ApiError(
      400,
      "INVALID_DELIVERY",
      "delivery must be an object with a mode when provided.",
    );
  }

  switch (input.mode) {
    case "none":
      return { mode: "none" };

    case "announce": {
      if (
        input.channel !== "telegram" &&
        input.channel !== "slack" &&
        input.channel !== "discord"
      ) {
        throw new ApiError(
          400,
          "INVALID_DELIVERY_CHANNEL",
          "delivery.channel must be telegram, slack, or discord.",
        );
      }

      if (input.to === undefined || input.to === null) {
        return { mode: "announce", channel: input.channel };
      }

      const to = requireNonEmptyString(
        input.to,
        "INVALID_DELIVERY_TO",
        "delivery.to must be a non-empty string when provided.",
      );
      return { mode: "announce", channel: input.channel, to };
    }

    case "webhook": {
      const to = requireNonEmptyString(
        input.to,
        "INVALID_DELIVERY_TO",
        "delivery.to must be a non-empty string.",
      );
      try {
        const parsed = new URL(to);
        if (parsed.protocol !== "https:") {
          throw new ApiError(
            400,
            "INVALID_DELIVERY_TO",
            "delivery.to must be an HTTPS URL.",
          );
        }
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(
          400,
          "INVALID_DELIVERY_TO",
          "delivery.to must be a valid HTTPS URL.",
        );
      }
      return { mode: "webhook", to };
    }

    default:
      throw new ApiError(
        400,
        "INVALID_DELIVERY_MODE",
        "delivery.mode must be one of: none, announce, webhook.",
      );
  }
}

function parseSessionTarget(input: unknown): string {
  if (input === undefined) {
    return "isolated";
  }

  return requireNonEmptyString(
    input,
    "INVALID_SESSION_TARGET",
    "sessionTarget must be a non-empty string when provided.",
  );
}

function parseDeleteAfterRun(input: unknown, defaultValue: boolean): boolean {
  if (input === undefined) {
    return defaultValue;
  }

  if (typeof input !== "boolean") {
    throw new ApiError(
      400,
      "INVALID_DELETE_AFTER_RUN",
      "deleteAfterRun must be a boolean when provided.",
    );
  }

  return input;
}

function parseCreateScheduledTaskInput(input: unknown): CreateScheduledTaskInput {
  if (!isJsonObject(input)) {
    throw new ApiError(
      400,
      "INVALID_REQUEST_BODY",
      "Request body must be a JSON object.",
    );
  }

  const name = requireNonEmptyString(
    input.name,
    "INVALID_NAME",
    "name must be a non-empty string.",
  );
  const schedule = parseSchedule(input.schedule);
  const payload = parsePayload(input.payload);

  return {
    name,
    schedule,
    payload,
    delivery: parseDelivery(input.delivery),
    sessionTarget: parseSessionTarget(input.sessionTarget),
    deleteAfterRun: parseDeleteAfterRun(
      input.deleteAfterRun,
      schedule.kind === "at",
    ),
  };
}

function computeNextRunAtMs(schedule: ScheduledTaskSchedule, nowMs: number): number {
  switch (schedule.kind) {
    case "at":
      return new Date(schedule.at).getTime();
    case "every":
      return nowMs + schedule.everyMs;
    case "cron":
      return nowMs + SCHEDULED_TASK_CRON_FALLBACK_DELAY_MS;
  }
}

function buildScheduledTaskRecord(
  input: CreateScheduledTaskInput,
  nowMs: number,
): ScheduledTaskRecord {
  return {
    id: randomUUID(),
    name: input.name,
    enabled: true,
    createdAt: nowMs,
    updatedAt: nowMs,
    schedule: input.schedule,
    nextRunAtMs: computeNextRunAtMs(input.schedule, nowMs),
    lastRunAtMs: null,
    lastFinishedAtMs: null,
    deleteAfterRun: input.deleteAfterRun,
    sessionTarget: input.sessionTarget,
    resolvedSessionKey: null,
    wakeMode: "now",
    payload: input.payload,
    delivery: input.delivery,
    execution: {
      state: "scheduled",
      attemptCount: 0,
      consecutiveFailures: 0,
      leaseExpiresAtMs: null,
      claimToken: null,
      lastError: null,
    },
    cleanupAfterMs: null,
  };
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return jsonError(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const body = await request.json().catch(() => {
      throw new ApiError(
        400,
        "INVALID_JSON",
        "Request body must be valid JSON.",
      );
    });
    const input = parseCreateScheduledTaskInput(body);
    const nowMs = Date.now();
    const task = buildScheduledTaskRecord(input, nowMs);

    await withSchedulerLock(async () => {
      const index = await readScheduledTaskIndex();
      index.tasks.push(task);
      await writeScheduledTaskIndex(index);
    });

    return jsonOk({
      ok: true,
      taskId: task.id,
      nextRunAtMs: task.nextRunAtMs,
    });
  } catch (error) {
    return jsonError(error);
  }
}
