"use client";

import { useEffect, useState } from "react";
import type { ChannelQueueHealthPayload } from "@/shared/channel-queue-health";

const POLL_MS = 10_000;

function statusLabel(item: ChannelQueueHealthPayload["channels"][number]): string {
  if (item.hasFailures) return "needs attention";
  if (item.hasBacklog) return "busy";
  return "clear";
}

function statusClass(item: ChannelQueueHealthPayload["channels"][number]): string {
  if (item.hasFailures) return "launch-phase-fail";
  if (item.hasBacklog) return "launch-phase-skip";
  return "launch-phase-pass";
}

export function ChannelQueueHealthCard() {
  const [payload, setPayload] = useState<ChannelQueueHealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/admin/channels/health", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as ChannelQueueHealthPayload;
        if (!cancelled) {
          setPayload(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    void load();
    const intervalId = window.setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <article className="panel-card full-span" style={{ marginTop: 12 }}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Channel queues</p>
        </div>
        {payload && (
          <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>
            Updated {new Date(payload.generatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {error ? (
        <p className="error-banner">Failed to load queue health: {error}</p>
      ) : (
        <dl className="metrics-grid">
          {(payload?.channels ?? []).map((item) => (
            <div key={item.channel} className="metric-group">
              <dt style={{ textTransform: "capitalize" }}>{item.channel}</dt>
              <dd>
                <span className={statusClass(item)}>
                  {statusLabel(item)}
                </span>
                <span className="mono" style={{ marginLeft: 8, fontSize: 12 }}>
                  {item.counts.queued}q / {item.counts.processing}p / {item.counts.failed}f
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
