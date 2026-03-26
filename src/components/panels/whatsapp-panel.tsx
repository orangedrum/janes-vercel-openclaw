import { useState } from "react";
import { ConfirmDialog, useConfirm } from "@/components/ui/confirm-dialog";
import { ConnectabilityNotice } from "@/components/panels/connectability-notice";
import type {
  RunAction,
  RequestJson,
  StatusPayload,
} from "@/components/admin-types";

type WhatsAppPanelProps = {
  status: StatusPayload;
  busy: boolean;
  runAction: RunAction;
  requestJson: RequestJson;
  refresh: () => Promise<void>;
};

export function WhatsAppPanel({
  status,
  busy,
  runAction,
  requestJson,
  refresh,
}: WhatsAppPanelProps) {
  const [editing, setEditing] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { confirm, dialogProps } = useConfirm();

  const wa = status.channels.whatsapp;

  const statusLabel =
    wa.status === "linked"
      ? "Linked"
      : wa.status === "needs-login"
        ? "Needs login"
        : wa.status === "needs-plugin"
          ? "Needs plugin"
          : wa.status === "disconnected"
            ? "Disconnected"
            : wa.status === "error"
              ? "Error"
              : "Not configured";

  const statusClass =
    wa.status === "linked"
      ? "good"
      : wa.status === "error"
        ? "bad"
        : "";

  async function handleEnable(): Promise<void> {
    setPanelError(null);
    try {
      await requestJson("/api/channels/whatsapp", {
        label: "Enable WhatsApp",
        successMessage: "WhatsApp enabled",
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: true }),
      });
      setEditing(false);
    } catch (error) {
      setPanelError(
        error instanceof Error ? error.message : "Failed to enable WhatsApp",
      );
    }
  }

  async function handleDisable(): Promise<void> {
    const ok = await confirm({
      title: "Disable WhatsApp?",
      description:
        "This will remove WhatsApp configuration. Auth state on the sandbox is preserved until the next snapshot.",
      confirmLabel: "Disable",
      variant: "danger",
    });
    if (!ok) return;

    setPanelError(null);
    try {
      await runAction("/api/channels/whatsapp", {
        label: "Disable WhatsApp",
        successMessage: "WhatsApp disabled",
        method: "DELETE",
      });
      setEditing(false);
    } catch (error) {
      setPanelError(
        error instanceof Error ? error.message : "Failed to disable WhatsApp",
      );
    }
  }

  return (
    <section className="channel-card channel-whatsapp">
      <div className="channel-head">
        <div>
          <h3>
            WhatsApp{" "}
            <span className="channel-pill" style={{ fontSize: "0.75em", verticalAlign: "middle" }}>
              experimental
            </span>
          </h3>
          <p className="muted-copy">
            {wa.configured
              ? `Enabled${wa.displayName ? ` \u00b7 ${wa.displayName}` : ""}${wa.linkedPhone ? ` \u00b7 ${wa.linkedPhone}` : ""}`
              : "Not configured"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="channel-pill">requires running sandbox</span>
          <span className={`channel-pill ${statusClass}`}>
            {statusLabel.toLowerCase()}
          </span>
        </div>
      </div>

      {panelError ? <p className="error-banner">{panelError}</p> : null}
      {wa.lastError ? <p className="error-banner">{wa.lastError}</p> : null}
      <ConnectabilityNotice connectability={wa.connectability} />

      {wa.configured && !editing ? (
        <div className="channel-connected-view">
          <div className="channel-detail-row">
            <span className="field-label">Mode</span>
            <code className="inline-code">{wa.mode}</code>
          </div>
          <div className="channel-detail-row">
            <span className="field-label">Status</span>
            <code className="inline-code">{wa.status}</code>
          </div>
          <div className="channel-detail-row">
            <span className="field-label">Login</span>
            <code className="inline-code">
              via Control UI at {wa.loginVia}
            </code>
          </div>
          <div className="inline-actions">
            <a
              className="button secondary"
              href="/gateway"
              target="_blank"
              rel="noreferrer"
            >
              Open Control UI for QR login
            </a>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                setPanelError(null);
                setEditing(true);
              }}
            >
              Edit config
            </button>
            <button
              className="button ghost"
              disabled={busy}
              onClick={() => void handleDisable()}
            >
              Disable
            </button>
            <button
              className="button ghost"
              disabled={busy || refreshing}
              onClick={() => {
                setRefreshing(true);
                void refresh().finally(() => setRefreshing(false));
              }}
            >
              {refreshing ? "Refreshing\u2026" : "Refresh"}
            </button>
          </div>
        </div>
      ) : (
        <div className="channel-wizard">
          <p className="channel-wizard-title">
            {editing ? "Edit WhatsApp Config" : "Enable WhatsApp"}
          </p>

          {!editing && (
            <div className="channel-wizard-steps">
              <div className="channel-wizard-step">
                <span className="channel-step-number">1</span>
                <span className="muted-copy">
                  Enable WhatsApp to install the plugin on the sandbox
                </span>
              </div>
              <div className="channel-wizard-step">
                <span className="channel-step-number">2</span>
                <span className="muted-copy">
                  Open the Control UI at <code>/gateway</code> to scan the QR code with your phone
                </span>
              </div>
              <div className="channel-wizard-step">
                <span className="channel-step-number">3</span>
                <span className="muted-copy">
                  The sandbox must be running to receive WhatsApp messages
                </span>
              </div>
            </div>
          )}

          <div className="inline-actions">
            <button
              className="button primary"
              disabled={busy || !wa.connectability.canConnect}
              onClick={() => void handleEnable()}
            >
              {editing ? "Save config" : "Enable WhatsApp"}
            </button>
            {editing && (
              <button
                className="button ghost"
                onClick={() => {
                  setEditing(false);
                  setPanelError(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </section>
  );
}
