import { randomUUID } from 'node:crypto';

import { getStore } from '@/server/store/store';

import {
  LAST_TELEGRAM_TARGET_KEY,
  SCHEDULED_TASK_INDEX_KEY,
  SCHEDULED_TASK_LOCK_KEY,
} from './keys';

const SCHEDULER_LOCK_TTL_SECONDS = 15;
const CLAIM_LEASE_MS = 10 * 60 * 1000;
const FAILURE_BACKOFF_MS = 5 * 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 5;
const MAX_CRON_SEARCH_MINUTES = 366 * 24 * 60 * 2;

type CronField = {
  wildcard: boolean;
  values: Set<number>;
};

type ParsedCronExpression = {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
  timeZone: string;
};

type CronDateParts = {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
};

const timeZoneFormatterCache = new Map<string, Intl.DateTimeFormat>();

export type {
  ScheduledTaskRecord,
  ScheduledTaskIndex,
  RememberedTelegramTarget,
} from '@/shared/types';

import type {
  ScheduledTaskExecutionState,
  ScheduledTaskRecord,
  ScheduledTaskIndex,
  RememberedTelegramTarget,
} from '@/shared/types';

export async function readScheduledTaskIndex(now = Date.now()): Promise<ScheduledTaskIndex> {
  const stored = await getStore().getValue<ScheduledTaskIndex>(SCHEDULED_TASK_INDEX_KEY);
  if (!stored || stored.version !== 1 || !Array.isArray(stored.tasks)) {
    return createEmptyScheduledTaskIndex(now);
  }

  return {
    version: 1,
    updatedAt: typeof stored.updatedAt === 'number' ? stored.updatedAt : now,
    tasks: stored.tasks.map((task) => structuredClone(task)),
  };
}

export async function writeScheduledTaskIndex(index: ScheduledTaskIndex): Promise<void> {
  await getStore().setValue(SCHEDULED_TASK_INDEX_KEY, {
    version: 1,
    updatedAt: Date.now(),
    tasks: index.tasks.map((task) => structuredClone(task)),
  } satisfies ScheduledTaskIndex);
}

export async function withSchedulerLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const store = getStore();
  const lockToken = await store.acquireLock(
    SCHEDULED_TASK_LOCK_KEY,
    SCHEDULER_LOCK_TTL_SECONDS,
  );

  if (!lockToken) {
    throw new Error(`scheduler.lock_unavailable: key=${SCHEDULED_TASK_LOCK_KEY}`);
  }

  try {
    return await fn();
  } finally {
    await store.releaseLock(SCHEDULED_TASK_LOCK_KEY, lockToken);
  }
}

export async function claimDueScheduledTasks(
  nowMs: number,
  limit = 10,
): Promise<ScheduledTaskRecord[]> {
  return withSchedulerLock(async () => {
    const index = await readScheduledTaskIndex(nowMs);
    const tasks = index.tasks.map((task) => structuredClone(task));
    const claimLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 10;
    const claimed: ScheduledTaskRecord[] = [];
    let didMutate = false;

    for (const task of tasks) {
      if (!isStaleLease(task, nowMs)) {
        continue;
      }

      task.execution.state = task.enabled ? 'scheduled' : 'disabled';
      task.execution.claimToken = null;
      task.execution.leaseExpiresAtMs = null;
      task.updatedAt = nowMs;
      didMutate = true;
    }

    const dueTasks = tasks
      .filter(
        (task) =>
          task.enabled &&
          task.execution.state === 'scheduled' &&
          typeof task.nextRunAtMs === 'number' &&
          task.nextRunAtMs <= nowMs,
      )
      .sort((left, right) => (left.nextRunAtMs ?? 0) - (right.nextRunAtMs ?? 0))
      .slice(0, claimLimit);

    for (const task of dueTasks) {
      task.execution.state = 'claimed';
      task.execution.attemptCount += 1;
      task.execution.claimToken = randomUUID();
      task.execution.leaseExpiresAtMs = nowMs + CLAIM_LEASE_MS;
      task.execution.lastError = null;
      task.lastRunAtMs = nowMs;
      task.updatedAt = nowMs;
      claimed.push(structuredClone(task));
      didMutate = true;
    }

    if (didMutate) {
      await writeScheduledTaskIndex({
        ...index,
        tasks,
      });
    }

    return claimed;
  });
}

