import { useEffect, useRef, useState } from "react";
import {
  buildJsonRouteErrorMessage,
  type JsonRouteErrorPayload,
} from "@/components/api-route-errors";
import type {
  StatusPayload,
  RunAction,
  RequestJson,
} from "@/components/admin-types";
import { TelegramPanel } from "@/components/panels/telegram-panel";
import { SlackPanel } from "@/components/panels/slack-panel";
import { WhatsAppPanel } from "@/components/panels/whatsapp-panel";
import { DiscordPanel } from "@/components/panels/discord-panel";

type PreflightCheck = {
  id: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

type PreflightAction = {
  id: string;
  status: "required" | "recommended";
  message: string;
  remediation: string;
  env: string[];
};

type PreflightData = {
  ok: boolean;
  checks: PreflightCheck[];
  actions: PreflightAction[];
};

export type PreflightSummary = {
  ok: boolean | null;
  blockerIds: string[];
  blockerMessages: string[];
  requiredActionIds: string[];
  requiredRemediations: string[];
};

type PreflightResponsePayload = PreflightData & JsonRouteErrorPayload;

type ChannelsPanelProps = {
  active: boolean;
  status: StatusPayload;
  busy: boolean;
  runAction: RunAction;
  requestJson: RequestJson;
  refresh: () => Promise<void>;
};

export function getPreflightBlockerIds(
  preflight: Pick<PreflightData, "ok" | "checks"> | null,
): Set<string> | null {
  if (!preflight || preflight.ok) return null;
  return new Set(
    preflight.checks
      .filter((c) => c.status === "fail")
      .map((c) => c.id),
  );
}

export function summarizePreflight(
  preflight: PreflightData | null,
): PreflightSummary {
  const failedChecks =
    preflight?.checks.filter((check) => check.status === "fail") ?? [];
  const requiredActions =
    preflight?.actions.filter((action) => action.status === "required") ?? [];

  return {
    ok: preflight ? preflight.ok : null,
    blockerIds: failedChecks.map((check) => check.id),
    blockerMessages: failedChecks.map((check) => check.message),
    requiredActionIds: requiredActions.map((action) => action.id),
    requiredRemediations: requiredActions.map((action) => action.remediation),
  };
}

export function formatPreflightFetchError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Failed to load deployment preflight. Refresh the panel or open /api/admin/preflight.";
}

async function loadPreflightData(): Promise<PreflightData> {
  const res = await fetch("/api/admin/preflight", {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const payload = (await res.json().catch(() => null)) as
    | PreflightResponsePayload
    | null;

  if (!res.ok) {
    throw new Error(
      buildJsonRouteErrorMessage(
        payload,
        `Failed to load deployment preflight: HTTP ${res.status}`,
      ),
    );
  }

  if (
    !payload ||
    typeof payload.ok !== "boolean" ||
    !Array.isArray(payload.checks) ||
    !Array.isArray(payload.actions)
  ) {
    throw new Error(
      "Failed to load deployment preflight: invalid JSON payload.",
    );
  }

  return payload;
}

export function ChannelsPanel({
  active,
  status,
  busy,
  runAction,
  requestJson,
  refresh,
}: ChannelsPanelProps) {
  const [preflight, setPreflight] = useState<PreflightData | null>(null);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [preflightLoadedAt, setPreflightLoadedAt] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const preflightRequestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const preflightSummary = summarizePreflight(preflight);
  const preflightBlockerIds =
    preflightSummary.ok === false
      ? new Set(preflightSummary.blockerIds)
      : null;

  async function refreshPreflight(): Promise<void> {
    const requestId = preflightRequestIdRef.current + 1;
    preflightRequestIdRef.current = requestId;

    try {
      const nextPreflight = await loadPreflightData();
      if (!mountedRef.current || requestId !== preflightRequestIdRef.current) {
        return;
      }

      setPreflight(nextPreflight);
      setPreflightError(null);
      setPreflightLoadedAt(Date.now());
    } catch (error) {
      if (!mountedRef.current || requestId !== preflightRequestIdRef.current) {
        return;
      }

      const message = formatPreflightFetchError(error);
      setPreflightError(message);
    }
  }

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      void refreshPreflight();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [active]);

  async function refreshPanelData(): Promise<void> {
    await refreshPreflight();
  }

  return (
    <article
      className="panel-card full-span"
      data-preflight-ok={
        preflightSummary.ok === null ? "unknown" : String(preflightSummary.ok)
      }
      data-preflight-blocker-ids={preflightSummary.blockerIds.join(",")}
      data-preflight-required-action-ids={preflightSummary.requiredActionIds.join(",")}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">Channels</p>
          <h2>External entry points</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 36 }}>
          <button
            className="button ghost"
            disabled={busy || refreshing}
            onClick={() => {
              setRefreshing(true);
              void Promise.all([refresh(), refreshPanelData()])
                .finally(() => setRefreshing(false));
            }}
          >
            {refreshing ? "Refreshing\u2026" : "Refresh"}
          </button>
        </div>
      </div>

      {preflightError ? (
        <div className="error-banner" style={{ marginBottom: 16 }} aria-live="polite">
          <p style={{ margin: 0, fontWeight: 500 }}>{preflightError}</p>
          <p className="muted-copy" style={{ margin: "4px 0 0" }}>
            Channel cards keep the last known preflight snapshot until refresh succeeds.
          </p>
        </div>
      ) : null}

      {preflightSummary.ok === false ? (
        <div
          className="error-banner"
          style={{ marginBottom: 16 }}
          aria-live="polite"
          data-preflight-banner="deployment-blockers"
        >
          <p style={{ margin: 0, fontWeight: 500 }}>
            Resolve deployment blockers before connecting channels.
          </p>
          {preflightSummary.blockerMessages.map((message) => (
            <p key={message} className="muted-copy" style={{ margin: "4px 0 0" }}>
              {message}
            </p>
          ))}
          {preflightSummary.requiredRemediations.length > 0 ? (
            <details className="channel-details" style={{ marginTop: 10 }}>
              <summary>Required changes</summary>
              <div className="channel-details-body">
                {preflightSummary.requiredRemediations.map((remediation) => (
                  <p key={remediation} className="muted-copy" style={{ margin: 0 }}>
                    {remediation}
                  </p>
                ))}
              </div>
            </details>
          ) : null}
          {preflightLoadedAt ? (
            <p className="muted-copy" style={{ margin: "8px 0 0" }}>
              Checked {new Date(preflightLoadedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="channel-grid">
        <SlackPanel
          status={status}
          busy={busy}
          runAction={runAction}
          requestJson={requestJson}
          preflightBlockerIds={preflightBlockerIds}
        />
        <TelegramPanel
          status={status}
          busy={busy}
          runAction={runAction}
          requestJson={requestJson}
          preflightBlockerIds={preflightBlockerIds}
        />
        <DiscordPanel
          status={status}
          busy={busy}
          runAction={runAction}
          requestJson={requestJson}
          preflightBlockerIds={preflightBlockerIds}
        />
        <WhatsAppPanel
          status={status}
          busy={busy}
          runAction={runAction}
          requestJson={requestJson}
          preflightBlockerIds={preflightBlockerIds}
        />
      </div>
    </article>
  );
}
