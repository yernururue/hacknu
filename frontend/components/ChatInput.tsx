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
          padding: "5px 5px 5px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)", // same shadow as toolbar
        }}
      >

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (statusText.startsWith("Error")) setStatusText("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to brainstorm, group, or organize…"
          disabled={isLoading}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "7px 6px",
            fontSize: 13,
            color: "#111827",
            fontWeight: 400,
            fontFamily: "inherit",
          }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isLoading || !input.trim()}
          style={{
            padding: "7px 16px",
            borderRadius: 9,       // slightly inset from outer 12px radius
            border: "none",
            background: isLoading || !input.trim() ? "#f3f4f6" : "#4f46e5",
            color: isLoading || !input.trim() ? "#9ca3af" : "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            cursor: isLoading || !input.trim() ? "default" : "pointer",
            transition: "background 0.15s",
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
            fontFamily: "inherit",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => {
            if (!isLoading && input.trim()) {
              (e.currentTarget as HTMLElement).style.background = "#4338ca";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && input.trim()) {
              (e.currentTarget as HTMLElement).style.background = "#4f46e5";
            }
          }}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  border: "2px solid rgba(156,163,175,0.4)",
                  borderTopColor: "#9ca3af",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }}
              />
              Working
            </>
          ) : (
            <>Send</>
          )}
        </button>
      </div>
    </div>
  );
}
