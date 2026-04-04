"use client";

import React, { useState } from "react";
import type { AgentMode } from "@/lib/agent";

interface ControlPanelProps {
  agentEnabled: boolean;
  onToggleAgent: (enabled: boolean) => void;
  agentMode: AgentMode;
  onChangeMode: (mode: AgentMode) => void;
  onSummarize: () => void;
  onAnalyze?: () => void;
  isLoading: boolean;
}

const MODES: { value: AgentMode; label: string; desc: string }[] = [
  { value: "idea_generator", label: "Idea Generator", desc: "Expand and develop ideas" },
  { value: "devils_advocate", label: "Devil's Advocate", desc: "Challenge and stress-test" },
  { value: "summarizer", label: "Summarizer", desc: "Condense into themes" },
];

const ANCHOR = {
  bottom: 14,
  left: "calc(50% - 268px)",
} as const;

const font: React.CSSProperties = {
  fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif",
};

export default function ControlPanel({
  agentEnabled,
  onToggleAgent,
  agentMode,
  onChangeMode,
  onSummarize,
  onAnalyze,
  isLoading,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Goose toggle button — always visible */}
      <button
        title={isOpen ? "Close assistant" : "Open assistant"}
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: "absolute",
          bottom: ANCHOR.bottom,
          left: ANCHOR.left,
          zIndex: 3600,
          width: 40,
          height: 40,
          borderRadius: 12,
          border: isOpen ? "1px solid #c7d2fe" : "1px solid #e2e5e9",
          background: isOpen ? "#f5f5ff" : "#ffffff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          overflow: "hidden",
          transition: "border 0.15s, background 0.15s",
        }}
      >
        <img src="/goose.png" alt="Assistant" style={{ width: 32, height: 32, objectFit: "cover" }} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: ANCHOR.bottom + 48,
            left: ANCHOR.left,
            transform: "translateX(-100%) translateX(40px)", // panel opens to the LEFT of the button
            zIndex: 3500,
            width: 280,
            background: "#ffffff",
            border: "1px solid #e2e5e9",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
            overflow: "hidden",
            userSelect: "none",
            ...font,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 12px 10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  overflow: "hidden",
                  border: "1px solid #ebebeb",
                  flexShrink: 0,
                }}
              >
                <img src="/goose.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Assistant</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* On/Off */}
              <button
                onClick={() => onToggleAgent(!agentEnabled)}
                title={agentEnabled ? "Pause" : "Resume"}
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: "1px solid #e2e5e9",
                  background: agentEnabled ? "#f0fdf4" : "#f9fafb",
                  color: agentEnabled ? "#166534" : "#6b7280",
                  cursor: "pointer",
                  fontWeight: 500,
                  ...font,
                  transition: "all 0.1s",
                }}
              >
                {agentEnabled ? "On" : "Off"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#adb5bd",
                  fontSize: 12,
                  ...font,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                  (e.currentTarget as HTMLElement).style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#adb5bd";
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mode */}
          <div style={{ padding: "10px 12px 8px" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#b0b8c1",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              Mode
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {MODES.map((mode) => {
                const selected = agentMode === mode.value;
                const disabled = !agentEnabled;
                return (
                  <button
                    key={mode.value}
                    onClick={() => !disabled && onChangeMode(mode.value)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 7,
                      border: selected ? "1px solid #ddd6fe" : "1px solid transparent",
                      background: selected ? "#faf5ff" : "transparent",
                      cursor: disabled ? "default" : "pointer",
                      opacity: disabled ? 0.4 : 1,
                      transition: "background 0.1s, border 0.1s",
                      textAlign: "left",
                      gap: 2,
                      ...font,
                    }}
                    onMouseEnter={(e) => {
                      if (!selected && !disabled) {
                        (e.currentTarget as HTMLElement).style.background = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: selected ? 600 : 500,
                        color: selected ? "#5b21b6" : "#1f2937",
                        lineHeight: 1.3,
                      }}
                    >
                      {mode.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, lineHeight: 1.3 }}>
                      {mode.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#f0f0f0", margin: "0 12px" }} />

          {/* Actions */}
          <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Analyze Screen — primary action */}
            <button
              onClick={onAnalyze ?? onSummarize}
              disabled={!agentEnabled || isLoading}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 7,
                border: "1px solid #e2e5e9",
                background: !agentEnabled || isLoading ? "#f9fafb" : "#1f2937",
                color: !agentEnabled || isLoading ? "#9ca3af" : "#ffffff",
                fontSize: 12,
                fontWeight: 500,
                cursor: !agentEnabled || isLoading ? "default" : "pointer",
                transition: "background 0.1s",
                letterSpacing: "0.01em",
                ...font,
              }}
              onMouseEnter={(e) => {
                if (agentEnabled && !isLoading) {
                  (e.currentTarget as HTMLElement).style.background = "#111827";
                }
              }}
              onMouseLeave={(e) => {
                if (agentEnabled && !isLoading) {
                  (e.currentTarget as HTMLElement).style.background = "#1f2937";
                }
              }}
            >
              Analyze Screen
            </button>

            {/* Summarize Canvas — secondary action */}
            <button
              onClick={onSummarize}
              disabled={!agentEnabled || isLoading}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 7,
                border: "1px solid #e2e5e9",
                background: !agentEnabled || isLoading ? "#f9fafb" : "#f8f9fa",
                color: !agentEnabled || isLoading ? "#9ca3af" : "#374151",
                fontSize: 12,
                fontWeight: 500,
                cursor: !agentEnabled || isLoading ? "default" : "pointer",
                transition: "background 0.1s",
                letterSpacing: "0.01em",
                ...font,
              }}
              onMouseEnter={(e) => {
                if (agentEnabled && !isLoading) {
                  (e.currentTarget as HTMLElement).style.background = "#f0f1f2";
                }
              }}
              onMouseLeave={(e) => {
                if (agentEnabled && !isLoading) {
                  (e.currentTarget as HTMLElement).style.background = "#f8f9fa";
                }
              }}
            >
              {isLoading ? "Working…" : "Summarize Canvas"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
