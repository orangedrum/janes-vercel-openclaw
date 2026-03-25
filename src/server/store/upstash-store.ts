import { randomUUID } from "node:crypto";

import { Redis } from "@upstash/redis";

import type { SingleMeta } from "@/shared/types";
import { getStoreEnv } from "@/server/env";
import { metaKey as resolveMetaKey } from "@/server/store/keyspace";

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

const RENEW_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("expire", KEYS[1], tonumber(ARGV[2]))
end
return 0
`;

const CAS_META_LUA = `
local current = redis.call("get", KEYS[1])
if not current then
  return -1
end

local decoded = cjson.decode(current)
local currentVersion = tonumber(decoded["version"])
if not currentVersion then
  currentVersion = 1
end

if currentVersion ~= tonumber(ARGV[1]) then
  return 0
end

redis.call("set", KEYS[1], ARGV[2])
return 1
`;

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export class UpstashStore {
  readonly name = "upstash";

  constructor(
    private readonly redis: Redis,
    private readonly configuredMetaKey?: string,
  ) {}

  private getMetaKey(): string {
    return this.configuredMetaKey ?? resolveMetaKey();
  }

  static fromEnv(): UpstashStore | null {
    const env = getStoreEnv();
    if (!env) {
      return null;
    }

    return new UpstashStore(
      new Redis({
        url: env.url,
        token: env.token,
      }),
    );
  }

  async getMeta(): Promise<SingleMeta | null> {
    const raw = await this.redis.get<SingleMeta | string>(this.getMetaKey());
    if (!raw) {
      return null;
    }

    if (typeof raw === "object") {
      return raw as SingleMeta;
    }

    try {
      return JSON.parse(raw) as SingleMeta;
    } catch {
      return null;
    }
  }

  async setMeta(meta: SingleMeta): Promise<void> {
    await this.redis.set(this.getMetaKey(), JSON.stringify(meta));
  }

  async createMetaIfAbsent(meta: SingleMeta): Promise<boolean> {
    const result = await this.redis.set(this.getMetaKey(), JSON.stringify(meta), { nx: true });
    return result === "OK";
  }

  async compareAndSetMeta(expectedVersion: number, next: SingleMeta): Promise<boolean> {
    const result = await this.redis.eval<[string, string], number>(
      CAS_META_LUA,
      [this.getMetaKey()],
      [String(expectedVersion), JSON.stringify(next)],
    );

    return toNumber(result) === 1;
  }

  async getValue<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get<T | string>(key);
    if (!raw) {
      return null;
    }

    if (typeof raw === "object") {
      return raw as T;
    }

    try {
      return JSON.parse(String(raw)) as T;
    } catch {
      return null;
    }
  }

  async setValue<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (typeof ttlSeconds === "number") {
      await this.redis.set(key, payload, { ex: ttlSeconds });
      return;
    }

    await this.redis.set(key, payload);
  }

  async deleteValue(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<string | null> {
    const token = randomUUID();
    const result = await this.redis.set(key, token, {
      nx: true,
      ex: ttlSeconds,
    });

    return result === "OK" ? token : null;
  }

  async renewLock(key: string, token: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.eval<[string, string], number>(
      RENEW_LOCK_LUA,
      [key],
      [token, String(ttlSeconds)],
    );

    return toNumber(result) > 0;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    await this.redis.eval(RELEASE_LOCK_LUA, [key], [token]);
  }
}
