"use client";

import React, { useState } from "react";
import type { AgentMode } from "@/lib/agent";

interface ControlPanelProps {
  agentEnabled: boolean;
  onToggleAgent: (enabled: boolean) => void;
  agentMode: AgentMode;
  onChangeMode: (mode: AgentMode) => void;
  onSummarize: () => void;
  isLoading: boolean;
}

const MODES: { value: AgentMode; label: string; icon: string }[] = [
  { value: "idea_generator", label: "Idea Generator", icon: "💡" },
  { value: "devils_advocate", label: "Devil's Advocate", icon: "😈" },
  { value: "summarizer", label: "Summarizer", icon: "📋" },
];

// Tldraw-style variables
const S = {
  card: {
    background: "#ffffff",
    border: "1px solid #e8eaed",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
    fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif",
    overflow: "hidden" as const,
    userSelect: "none" as const,
  },
  header: {
    background: "#f8f9fa",
    borderBottom: "1px solid #e8eaed",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "1px solid transparent",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "#6b7280",
    transition: "background 0.1s",
  },
  body: {
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  modeBtn: (selected: boolean, disabled: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 7,
    width: "100%",
    padding: "6px 8px",
    borderRadius: 6,
    border: selected ? "1px solid #c7d2fe" : "1px solid transparent",
    background: selected ? "#eef2ff" : "transparent",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "background 0.1s, border 0.1s",
    textAlign: "left" as const,
  }),
  modeLabel: (selected: boolean) => ({
    fontSize: 12,
    fontWeight: selected ? 600 : 500,
    color: selected ? "#4338ca" : "#374151",
    lineHeight: 1,
  }),
  divider: {
    height: 1,
    background: "#e8eaed",
    margin: "2px 0",
  },
  summarizeBtn: (disabled: boolean) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    padding: "7px 10px",
    borderRadius: 6,
    border: "1px solid " + (disabled ? "#e8eaed" : "#d1fae5"),
    background: disabled ? "#f3f4f6" : "#f0fdf4",
    color: disabled ? "#9ca3af" : "#065f46",
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    transition: "all 0.1s",
  }),
  toggle: (enabled: boolean) => ({
    position: "relative" as const,
    width: 34,
    height: 18,
    borderRadius: 9,
    border: "none",
    background: enabled ? "#4f46e5" : "#d1d5db",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
    transition: "background 0.2s",
  }),
  thumb: (enabled: boolean) => ({
    position: "absolute" as const,
    top: 2,
    left: enabled ? 16 : 2,
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    transition: "left 0.2s",
  }),
};

export default function ControlPanel({
  agentEnabled,
  onToggleAgent,
  agentMode,
  onChangeMode,
  onSummarize,
  isLoading,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Collapsed: icon button sitting just to the RIGHT of the centered Tldraw toolbar
  if (!isOpen) {
    return (
      <button
        title="Open AI Agent"
        onClick={() => setIsOpen(true)}
        style={{
          position: "absolute",
          bottom: 8,
          left: "calc(50% - 298px)", // just outside the toolbar's left edge
          zIndex: 3500,
          width: 40,
          height: 40,
          borderRadius: 12,     // matches toolbar border-radius
          border: "1px solid #e2e5e9",
          background: "#ffffff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <img
          src="/goose.png"
          alt="AI Agent"
          style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 8 }}
        />
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 56,
        left: "calc(50% - 298px)",  // same anchor as collapsed button
        transform: "translateX(-100%) translateX(40px)", // panel right-aligns near button
        zIndex: 3500,
        width: 232,
        ...S.card,
      }}
    >
      {/* Header — mimics Tldraw panel headers */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Goose avatar */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #e8eaed",
              flexShrink: 0,
              background: "#f8f9fa",
            }}
          >
            <img
              src="/goose.png"
              alt="AI"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2937", letterSpacing: "0.01em" }}>
            AI Agent
          </span>
          {/* Active indicator dot */}
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: agentEnabled ? "#22c55e" : "#d1d5db",
              display: "inline-block",
              transition: "background 0.2s",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {/* Enable/disable toggle */}
          <button
            style={S.toggle(agentEnabled)}
            onClick={() => onToggleAgent(!agentEnabled)}
            title={agentEnabled ? "Disable agent" : "Enable agent"}
          >
            <div style={S.thumb(agentEnabled)} />
          </button>
          {/* Collapse button */}
          <button
            style={S.iconBtn}
            onClick={() => setIsOpen(false)}
            title="Collapse"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        {/* Mode label */}
        <div style={S.label}>Mode</div>

        {/* Mode buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {MODES.map((mode) => {
            const selected = agentMode === mode.value;
            const disabled = !agentEnabled;
            return (
              <button
                key={mode.value}
                onClick={() => !disabled && onChangeMode(mode.value)}
                style={S.modeBtn(selected, disabled)}
                onMouseEnter={(e) => {
                  if (!selected && !disabled) {
                    (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLElement).style.background = selected ? "#eef2ff" : "transparent";
                  }
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{mode.icon}</span>
                <span style={S.modeLabel(selected)}>{mode.label}</span>
                {selected && (
                  <div
                    style={{
                      marginLeft: "auto",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#4f46e5",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div style={S.divider} />

        {/* Summarize */}
        <button
          onClick={onSummarize}
          disabled={!agentEnabled || isLoading}
          style={S.summarizeBtn(!agentEnabled || isLoading)}
          onMouseEnter={(e) => {
            if (agentEnabled && !isLoading) {
              (e.currentTarget as HTMLElement).style.background = "#dcfce7";
            }
          }}
          onMouseLeave={(e) => {
            if (agentEnabled && !isLoading) {
              (e.currentTarget as HTMLElement).style.background = "#f0fdf4";
            }
          }}
        >
          <span style={{ fontSize: 13 }}>📋</span>
          {isLoading ? "Summarizing…" : "Summarize Canvas"}
        </button>
      </div>
    </div>
  );
}