export async function completeScheduledTask(taskId: string, nowMs: number): Promise<void> {
  await withSchedulerLock(async () => {
    const index = await readScheduledTaskIndex(nowMs);
    const tasks = index.tasks.map((task) => structuredClone(task));
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex < 0) {
      return;
    }

    const task = tasks[taskIndex]!;

    if (task.schedule.kind === 'at' && task.deleteAfterRun) {
      tasks.splice(taskIndex, 1);
      await writeScheduledTaskIndex({ ...index, tasks });
      return;
    }

    task.lastFinishedAtMs = nowMs;
    task.updatedAt = nowMs;

    if (task.schedule.kind === 'at') {
      task.enabled = false;
      task.nextRunAtMs = null;
      task.execution = createExecutionState('succeeded');
    } else if (task.schedule.kind === 'every') {
      task.nextRunAtMs = (task.lastRunAtMs ?? nowMs) + task.schedule.everyMs;
      task.execution = createExecutionState('scheduled');
    } else {
      task.nextRunAtMs = computeNextCronRunAtMs(task.schedule.expr, nowMs, task.schedule.tz);
      task.execution = createExecutionState('scheduled');
    }

    await writeScheduledTaskIndex({ ...index, tasks });
  });
}

export async function failScheduledTask(
  taskId: string,
  nowMs: number,
  error: string,
): Promise<void> {
  await withSchedulerLock(async () => {
    const index = await readScheduledTaskIndex(nowMs);
    const tasks = index.tasks.map((task) => structuredClone(task));
    const task = tasks.find((entry) => entry.id === taskId);

    if (!task) {
      return;
    }

    const consecutiveFailures = task.execution.consecutiveFailures + 1;
    const shouldDisable = consecutiveFailures >= MAX_CONSECUTIVE_FAILURES;

    task.updatedAt = nowMs;
    task.lastFinishedAtMs = nowMs;
    task.enabled = shouldDisable ? false : task.enabled;
    task.nextRunAtMs = shouldDisable ? null : nowMs + FAILURE_BACKOFF_MS;
    task.execution = {
      ...createExecutionState(shouldDisable ? 'disabled' : 'scheduled'),
      consecutiveFailures,
      lastError: error,
    };

    await writeScheduledTaskIndex({ ...index, tasks });
  });
}

export async function pruneScheduledTasks(nowMs: number): Promise<number> {
  return withSchedulerLock(async () => {
    const index = await readScheduledTaskIndex(nowMs);
    const tasks = index.tasks.filter(
      (task) => task.cleanupAfterMs === null || task.cleanupAfterMs > nowMs,
    );
    const prunedCount = index.tasks.length - tasks.length;

    if (prunedCount > 0) {
      await writeScheduledTaskIndex({ ...index, tasks });
    }

    return prunedCount;
  });
}

export async function resolveTelegramTarget(
  explicit: string | null,
): Promise<RememberedTelegramTarget | null> {
  const trimmed = explicit?.trim() ?? '';
  if (trimmed.length > 0) {
    return parseTelegramTarget(trimmed);
  }

  const remembered = await getStore().getValue<RememberedTelegramTarget>(
    LAST_TELEGRAM_TARGET_KEY,
  );

  if (!remembered) {
    return null;
  }

  return normalizeRememberedTelegramTarget(remembered);
}

export async function saveTelegramTarget(
  chatId: string,
  messageThreadId: number | null,
): Promise<void> {
  await getStore().setValue(LAST_TELEGRAM_TARGET_KEY, {
    chatId,
    messageThreadId,
    updatedAt: Date.now(),
  } satisfies RememberedTelegramTarget);
}

function createEmptyScheduledTaskIndex(now: number): ScheduledTaskIndex {
  return {
    version: 1,
    updatedAt: now,
    tasks: [],
  };
}

function createExecutionState(
  state: ScheduledTaskExecutionState,
): ScheduledTaskRecord['execution'] {
  return {
    state,
    attemptCount: 0,
    consecutiveFailures: 0,
    leaseExpiresAtMs: null,
    claimToken: null,
    lastError: null,
  };
}

function isStaleLease(task: ScheduledTaskRecord, nowMs: number): boolean {
  if (task.execution.state !== 'claimed' && task.execution.state !== 'running') {
    return false;
  }

  if (task.execution.claimToken === null || task.execution.leaseExpiresAtMs === null) {
    return true;
  }

  return task.execution.leaseExpiresAtMs <= nowMs;
}

