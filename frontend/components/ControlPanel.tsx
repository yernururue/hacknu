"use client";

import React, { useState, useCallback } from "react";
import type { AgentMode } from "@/lib/agent";

interface ControlPanelProps {
  agentEnabled: boolean;
  onToggleAgent: (enabled: boolean) => void;
  agentMode: AgentMode;
  onChangeMode: (mode: AgentMode) => void;
  onSummarize: () => void;
  isLoading: boolean;
}

const MODES: { value: AgentMode; label: string; icon: string; desc: string }[] = [
  {
    value: "idea_generator",
    label: "Idea Generator",
    icon: "💡",
    desc: "Brainstorm new ideas and concepts",
  },
  {
    value: "devils_advocate",
    label: "Devil's Advocate",
    icon: "😈",
    desc: "Challenge ideas and find weaknesses",
  },
  {
    value: "summarizer",
    label: "Summarizer",
    icon: "📋",
    desc: "Condense and organize existing ideas",
  },
];

/**
 * Sidebar control panel with:
 * - Agent ON / OFF toggle
 * - Mode selector (idea_generator / devils_advocate / summarizer)
 * - "Summarize canvas" button
 */
export default function ControlPanel({
  agentEnabled,
  onToggleAgent,
  agentMode,
  onChangeMode,
  onSummarize,
  isLoading,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle button when collapsed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 3500,
            width: 44,
            height: 44,
            borderRadius: 14,
            border: "1px solid rgba(226, 232, 240, 0.8)",
            background: "rgba(255, 255, 255, 0.82)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          🤖
        </button>
      )}

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 3500,
          width: 280,
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          borderRadius: 20,
          boxShadow:
            "0 24px 48px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          transform: isOpen ? "translateX(0)" : "translateX(320px)",
          opacity: isOpen ? 1 : 0,
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              🤖
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "0.02em",
                }}
              >
                AI Agent
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.7)",
                  marginTop: 1,
                }}
              >
                {agentEnabled ? "Active" : "Disabled"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "none",
              background: "rgba(255, 255, 255, 0.15)",
              color: "white",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255, 255, 255, 0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255, 255, 255, 0.15)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Agent Power
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  marginTop: 2,
                }}
              >
                {agentEnabled ? "Ready to assist" : "Turn on to get AI help"}
              </div>
            </div>
            <button
              onClick={() => onToggleAgent(!agentEnabled)}
              style={{
                position: "relative",
                width: 48,
                height: 26,
                borderRadius: 13,
                border: "none",
                background: agentEnabled
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "#cbd5e1",
                cursor: "pointer",
                transition: "background 0.25s ease",
                padding: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: agentEnabled ? 25 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                  transition: "left 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "linear-gradient(to right, transparent, #e2e8f0, transparent)",
            }}
          />

          {/* Mode Selector */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 10,
              }}
            >
              Agent Mode
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {MODES.map((mode) => {
                const isSelected = agentMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    onClick={() => onChangeMode(mode.value)}
                    disabled={!agentEnabled}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: isSelected
                        ? "1px solid rgba(99, 102, 241, 0.3)"
                        : "1px solid transparent",
                      background: isSelected
                        ? "rgba(99, 102, 241, 0.08)"
                        : "transparent",
                      cursor: agentEnabled ? "pointer" : "not-allowed",
                      opacity: agentEnabled ? 1 : 0.5,
                      transition: "all 0.15s ease",
                      textAlign: "left",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && agentEnabled) {
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(248, 250, 252, 0.8)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                      }
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{mode.icon}</span>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isSelected ? "#4f46e5" : "#334155",
                        }}
                      >
                        {mode.label}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          marginTop: 1,
                        }}
                      >
                        {mode.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#6366f1",
                          boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.15)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "linear-gradient(to right, transparent, #e2e8f0, transparent)",
            }}
          />

          {/* Summarize button */}
          <button
            onClick={onSummarize}
            disabled={!agentEnabled || isLoading}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 14,
              border: "none",
              background:
                !agentEnabled || isLoading
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #f59e0b, #d97706)",
              color:
                !agentEnabled || isLoading ? "#94a3b8" : "white",
              fontSize: 12,
              fontWeight: 700,
              cursor:
                !agentEnabled || isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow:
                !agentEnabled || isLoading
                  ? "none"
                  : "0 4px 12px rgba(245, 158, 11, 0.3)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (agentEnabled && !isLoading) {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 24px rgba(245, 158, 11, 0.35)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                agentEnabled && !isLoading
                  ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                  : "none";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize: 16 }}>📋</span>
            {isLoading ? "Summarizing…" : "Summarize Canvas"}
          </button>
        </div>
      </div>
    </>
  );
}
