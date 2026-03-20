"use client";

import { useState } from "react";

export default function ChannelsMockupV1() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="page-container">
      <style>{`
        .page-container {
          --background: #000;
          --background-elevated: #0a0a0a;
          --foreground: #ededed;
          --foreground-muted: #888;
          --foreground-subtle: #666;
          --border: rgba(255,255,255,0.08);
          --border-strong: rgba(255,255,255,0.14);
          --success: #45a557;
          --warning: #f5a623;
          --danger: #e5484d;
          --info: #0070f3;
          --radius: 8px;
          --font-sans: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
          
          min-height: 100vh;
          background: var(--background);
          color: var(--foreground);
          font-family: var(--font-sans);
          padding: 64px 24px;
          display: flex;
          justify-content: center;
        }

        .panel {
          width: 100%;
          max-width: 720px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--background);
          overflow: hidden;
        }

        .panel-header {
          padding: 24px;
          border-bottom: 1px solid var(--border);
        }

        .eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--foreground-muted);
          margin-bottom: 8px;
        }

        .heading {
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
          color: var(--foreground);
        }

        .accordion-item {
          border-bottom: 1px solid var(--border);
        }
        .accordion-item:last-child {
          border-bottom: none;
        }

        .accordion-header {
          display: flex;
          align-items: center;
          padding: 16px 24px;
          cursor: pointer;
          transition: background 0.2s ease;
          user-select: none;
        }
        .accordion-header:hover {
          background: var(--background-elevated);
        }

        .channel-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .channel-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .pill {
          font-family: var(--font-mono);
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid var(--border);
          text-transform: uppercase;
        }
        .pill.connected {
          color: var(--success);
          background: rgba(69, 165, 87, 0.1);
          border-color: rgba(69, 165, 87, 0.2);
        }
        .pill.unconfigured {
          color: var(--foreground-muted);
          background: rgba(255, 255, 255, 0.03);
        }

        .summary {
          font-size: 0.875rem;
          color: var(--foreground-subtle);
          margin-left: auto;
          margin-right: 16px;
        }

        .chevron {
          color: var(--foreground-subtle);
          transition: transform 0.2s ease;
        }
        .expanded .chevron {
          transform: rotate(180deg);
        }

        .accordion-body {
          padding: 0 24px 24px 24px;
          display: none;
        }
        .expanded .accordion-body {
          display: block;
        }

        .form-group {
          margin-top: 16px;
        }
        
        .form-label {
          display: block;
          font-size: 0.8125rem;
          color: var(--foreground-muted);
          margin-bottom: 8px;
        }

        .input-wrapper {
          display: flex;
          gap: 8px;
        }

        .input {
          flex: 1;
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--foreground);
          padding: 8px 12px;
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .input:focus {
          border-color: var(--foreground-subtle);
        }
        .input[readonly] {
          color: var(--foreground-muted);
          background: rgba(255, 255, 255, 0.02);
        }

        .btn {
          background: var(--foreground);
          color: var(--background);
          border: none;
          padding: 0 16px;
          height: 34px;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn:hover {
          opacity: 0.9;
        }
        .btn-secondary {
          background: transparent;
          color: var(--foreground);
          border: 1px solid var(--border-strong);
        }
        .btn-secondary:hover {
          background: var(--background-elevated);
        }
        .btn-danger {
          background: transparent;
          color: var(--danger);
          border: 1px solid rgba(229, 72, 77, 0.3);
        }
        .btn-danger:hover {
          background: rgba(229, 72, 77, 0.1);
        }
        .btn-icon {
          padding: 0 10px;
        }

        .body-text {
          font-size: 0.875rem;
          color: var(--foreground-muted);
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-label {
          font-size: 0.8125rem;
          color: var(--foreground-subtle);
        }
        .detail-value {
          font-size: 0.875rem;
          color: var(--foreground);
          font-family: var(--font-mono);
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
      `}</style>

      <div className="panel">
        <div className="panel-header">
          <div className="eyebrow">Channels</div>
          <h2 className="heading">External entry points</h2>
        </div>

        <div className="accordion-list">
          {/* SLACK */}
          <div className={`accordion-item ${expandedId === "slack" ? "expanded" : ""}`}>
            <div className="accordion-header" onClick={() => toggle("slack")}>
              <div className="channel-info">
                <span className="channel-name">Slack</span>
                <span className="pill unconfigured">Not Configured</span>
              </div>
              <div className="summary">Setup webhook and bot token</div>
              <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div className="accordion-body">
              <p className="body-text">
                Create a new app in your Slack workspace to connect it to OpenClaw. You'll need to configure the following webhook URL in your Slack app settings to receive events.
              </p>
              
              <div className="form-group">
                <label className="form-label">Webhook URL</label>
                <div className="input-wrapper">
                  <input readOnly className="input" value="https://vercel-openclaw.labs.vercel.dev/api/channels/slack/webhook" />
                  <button className="btn btn-secondary btn-icon" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bot User OAuth Token</label>
                <input className="input" placeholder="xoxb-..." />
              </div>

              <div className="form-group">
                <label className="form-label">Signing Secret</label>
                <input className="input" type="password" placeholder="Enter signing secret" />
              </div>

              <div className="actions">
                <button className="btn">Save Configuration</button>
              </div>
            </div>
          </div>

          {/* TELEGRAM */}
          <div className={`accordion-item ${expandedId === "telegram" ? "expanded" : ""}`}>
            <div className="accordion-header" onClick={() => toggle("telegram")}>
              <div className="channel-info">
                <span className="channel-name">Telegram</span>
                <span className="pill connected">Connected</span>
              </div>
              <div className="summary">@vercelclaw_bot</div>
              <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div className="accordion-body">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Bot Username</span>
                  <span className="detail-value">@vercelclaw_bot</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Command Sync Status</span>
                  <span className="detail-value" style={{ color: "var(--success)" }}>Synced</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Commands Registered At</span>
                  <span className="detail-value">3/19/2026, 9:28:56 PM</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Webhook URL</label>
                <div className="input-wrapper">
                  <input readOnly className="input" value="https://vercel-openclaw.labs.vercel.dev/api/channels/telegram/webhook" />
                  <button className="btn btn-secondary btn-icon" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>
              </div>

              <div className="actions">
                <button className="btn btn-secondary">Resync Commands</button>
                <button className="btn btn-danger">Disconnect</button>
              </div>
            </div>
          </div>

          {/* DISCORD */}
          <div className={`accordion-item ${expandedId === "discord" ? "expanded" : ""}`}>
            <div className="accordion-header" onClick={() => toggle("discord")}>
              <div className="channel-info">
                <span className="channel-name">Discord</span>
                <span className="pill unconfigured">Not Configured</span>
              </div>
              <div className="summary">Setup webhook and tokens</div>
              <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div className="accordion-body">
              <p className="body-text">
                Create an application in the Discord Developer Portal. Use the URL below for your Interactions Endpoint URL.
              </p>
              
              <div className="form-group">
                <label className="form-label">Interactions Endpoint URL (Webhook)</label>
                <div className="input-wrapper">
                  <input readOnly className="input" value="https://vercel-openclaw.labs.vercel.dev/api/channels/discord/webhook" />
                  <button className="btn btn-secondary btn-icon" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Application ID</label>
                <input className="input" placeholder="Enter App ID" />
              </div>

              <div className="form-group">
                <label className="form-label">Public Key</label>
                <input className="input" placeholder="Enter Public Key" />
              </div>

              <div className="form-group">
                <label className="form-label">Bot Token</label>
                <input className="input" type="password" placeholder="Enter Bot Token" />
              </div>

              <div className="actions">
                <button className="btn">Save Configuration</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
