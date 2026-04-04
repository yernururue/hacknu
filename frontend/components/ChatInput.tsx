"use client";

import React, { useState, useCallback, useRef } from "react";
import { sendToAgent, AgentMode, DEFAULT_SESSION_ID, extractCanvasShapes } from "@/lib/agent";
import { placeAgentShape, getEditor } from "@/lib/agentActions";

interface ChatInputProps {
  agentMode: AgentMode;
  agentEnabled: boolean;
  sessionId?: string;
}

export default function ChatInput({
  agentMode,
  agentEnabled,
  sessionId = DEFAULT_SESSION_ID,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !agentEnabled) return;

    const editor = getEditor();
    if (!editor) {
      setStatusText("Editor not ready");
      return;
    }

    const shapes = extractCanvasShapes(editor);
    setInput("");
    setIsLoading(true);
    setStatusText("Connecting…");

    let streamFailed = false;
    try {
      const actions = await sendToAgent(trimmed, shapes, agentMode, sessionId);
      setStatusText("Processing…");
      for (const action of actions) {
        // Map the backend API response to what agentActions expects
        placeAgentShape({
          type: "sticky-note",
          x: action.x,
          y: action.y,
          text: action.content,
          label: action.tentative ? "❓ Suggestion" : "🤖 Agent",
        });
      }
    } catch (error) {
      streamFailed = true;
      console.error("Agent error:", error);
      setStatusText("Error connecting to agent");
    } finally {
      setIsLoading(false);
      if (!streamFailed) {
        setStatusText("");
      }
    }
  }, [input, isLoading, agentEnabled, agentMode, sessionId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  if (!agentEnabled) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 64,           // sits just above the Tldraw toolbar, matching its gap
        left: "50%",
        transform: "translateX(-50%)",
        width: "fit-content",  // matches toolbar's auto width behavior
        minWidth: 440,
        maxWidth: 520,
        padding: 0,
        zIndex: 3000,
        fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif",
      }}
    >
      {/* Inline styles for recording animation */}
      <style>{`
        @keyframes sound-wave {
          0% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0.4); opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Status text above input */}
      {statusText && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 5,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: statusText.startsWith("Error") ? "#dc2626" : "#6b7280",
            }}
          >
            {isLoading ? `● ${statusText}` : statusText}
          </span>
        </div>
      )}

      {/* Input bar — matches Tldraw toolbar shape */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e5e9",
          borderRadius: 12,        // same radius as Tldraw toolbar
          padding: "5px 5px 5px 6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)", // same shadow as toolbar
        }}
      >
        {!isRecording ? (
          <button
            type="button"
            title="Start voice input"
            onClick={() => setIsRecording(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#4b5563";
              (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#9ca3af";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
        ) : (
          <div style={{ padding: "6px", display: "flex", alignItems: "center" }}>
            <div style={{ 
              width: 8, height: 8, borderRadius: "50%", background: "#ef4444", 
              boxShadow: "0 0 0 2px rgba(239,68,68,0.2)"
            }} />
          </div>
        )}

        {isRecording ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20 }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: "100%",
                    background: "#1f2937",
                    borderRadius: 2,
                    animation: `sound-wave 1.2s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
              <span style={{ marginLeft: 8, fontSize: 13, color: "#4b5563", fontWeight: 500 }}>
                Listening...
              </span>
            </div>
            
            <button
              onClick={() => setIsRecording(false)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                color: "#6b7280",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                (e.currentTarget as HTMLElement).style.color = "#374151";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#6b7280";
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (statusText.startsWith("Error")) setStatusText("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask Assistant to organize or group..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: "7px 2px",
              fontSize: 13,
              color: "#111827",
              fontWeight: 400,
              fontFamily: "inherit",
            }}
          />
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isLoading || !input.trim()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            border: "none",
            background: isLoading || (!input.trim() && !isRecording) ? "#f3f4f6" : "#1f2937",
            color: isLoading || (!input.trim() && !isRecording) ? "#d1d5db" : "#ffffff",
            cursor: isLoading || (!input.trim() && !isRecording) ? "default" : "pointer",
            transition: "background 0.15s, color 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isLoading && (input.trim() || isRecording)) {
              (e.currentTarget as HTMLElement).style.background = "#111827";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && (input.trim() || isRecording)) {
              (e.currentTarget as HTMLElement).style.background = "#1f2937";
            }
          }}
        >
          {isLoading ? (
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                border: "2px solid rgba(156,163,175,0.4)",
                borderTopColor: "#9ca3af",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="19" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
