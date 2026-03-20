"use client";

import React, { useState } from "react";

const SlackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.835zM17.688 8.835a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313zM15.165 18.958a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.52h2.52zM15.165 17.687a2.527 2.527 0 0 1-2.52-2.521 2.527 2.527 0 0 1 2.52-2.521h6.313A2.527 2.527 0 0 1 24 15.166a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill="currentColor"/>
  </svg>
);

const TelegramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#2AABEE"/>
    <path d="M5.435 11.63l10.828-4.175c.505-.19.957.12.793.882l-1.85 8.707c-.14.62-.505.772-1.022.48l-2.822-2.078-1.36 1.308c-.15.15-.276.277-.565.277l.202-2.88 5.242-4.734c.228-.204-.05-.317-.354-.112L7.046 13.56l-2.793-.872c-.608-.19-.62-.608.127-.9l.02-.008z" fill="#fff"/>
  </svg>
);

const DiscordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2498-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8745-.6177-1.2498a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" fill="#5865F2"/>
  </svg>
);

const channels = [
  {
    id: "slack",
    name: "Slack",
    icon: <SlackIcon />,
    status: "unconfigured",
    workspace: "-",
    lastActivity: "-",
    webhookUrl: "https://vercel-openclaw.labs.vercel.dev/api/channels/slack/webhook",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: <TelegramIcon />,
    status: "connected",
    workspace: "@vercelclaw_bot",
    lastActivity: "2m ago",
    webhookUrl: "https://vercel-openclaw.labs.vercel.dev/api/channels/telegram/webhook",
    commandSyncStatus: "synced",
    commandsRegisteredAt: "3/19/2026, 9:28:56 PM",
  },
  {
    id: "discord",
    name: "Discord",
    icon: <DiscordIcon />,
    status: "unconfigured",
    workspace: "-",
    lastActivity: "-",
    webhookUrl: "https://vercel-openclaw.labs.vercel.dev/api/channels/discord/webhook",
  },
];