function parseTelegramTarget(explicit: string): RememberedTelegramTarget {
  const match = /^(-?\d+)(?::(\d+))?$/.exec(explicit);
  if (!match) {
    throw new Error(
      'scheduler.telegram_target_invalid: expected <chatId> or <chatId>:<threadId>',
    );
  }

  return {
    chatId: match[1]!,
    messageThreadId: match[2] ? Number.parseInt(match[2], 10) : null,
    updatedAt: Date.now(),
  };
}

function normalizeRememberedTelegramTarget(
  target: RememberedTelegramTarget,
): RememberedTelegramTarget | null {
  if (typeof target.chatId !== 'string' || target.chatId.trim().length === 0) {
    return null;
  }

  if (
    target.messageThreadId !== null &&
    (!Number.isSafeInteger(target.messageThreadId) || target.messageThreadId < 0)
  ) {
    return null;
  }

  return {
    chatId: target.chatId,
    messageThreadId: target.messageThreadId,
    updatedAt: typeof target.updatedAt === 'number' ? target.updatedAt : Date.now(),
  };
}

function computeNextCronRunAtMs(expr: string, afterMs: number, timeZone?: string): number {
  const parsed = parseCronExpression(expr, timeZone);
  let candidateMs = Math.floor(afterMs / 60_000) * 60_000 + 60_000;

  for (let index = 0; index < MAX_CRON_SEARCH_MINUTES; index += 1) {
    if (matchesCronExpression(parsed, candidateMs)) {
      return candidateMs;
    }

    candidateMs += 60_000;
  }

  throw new Error(
    `scheduler.cron_next_run_not_found: expr="${expr}" afterMs=${afterMs} timeZone="${parsed.timeZone}"`,
  );
}

/**
 * Validates a 5-field cron expression. Throws if invalid.
 */
export function validateCronExpression(expr: string, tz?: string): void {
  parseCronExpression(expr, tz);
}

function parseCronExpression(expr: string, timeZone?: string): ParsedCronExpression {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(
      `scheduler.cron_invalid_expr: expected 5 fields but received ${fields.length}`,
    );
  }

  return {
    minute: parseCronField(fields[0]!, 0, 59),
    hour: parseCronField(fields[1]!, 0, 23),
    dayOfMonth: parseCronField(fields[2]!, 1, 31),
    month: parseCronField(fields[3]!, 1, 12),
    dayOfWeek: parseCronField(fields[4]!, 0, 6, { allowSevenAsZero: true }),
    timeZone: normalizeCronTimeZone(timeZone),
  };
}

function parseCronField(
  rawField: string,
  min: number,
  max: number,
  options?: { allowSevenAsZero?: boolean },
): CronField {
  const values = new Set<number>();

  for (const segment of rawField.split(',')) {
    const rawSegment = segment.trim();
    if (rawSegment.length === 0) {
      throw new Error(`scheduler.cron_invalid_segment: empty segment in "${rawField}"`);
    }

    const [rangePart, stepPart, extraPart] = rawSegment.split('/');
    if (extraPart !== undefined) {
      throw new Error(
        `scheduler.cron_invalid_segment: too many "/" separators in "${rawSegment}"`,
      );
    }

    const step = parseCronStep(stepPart);
    const [rangeStart, rangeEnd] = parseCronRange(
      rangePart ?? '',
      min,
      max,
      options?.allowSevenAsZero === true,
    );

    for (let value = rangeStart; value <= rangeEnd; value += step) {
      values.add(normalizeCronValue(value, min, max, options?.allowSevenAsZero === true));
    }
  }

  return {
    wildcard: values.size === max - min + 1,
    values,
  };
}

function parseCronStep(rawStep?: string): number {
  if (rawStep === undefined) {
    return 1;
  }

  const parsed = Number(rawStep);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`scheduler.cron_invalid_step: "${rawStep}"`);
  }

  return parsed;
}

