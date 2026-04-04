"use client";

import React, { useState, useCallback, useRef } from "react";
import { sendToAgent, AgentMode, DEFAULT_SESSION_ID } from "@/lib/agent";
import type { CanvasFullHandle } from "@/components/Canvas";

interface ChatInputProps {
  canvasRef: React.RefObject<CanvasFullHandle | null>;
  agentMode: AgentMode;
  agentEnabled: boolean;
  sessionId?: string;
}

export default function ChatInput({
  canvasRef,
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

    const canvas = canvasRef.current;
    if (!canvas) return;

    const shapes = canvas.getShapesForBackend();
    setInput("");
    setIsLoading(true);
    setStatusText("Connecting…");

    let streamFailed = false;
    try {
      const actions = await sendToAgent(trimmed, shapes, agentMode, sessionId);
      setStatusText("Processing…");
      for (const action of actions) {
        if (action.tentative) {
          canvas.addSuggestion(action);
        } else {
          canvas.placeAgentShape(action);
        }
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
  }, [input, isLoading, agentEnabled, canvasRef, agentMode, sessionId]);

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
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 600,
        padding: "0 16px",
        zIndex: 3000,
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          borderRadius: 18,
          padding: 6,
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow:
            "0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)",
          transition: "box-shadow 0.2s ease",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (statusText.startsWith("Error")) {
              setStatusText("");
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to brainstorm, group, or organize…"
          disabled={isLoading}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "10px 14px",
            fontSize: 14,
            color: "#1e293b",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isLoading || !input.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: 14,
            border: "none",
            background:
              isLoading || !input.trim()
                ? "#cbd5e1"
                : "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            boxShadow:
              isLoading || !input.trim()
                ? "none"
                : "0 4px 12px rgba(59, 130, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }}
              />
              Thinking…
            </>
          ) : (
            <>
              <span style={{ fontSize: 14 }}>⚡</span>
              Send
            </>
          )}
        </button>
      </div>

      {statusText ? (
        <div
          style={{
            marginTop: 8,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: statusText.startsWith("Error") ? "#ef4444" : "#94a3b8",
              animation: isLoading
                ? "pulse 2s ease-in-out infinite"
                : undefined,
            }}
          >
            {isLoading ? `Agent Stream Active • ${statusText}` : statusText}
          </span>
        </div>
      ) : null}
    </div>
  );
}
