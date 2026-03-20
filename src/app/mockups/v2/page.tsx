"use client";

import { useState } from "react";

export default function MockupV2Page() {
  const [activeTab, setActiveTab] = useState("slack");

  const channels = [
    { id: "slack", label: "Slack", connected: false },
    { id: "telegram", label: "Telegram", connected: true },
    { id: "discord", label: "Discord", connected: false },
  ];

  return (
    <div className="page-container">
      <style>{`
        .page-container {
          min-height: 100vh;
          background-color: #000;
          color: #ededed;
          font-family: var(--font-geist-sans), sans-serif;
          padding: 48px 24px;
        }
        .content-wrapper {
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          margin-bottom: 32px;
        }
        .title {
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
        }
        .description {
          color: #888;
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.5;
        }
        .panel {
          background-color: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          overflow: hidden;
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0 16px;
          background-color: #0a0a0a;
        }
        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: none;
          border: none;
          color: #888;
          font-family: var(--font-geist-sans), sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: color 0.15s ease;
        }
        .tab:hover {
          color: #ededed;
        }
        .tab.active {
          color: #ededed;
        }
        .tab.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #ededed;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #666;
        }
        .status-dot.connected {
          background-color: #45a557;
        }
        .panel-content {
          padding: 24px;
        }
        .eyebrow {
          font-family: var(--font-geist-mono), monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #666;
          margin: 0 0 16px 0;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-group:last-child {
          margin-bottom: 0;
        }
        .label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .input-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .input-wrapper {
          flex: 1;
        }
        .input {
          width: 100%;
          background-color: #000;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 6px;
          color: #ededed;
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          padding: 10px 12px;
          transition: border-color 0.15s ease;
        }
        .input:focus {
          outline: none;
          border-color: #ededed;
        }
        .input[readOnly] {
          color: #888;
          background-color: rgba(255, 255, 255, 0.02);
        }
        .button {
          background-color: #ededed;
          color: #000;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-geist-sans), sans-serif;
          padding: 0 16px;
          height: 38px;
          cursor: pointer;
          transition: background-color 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .button:hover {
          background-color: #fff;
        }
        .button.secondary {
          background-color: #000;
          color: #ededed;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }
        .button.secondary:hover {
          background-color: #0a0a0a;
          border-color: rgba(255, 255, 255, 0.3);
        }
        .wizard-steps {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .wizard-step {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 16px;
        }
        .wizard-step:last-child {
          border-bottom: none;
        }
        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          font-size: 12px;
          font-family: var(--font-geist-mono), monospace;
          color: #ededed;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
        }
        .step-title {
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0 0 4px 0;
        }
        .step-desc {
          font-size: 0.875rem;
          color: #888;
          margin: 0;
          line-height: 1.5;
        }
        .connected-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
          padding: 16px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
        }
        .info-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-label {
          font-size: 0.875rem;
          color: #888;
        }
        .info-value {
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          color: #ededed;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 4px;
          background-color: rgba(69, 165, 87, 0.1);
          color: #45a557;
          font-size: 12px;
          font-family: var(--font-geist-mono), monospace;
          border: 1px solid rgba(69, 165, 87, 0.2);
          width: fit-content;
        }
        .status-badge::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #45a557;
        }
      `}</style>

      <div className="content-wrapper">
        <header className="header">
          <h1 className="title">Channels / External entry points</h1>
          <p className="description">
            Connect OpenClaw to external platforms to invoke workflows directly from chat.
          </p>
        </header>

        <div className="panel">
          <div className="tabs">
            {channels.map((channel) => (
              <button
                key={channel.id}
                className={`tab ${activeTab === channel.id ? "active" : ""}`}
                onClick={() => setActiveTab(channel.id)}
              >
                {channel.label}
                <span className={`status-dot ${channel.connected ? "connected" : ""}`} />
              </button>
            ))}
          </div>

          <div className="panel-content">
            {activeTab === "slack" && (
              <div>
                <h2 className="eyebrow">Setup Slack Integration</h2>
                <div className="wizard-steps">
                  <div className="wizard-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h3 className="step-title">Create a Slack App</h3>
                      <p className="step-desc">Go to api.slack.com/apps and create a new app from scratch.</p>
                    </div>
                  </div>
                  <div className="wizard-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h3 className="step-title">Configure Event Subscriptions</h3>
                      <p className="step-desc">Enable events and paste your Webhook URL below.</p>
                    </div>
                  </div>
                  <div className="wizard-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h3 className="step-title">Add Bot Token Scopes</h3>
                      <p className="step-desc">Add app_mentions:read, chat:write, and commands scopes.</p>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Webhook URL</label>
                  <div className="input-row">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="input"
                        value="https://vercel-openclaw.labs.vercel.dev/api/channels/slack/webhook"
                        readOnly
                      />
                    </div>
                    <button className="button secondary">Copy</button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Bot User OAuth Token</label>
                  <div className="input-row">
                    <div className="input-wrapper">
                      <input
                        type="password"
                        className="input"
                        placeholder="xoxb-..."
                      />
                    </div>
                    <button className="button">Connect Slack</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "telegram" && (
              <div>
                <h2 className="eyebrow">Telegram Configuration</h2>
                
                <div className="connected-info">
                  <div className="info-block">
                    <span className="info-label">Status</span>
                    <span className="status-badge">Connected</span>
                  </div>
                  <div className="info-block">
                    <span className="info-label">Bot Username</span>
                    <span className="info-value">@vercelclaw_bot</span>
                  </div>
                  <div className="info-block">
                    <span className="info-label">Command Sync</span>
                    <span className="info-value">Synced</span>
                  </div>
                  <div className="info-block">
                    <span className="info-label">Last Registered</span>
                    <span className="info-value">3/19/2026, 9:28:56 PM</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Webhook URL</label>
                  <div className="input-row">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="input"
                        value="https://vercel-openclaw.labs.vercel.dev/api/channels/telegram/webhook"
                        readOnly
                      />
                    </div>
                    <button className="button secondary">Copy</button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Bot Token (from @BotFather)</label>
                  <div className="input-row">
                    <div className="input-wrapper">
                      <input
                        type="password"
                        className="input"
                        value="••••••••••••••••••••••••••••••••••••••••"
                        readOnly
                      />
                    </div>
                    <button className="button secondary">Update Token</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "discord" && (
              <div>
                <h2 className="eyebrow">Setup Discord Integration</h2>
                <div className="wizard-steps">
                  <div className="wizard-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h3 className="step-title">Create a Discord Application</h3>
                      <p className="step-desc">Go to the Discord Developer Portal and create a new application.</p>
                    </div>
                  </div>
                  <div className="wizard-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h3 className="step-title">Configure Interactions Endpoint</h3>
                      <p className="step-desc">Paste your Webhook URL into the Interactions Endpoint URL field.</p>
                    </div>
                  </div>
                  <div className="wizard-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h3 className="step-title">Get Credentials</h3>
                      <p className="step-desc">Copy your Bot Token, Application ID, and Public Key.</p>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Interactions Endpoint URL</label>
                  <div className="input-row">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="input"
                        value="https://vercel-openclaw.labs.vercel.dev/api/channels/discord/webhook"
                        readOnly
                      />
                    </div>
                    <button className="button secondary">Copy</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Application ID</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 123456789012345678"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Public Key</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. a1b2c3d4..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Bot Token</label>
                  <div className="input-row">
                    <div className="input-wrapper">
                      <input
                        type="password"
                        className="input"
                        placeholder="MTA... token"
                      />
                    </div>
                    <button className="button">Connect Discord</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
