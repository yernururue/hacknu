"use client";

import React from "react";
import type { AgentAction } from "@/lib/agent";

interface AgentSuggestionProps {
  action: AgentAction;
  onApprove: (action: AgentAction) => void;
  onDismiss: (action: AgentAction) => void;
}

/**
 * Floating card that appears when the agent returns a tentative action.
 * Shows the proposed content and reasoning, with Approve (green) and Dismiss (red) buttons.
 */
export default function AgentSuggestion({
  action,
  onApprove,
  onDismiss,
}: AgentSuggestionProps) {
  return (
    <div
      className="agent-suggestion-card"
      style={{
        position: "absolute",
        left: action.x,
        top: action.y,
        transform: "translate(-50%, calc(-100% - 24px))",
        zIndex: 4000,
        animation: "suggestion-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <div
        style={{
          width: 300,
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          borderRadius: 16,
          boxShadow:
            "0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03)",
          overflow: "hidden",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 28px 56px rgba(0, 0, 0, 0.15), 0 12px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03)";
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
              }}
            >
              ✨
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              AI Suggestion
            </span>
          </div>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.6)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Content */}
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              Proposed Content
            </p>
            <div
              style={{
                borderLeft: "3px solid rgba(99, 102, 241, 0.3)",
                paddingLeft: 10,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1e293b",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {action.content}
              </p>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              Why this?
            </p>
            <p
              style={{
                fontSize: 11,
                color: "rgba(71, 85, 105, 0.9)",
                lineHeight: 1.5,
                fontWeight: 500,
                background: "rgba(248, 250, 252, 0.5)",
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(241, 245, 249, 0.5)",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              &ldquo;{action.reasoning}&rdquo;
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              onClick={() => onApprove(action)}
              style={{
                flex: 1,
                padding: "10px 16px",
                border: "none",
                borderRadius: 12,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 6px 20px rgba(34, 197, 94, 0.35)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 12px rgba(34, 197, 94, 0.25)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            >
              <span style={{ fontSize: 13 }}>✔</span> Approve
            </button>
            <button
              onClick={() => onDismiss(action)}
              style={{
                padding: "10px 16px",
                border: "1px solid #fecaca",
                borderRadius: 12,
                background: "white",
                color: "#ef4444",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#fef2f2";
                (e.currentTarget as HTMLElement).style.borderColor = "#f87171";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "white";
                (e.currentTarget as HTMLElement).style.borderColor = "#fecaca";
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            >
              <span style={{ fontSize: 13 }}>✕</span> Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Connector line pointing down to the target position */}
      <div
        style={{
          position: "absolute",
          bottom: -16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <div
          style={{
            width: 2,
            height: 12,
            background: "linear-gradient(to bottom, rgba(99, 102, 241, 0.4), transparent)",
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#6366f1",
            boxShadow: "0 0 0 4px rgba(99, 102, 241, 0.1)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