export default function StatusTableMockup() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="container">
      <style>{`
        :root {
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
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: var(--background);
        }
        .container {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          color: var(--foreground);
          background-color: var(--background);
          min-height: 100vh;
          padding: 48px;
        }
        .header {
          margin-bottom: 32px;
        }
        .title {
          font-size: 1.25rem;
          font-weight: 500;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .subtitle {
          color: var(--foreground-muted);
          font-size: 0.875rem;
          margin: 0;
        }
        .table-container {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--background);
          max-width: 1000px;
        }
        .table-header {
          display: grid;
          grid-template-columns: 24px 1.5fr 1fr 1.5fr 1fr 80px;
          gap: 16px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--background-elevated);
          font-family: var(--font-geist-mono), monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--foreground-subtle);
          align-items: center;
        }
        .table-row-group {
          border-bottom: 1px solid var(--border);
        }
        .table-row-group:last-child {
          border-bottom: none;
        }
        .table-row {
          display: grid;
          grid-template-columns: 24px 1.5fr 1fr 1.5fr 1fr 80px;
          gap: 16px;
          padding: 12px 16px;
          align-items: center;
          font-size: 0.875rem;
          transition: background 0.15s ease;
          cursor: pointer;
        }
        .table-row:hover {
          background: rgba(255,255,255,0.02);
        }
        .table-row-group.expanded .table-row {
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
        }
        .table-expanded {
          padding: 24px 16px 32px 56px;
          background: var(--background-elevated);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          justify-self: center;
        }
        .status-dot.connected {
          background-color: var(--success);
          box-shadow: 0 0 0 2px rgba(69, 165, 87, 0.2);
        }
        .status-dot.unconfigured {
          background-color: transparent;
          border: 1px solid var(--foreground-subtle);
        }
        .channel-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 9999px;
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          border: 1px solid var(--border-strong);
        }
        .status-badge.connected {
          color: var(--success);
          border-color: rgba(69, 165, 87, 0.3);
          background: rgba(69, 165, 87, 0.1);
        }
        .status-badge.unconfigured {
          color: var(--foreground-muted);
        }
        .cell-mono {
          font-family: var(--font-geist-mono), monospace;
          color: var(--foreground-muted);
          font-size: 13px;
        }
        .cell-muted {
          color: var(--foreground-muted);
        }
        .action-button {
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--foreground);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.875rem;
          font-family: var(--font-geist-sans), sans-serif;
          cursor: pointer;
          transition: all 0.15s ease;
          justify-self: end;
          font-weight: 500;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-button:hover {
          background: rgba(255,255,255,0.1);
        }
        
        /* Expansion Forms */
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 600px;
        }
        .form-header {
          margin-bottom: 8px;
        }
        .form-title {
          font-size: 1rem;
          font-weight: 500;
          margin: 0 0 4px 0;
        }
        .form-desc {
          font-size: 0.875rem;
          color: var(--foreground-muted);
          margin: 0;
          line-height: 1.5;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground);
        }
        .form-input {
          background: var(--background);
          border: 1px solid var(--border-strong);
          border-radius: 6px;
          padding: 8px 12px;
          color: var(--foreground);
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          outline: none;
          width: 100%;
          transition: border-color 0.15s ease;
        }
        .form-input:focus {
          border-color: var(--foreground-muted);
        }
        .form-input.readonly {
          background: var(--background-elevated);
          color: var(--foreground-muted);
          cursor: text;
        }
        .kv-list {
          display: flex;
          flex-direction: column;
        }
        .key-value {
          display: grid;
          grid-template-columns: 200px 1fr;
          font-size: 0.875rem;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .key-value:last-child {
          border-bottom: none;
        }
        .kv-key {
          color: var(--foreground-muted);
        }
        .kv-value {
          color: var(--foreground);
        }
        .kv-value.mono {
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
        }
        .kv-value.success {
          color: var(--success);
        }
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .btn-primary {
          background: var(--foreground);
          color: var(--background);
          border-color: var(--foreground);
        }
        .btn-primary:hover {
          background: #fff;
        }
        .btn-danger {
          color: var(--danger);
          border-color: rgba(229, 72, 77, 0.3);
        }
        .btn-danger:hover {
          background: rgba(229, 72, 77, 0.1);
        }
      `}</style>

      <div className="header">
        <h1 className="title">Channels</h1>
        <p className="subtitle">Manage external entry points and bot connections.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div></div>
          <div>Channel</div>
          <div>Status</div>
          <div>Workspace / Bot</div>
          <div>Activity</div>
          <div></div>
        </div>

        {channels.map((channel) => (
          <div key={channel.id} className={`table-row-group ${expandedRow === channel.id ? "expanded" : ""}`}>
            <div className="table-row" onClick={(e) => toggleRow(channel.id, e)}>
              <div className={`status-dot ${channel.status}`} />
              <div className="channel-name">
                {channel.icon}
                {channel.name}
              </div>
              <div>
                <span className={`status-badge ${channel.status}`}>
                  {channel.status === "connected" ? "Connected" : "Not Configured"}
                </span>
              </div>
              <div className={channel.workspace === "-" ? "cell-muted" : "cell-mono"}>
                {channel.workspace}
              </div>
              <div className="cell-muted">
                {channel.lastActivity}
              </div>
              <button 
                className="action-button"
                onClick={(e) => toggleRow(channel.id, e)}
              >
                {channel.status === "connected" ? "Manage" : "Configure"}
              </button>
            </div>

            {expandedRow === channel.id && (
              <div className="table-expanded" onClick={(e) => e.stopPropagation()}>
                {channel.status === "unconfigured" ? (
                  <div className="form-grid">
                    <div className="form-header">
                      <h3 className="form-title">Configure {channel.name}</h3>
                      <p className="form-desc">Set up your {channel.name} integration by providing the required credentials. Create a bot in the {channel.name} developer portal first.</p>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Bot Token</label>
                      <input type="password" placeholder={`xoxb-...`} className="form-input" />
                      <p className="form-desc" style={{ marginTop: '4px' }}>Found in your {channel.name} App configuration under OAuth & Permissions.</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Webhook URL (Read Only)</label>
                      <input type="text" value={channel.webhookUrl} readOnly className="form-input readonly" />
                      <p className="form-desc" style={{ marginTop: '4px' }}>Copy this URL and paste it into the Event Subscriptions section in {channel.name}.</p>
                    </div>

                    <div className="form-actions">
                      <button className="action-button btn-primary">Connect {channel.name}</button>
                      <button className="action-button" onClick={(e) => toggleRow(channel.id, e)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="form-grid">
                    <div className="form-header">
                      <h3 className="form-title">{channel.name} Configuration</h3>
                      <p className="form-desc">Manage your active connection to {channel.workspace}.</p>
                    </div>

                    <div className="kv-list">
                      <div className="key-value">
                        <div className="kv-key">Bot Username</div>
                        <div className="kv-value mono">{channel.workspace}</div>
                      </div>
                      <div className="key-value">
                        <div className="kv-key">Webhook URL</div>
                        <div className="kv-value mono">{channel.webhookUrl}</div>
                      </div>
                      <div className="key-value">
                        <div className="kv-key">Command Sync</div>
                        <div className="kv-value success">{channel.commandSyncStatus === 'synced' ? '✓ Synced' : channel.commandSyncStatus}</div>
                      </div>
                      <div className="key-value">
                        <div className="kv-key">Last Registered</div>
                        <div className="kv-value">{channel.commandsRegisteredAt}</div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button className="action-button">Sync Commands</button>
                      <button className="action-button btn-danger">Disconnect</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
