"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { sendToAgent, AgentMode, DEFAULT_SESSION_ID, extractCanvasShapes } from "@/lib/agent";
import { applyBackendAgentAction, getEditor } from "@/lib/agentActions";

interface ChatInputProps {
  agentMode: AgentMode;
  agentEnabled: boolean;
  sessionId?: string;
  onSummarize?: () => void;
  onAnalyze?: () => void;
  isPanelLoading?: boolean;
}

export default function ChatInput({
  agentMode,
  agentEnabled,
  sessionId = DEFAULT_SESSION_ID,
  onSummarize,
  onAnalyze,
  isPanelLoading = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [generationModalType, setGenerationModalType] = useState<"video" | "image" | null>(null);
  const [selectedModel, setSelectedModel] = useState("default");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const shouldSendVoiceRef = useRef(false);

  const submitToAgent = useCallback(
    async (message: string, audioData?: string, imageData?: string) => {
      const editor = getEditor();
      if (!editor) {
        setStatusText("Editor not ready");
        return;
      }

      const shapes = extractCanvasShapes(editor);
      setIsLoading(true);
      setStatusText("Connecting…");

      let streamFailed = false;
      try {
        const actions = await sendToAgent(message, shapes, agentMode, sessionId, audioData, imageData);
        setStatusText("Processing…");
        for (const action of actions) {
          applyBackendAgentAction(action);
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
    },
    [agentMode, sessionId]
  );

  const submitToAgentRef = useRef(submitToAgent);
  submitToAgentRef.current = submitToAgent;

  useEffect(() => {
    return () => {
      shouldSendVoiceRef.current = false;
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isLoading || !agentEnabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mime =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const send = shouldSendVoiceRef.current;
        shouldSendVoiceRef.current = false;

        const chunks = chunksRef.current;
        chunksRef.current = [];
        mediaRecorderRef.current = null;

        setIsRecording(false);

        if (!send) {
          return;
        }

        const blob = new Blob(chunks, {
          type: mr.mimeType && mr.mimeType !== "" ? mr.mimeType : "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          void submitToAgentRef.current("voice input", base64);
        };
        reader.readAsDataURL(blob);
      };

      mr.start(250);
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      setStatusText("Microphone access denied or unavailable");
    }
  }, [agentEnabled, isLoading]);

  const cancelRecording = useCallback(() => {
    shouldSendVoiceRef.current = false;
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (isRecording) {
      shouldSendVoiceRef.current = true;
      setStatusText("Preparing audio…");
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;
    if (isLoading || !agentEnabled) return;

    const editor = getEditor();
    if (!editor) {
      setStatusText("Editor not ready");
      return;
    }

    setInput("");
    const imgData = attachedImage;
    setAttachedImage(null);
    await submitToAgent(trimmed, undefined, imgData ?? undefined);
  }, [input, isLoading, agentEnabled, isRecording, submitToAgent, attachedImage]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusText("Error: Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setAttachedImage(ev.target.result);
        setStatusText("Attach successful");
      }
    };
    reader.onerror = () => {
      setStatusText("Error reading file");
    };
    reader.readAsDataURL(file);
    
    // clear input so same file can be chosen again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

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

  const sendDisabled = isLoading || (!input.trim() && !isRecording);

  return (
    <>
    <div
      style={{
        position: "absolute",
        bottom: 64, // sits just above the Tldraw toolbar, matching its gap
        left: "50%",
        transform: "translateX(-50%)",
        width: "fit-content", // matches toolbar's auto width behavior
        minWidth: 440,
        maxWidth: 520,
        padding: "8px",
        background: "#ffffff",
        border: "1px solid #e2e5e9",
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        zIndex: 3000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
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
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: statusText.startsWith("Error") || statusText.includes("denied")
                ? "#dc2626"
                : "#6b7280",
            }}
          >
            {isLoading ? `● ${statusText}` : statusText}
          </span>
        </div>
      )}

      {/* Top Row: Input bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 4px",
        }}
      >
        {attachedImage && (
          <div style={{ position: "relative", width: 28, height: 28, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid #e5e7eb" }}>
            <img src={attachedImage} alt="Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => setAttachedImage(null)}
              style={{ position: "absolute", top: -2, right: -2, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", width: 14, height: 14, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, cursor: "pointer", padding: 0 }}
            >
              ×
            </button>
          </div>
        )}

        {!isRecording ? (
          <button
            type="button"
            title="Start voice input"
            onClick={() => void startRecording()}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: isLoading ? "#d1d5db" : "#9ca3af",
              cursor: isLoading ? "default" : "pointer",
              padding: 6,
              borderRadius: 8,
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (isLoading) return;
              (e.currentTarget as HTMLElement).style.color = "#4b5563";
              (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = isLoading ? "#d1d5db" : "#9ca3af";
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
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 0 2px rgba(239,68,68,0.2)",
              }}
            />
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
              type="button"
              onClick={cancelRecording}
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
          disabled={sendDisabled}
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            border: "none",
            background: sendDisabled ? "#f3f4f6" : "#1f2937",
            color: sendDisabled ? "#d1d5db" : "#ffffff",
            cursor: sendDisabled ? "default" : "pointer",
            transition: "background 0.15s, color 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!sendDisabled) {
              (e.currentTarget as HTMLElement).style.background = "#111827";
            }
          }}
          onMouseLeave={(e) => {
            if (!sendDisabled) {
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

      {/* Bottom Row: + and Instruments */}
      {!isRecording && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, paddingBottom: 4 }}>
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {/* Plus icon button */}
          <button
            type="button"
            title="Upload Media"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26,
              borderRadius: "50%",
              background: "transparent", border: "1px solid #e5e7eb",
              color: "#6b7280", cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          
          {/* Instruments Button and Dropdown */}
          <div style={{ position: "relative" }}>
            <button
               type="button"
               onClick={() => setShowTools(!showTools)}
               style={{
                 display: "flex", alignItems: "center", gap: 6,
                 fontSize: 12, fontWeight: 500, color: "#4b5563",
                 background: showTools ? "#f3f4f6" : "transparent",
                 border: "none", borderRadius: 8, padding: "6px 10px",
                 cursor: "pointer", transition: "background 0.15s",
               }}
               onMouseEnter={(e) => {
                 (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
               }}
               onMouseLeave={(e) => {
                 (e.currentTarget as HTMLElement).style.background = showTools ? "#f3f4f6" : "transparent";
               }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Инструменты
            </button>

            {showTools && (
              <div style={{
                position: "absolute", bottom: "100%", left: 0, marginBottom: 8,
                background: "#ffffff", border: "1px solid #e2e5e9", borderRadius: 12,
                padding: "8px", width: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                display: "flex", flexDirection: "column", gap: 4, zIndex: 10
              }}>
                <button
                  disabled={isPanelLoading || isLoading}
                  onClick={() => { onSummarize?.(); setShowTools(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
                    background: "transparent", border: "none", borderRadius: 6,
                    fontSize: 13, color: "#374151", cursor: (isPanelLoading || isLoading) ? "default" : "pointer",
                    opacity: (isPanelLoading || isLoading) ? 0.5 : 1, textAlign: "left"
                  }}
                  onMouseEnter={(e) => {
                    if (!isPanelLoading && !isLoading) (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
                  Summarize Canvas
                </button>
                <button
                  disabled={isPanelLoading || isLoading}
                  onClick={() => { onAnalyze?.(); setShowTools(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
                    background: "transparent", border: "none", borderRadius: 6,
                    fontSize: 13, color: "#374151", cursor: (isPanelLoading || isLoading) ? "default" : "pointer",
                    opacity: (isPanelLoading || isLoading) ? 0.5 : 1, textAlign: "left"
                  }}
                  onMouseEnter={(e) => {
                    if (!isPanelLoading && !isLoading) (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  Analyze Screen
                </button>
                <button
                  onClick={() => { setGenerationModalType("video"); setShowTools(false); setSelectedModel("default"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
                    background: "transparent", border: "none", borderRadius: 6,
                    fontSize: 13, color: "#374151", cursor: "pointer", textAlign: "left"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                  Generate Video
                </button>
                <button
                  onClick={() => { setGenerationModalType("image"); setShowTools(false); setSelectedModel("default"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
                    background: "transparent", border: "none", borderRadius: 6,
                    fontSize: 13, color: "#374151", cursor: "pointer", textAlign: "left"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Generate Image
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {generationModalType && (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.4)", zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "auto"
      }}>
        <div style={{
          background: "#fff", borderRadius: 16, padding: 24, width: 440,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: 16,
          fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif"
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#111827" }}>
            Generate {generationModalType === "video" ? "Video" : "Image"}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>
            Select a model to use for {generationModalType === "video" ? "video" : "image"} generation.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Available Models (from API)</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1px solid #d1d5db", fontSize: 14, background: "#fff",
                outline: "none", color: "#111827"
              }}
            >
              <option value="default">{generationModalType === "video" ? "Higgsfield Video Model" : "Midjourney (via Agent)"}</option>
              <option value="dalle3">{generationModalType === "image" ? "DALL-E 3" : "Sora (coming soon)"}</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <button
              onClick={() => setGenerationModalType(null)}
              style={{
                background: "transparent", border: "none", fontSize: 14, fontWeight: 500,
                color: "#6b7280", padding: "8px 16px", cursor: "pointer", borderRadius: 8,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert(`Triggering ${generationModalType} generation with model: ${selectedModel}`);
                setGenerationModalType(null);
              }}
              style={{
                background: "#111827", border: "none", fontSize: 14, fontWeight: 500,
                color: "#fff", padding: "8px 16px", cursor: "pointer", borderRadius: 8,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
