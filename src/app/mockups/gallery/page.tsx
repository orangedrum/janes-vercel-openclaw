"use client";

import { useState } from "react";

const variations = [
  {
    id: "v1",
    label: "V1 — Accordion",
    description: "Stacked accordion/collapse pattern. Each channel is a single row that expands on click. Most compact vertically.",
  },
  {
    id: "v2",
    label: "V2 — Tabbed",
    description: "Single panel with horizontal tabs. One channel visible at a time. Full-width forms, Vercel Dashboard settings pattern.",
  },
  {
    id: "v3",
    label: "V3 — Table",
    description: "Dense table/list view. All 3 channels visible as rows with inline expansion. Most information-dense at a glance.",
  },
] as const;

export default function GalleryPage() {
  const [active, setActive] = useState<string>("v1");

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#ededed" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <p style={{
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: "#666",
          margin: "0 0 8px",
        }}>
          Design Exploration
        </p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 24px" }}>
          Channels Section Redesign
        </h1>

        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 32 }}>
          {variations.map((v) => (
            <button
              key={v.id}
              onClick={() => setActive(v.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                border: "none",
                borderBottom: active === v.id ? "2px solid #ededed" : "2px solid transparent",
                background: "transparent",
                color: active === v.id ? "#ededed" : "#888",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 150ms ease, border-color 150ms ease",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <p style={{ color: "#888", fontSize: 13, margin: "0 0 24px" }}>
          {variations.find((v) => v.id === active)?.description}
        </p>

        <div style={{
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          <iframe
            key={active}
            src={`/mockups/${active}`}
            style={{
              width: "100%",
              height: 800,
              border: "none",
              background: "#000",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          {variations.map((v) => (
            <button
              key={v.id}
              onClick={() => setActive(v.id)}
              style={{
                padding: "8px 16px",
                border: active === v.id ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                background: active === v.id ? "rgba(255,255,255,0.04)" : "transparent",
                color: active === v.id ? "#ededed" : "#888",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Pick {v.label.split(" — ")[1]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
