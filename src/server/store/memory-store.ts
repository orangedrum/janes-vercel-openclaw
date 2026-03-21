import { randomUUID } from "node:crypto";

import type { SingleMeta } from "@/shared/types";

type MemoryLock = {
  token: string;
  expiresAt: number;
};

type MemoryValue = {
  value: string;
  expiresAt: number | null;
};

export class MemoryStore {
  readonly name = "memory";

  private meta: SingleMeta | null = null;

  private readonly values = new Map<string, MemoryValue>();

  private readonly locks = new Map<string, MemoryLock>();

  async getMeta(): Promise<SingleMeta | null> {
    return this.meta ? structuredClone(this.meta) : null;
  }

  async setMeta(meta: SingleMeta): Promise<void> {
    this.meta = structuredClone(meta);
  }

  async createMetaIfAbsent(meta: SingleMeta): Promise<boolean> {
    if (this.meta) {
      return false;
    }

    this.meta = structuredClone(meta);
    return true;
  }

  async compareAndSetMeta(expectedVersion: number, next: SingleMeta): Promise<boolean> {
    if (!this.meta) {
      return false;
    }

    const currentVersion =
      typeof this.meta.version === "number" && Number.isSafeInteger(this.meta.version)
        ? this.meta.version
        : 1;

    if (currentVersion !== expectedVersion) {
      return false;
    }

    this.meta = structuredClone(next);
    return true;
  }

  async getValue<T>(key: string): Promise<T | null> {
    this.gc();
    const entry = this.values.get(key);
    if (!entry) {
      return null;
    }

    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  async setValue<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.gc();
    this.values.set(key, {
      value: JSON.stringify(value),
      expiresAt: typeof ttlSeconds === "number" ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async deleteValue(key: string): Promise<void> {
    this.values.delete(key);
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<string | null> {
    this.gc();
    const existing = this.locks.get(key);
    if (existing) {
      return null;
    }

    const token = randomUUID();
    this.locks.set(key, {
      token,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return token;
  }

  async renewLock(key: string, token: string, ttlSeconds: number): Promise<boolean> {
    this.gc();

    const current = this.locks.get(key);
    if (!current || current.token !== token) {
      return false;
    }

    this.locks.set(key, {
      token,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return true;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    const current = this.locks.get(key);
    if (current?.token === token) {
      this.locks.delete(key);
    }
  }

  private gc(): void {
    const now = Date.now();

    for (const [key, value] of this.locks.entries()) {
      if (value.expiresAt <= now) {
        this.locks.delete(key);
      }
    }

    for (const [key, value] of this.values.entries()) {
      if (value.expiresAt !== null && value.expiresAt <= now) {
        this.values.delete(key);
      }
    }
  }
}