function parseCronRange(
  rawRange: string,
  min: number,
  max: number,
  allowSevenAsZero: boolean,
): [number, number] {
  if (rawRange === '*') {
    return [min, max];
  }

  const separatorIndex = rawRange.indexOf('-');
  if (separatorIndex < 0) {
    const value = normalizeCronValue(rawRange, min, max, allowSevenAsZero);
    return [value, value];
  }

  const rangeStart = normalizeCronValue(
    rawRange.slice(0, separatorIndex).trim(),
    min,
    max,
    allowSevenAsZero,
  );
  const rangeEnd = normalizeCronValue(
    rawRange.slice(separatorIndex + 1).trim(),
    min,
    max,
    allowSevenAsZero,
  );

  if (rangeEnd < rangeStart) {
    throw new Error(`scheduler.cron_invalid_range: "${rawRange}"`);
  }

  return [rangeStart, rangeEnd];
}

function normalizeCronValue(
  rawValue: string | number,
  min: number,
  max: number,
  allowSevenAsZero: boolean,
): number {
  const parsed =
    typeof rawValue === 'number' ? rawValue : Number.parseInt(rawValue.trim(), 10);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`scheduler.cron_invalid_value: "${rawValue}"`);
  }

  const normalized = allowSevenAsZero && parsed === 7 ? 0 : parsed;
  if (normalized < min || normalized > max) {
    throw new Error(
      `scheduler.cron_value_out_of_range: value="${rawValue}" range=${min}-${max}`,
    );
  }

  return normalized;
}

function normalizeCronTimeZone(timeZone?: string): string {
  const normalized = timeZone?.trim() || 'UTC';

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized });
    return normalized;
  } catch (error) {
    throw new Error(
      `scheduler.cron_invalid_timezone: ${normalized} (${error instanceof Error ? error.message : String(error)})`,
    );
  }
}

function matchesCronExpression(parsed: ParsedCronExpression, candidateMs: number): boolean {
  const parts = getCronDateParts(candidateMs, parsed.timeZone);
  if (
    !parsed.minute.values.has(parts.minute) ||
    !parsed.hour.values.has(parts.hour) ||
    !parsed.month.values.has(parts.month)
  ) {
    return false;
  }

  const dayOfMonthMatch = parsed.dayOfMonth.values.has(parts.dayOfMonth);
  const dayOfWeekMatch = parsed.dayOfWeek.values.has(parts.dayOfWeek);

  if (parsed.dayOfMonth.wildcard && parsed.dayOfWeek.wildcard) {
    return true;
  }

  if (parsed.dayOfMonth.wildcard) {
    return dayOfWeekMatch;
  }

  if (parsed.dayOfWeek.wildcard) {
    return dayOfMonthMatch;
  }

  return dayOfMonthMatch || dayOfWeekMatch;
}

function getCronDateParts(candidateMs: number, timeZone: string): CronDateParts {
  const date = new Date(candidateMs);
  if (timeZone === 'UTC') {
    return {
      minute: date.getUTCMinutes(),
      hour: date.getUTCHours(),
      dayOfMonth: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      dayOfWeek: date.getUTCDay(),
    };
  }

  const formatter = getTimeZoneFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  let minute: number | null = null;
  let hour: number | null = null;
  let dayOfMonth: number | null = null;
  let month: number | null = null;
  let dayOfWeek: number | null = null;

  for (const part of parts) {
    switch (part.type) {
      case 'minute':
        minute = Number.parseInt(part.value, 10);
        break;
      case 'hour':
        hour = Number.parseInt(part.value, 10);
        break;
      case 'day':
        dayOfMonth = Number.parseInt(part.value, 10);
        break;
      case 'month':
        month = Number.parseInt(part.value, 10);
        break;
      case 'weekday':
        dayOfWeek = weekdayNameToNumber(part.value);
        break;
      default:
        break;
    }
  }

  if (
    minute === null ||
    hour === null ||
    dayOfMonth === null ||
    month === null ||
    dayOfWeek === null
  ) {
    throw new Error(
      `scheduler.cron_datetime_parts_incomplete: timeZone="${timeZone}" candidateMs=${candidateMs}`,
    );
  }

  return {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
  };
}

function getTimeZoneFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = timeZoneFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
    timeZoneFormatterCache.set(timeZone, formatter);
  }

  return formatter;
}

function weekdayNameToNumber(weekday: string): number {
  switch (weekday) {
    case 'Sun':
      return 0;
    case 'Mon':
      return 1;
    case 'Tue':
      return 2;
    case 'Wed':
      return 3;
    case 'Thu':
      return 4;
    case 'Fri':
      return 5;
    case 'Sat':
      return 6;
    default:
      throw new Error(`scheduler.cron_invalid_weekday: "${weekday}"`);
  }
}
