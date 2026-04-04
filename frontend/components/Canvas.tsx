"use client";

import { Tldraw, Editor, createShapeId, exportToBlob } from "tldraw";
import "tldraw/tldraw.css";
import { useState, useCallback, useRef, useMemo } from "react";
import { streamAgentMessage, AgentAction } from "@/lib/agent";
import SuggestionCard from "./SuggestionCard";

export default function Canvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [agentStatus, setAgentStatus] = useState("");
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState("");
  const [activeSuggestions, setActiveSuggestions] = useState<AgentAction[]>([]);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const placeAgentShape = useCallback((action: AgentAction) => {
    if (!editor) return;

    // Update agent cursor position
    if (action.x && action.y) {
      setAgentPos({ x: action.x, y: action.y });
    }

    switch (action.action) {
      case "place_sticky":
        editor.createShape({
          id: createShapeId(action.shape_id || `agent-${Date.now()}`),
          type: "note",
          x: action.x || 100,
          y: action.y || 100,
          props: {
            text: action.content || "",
            color: (action.tentative ? "yellow" : "blue") as any,
            size: "m",
            font: "draw",
            align: "middle",
            verticalAlign: "middle",
            growY: 0,
            url: "",
          } as any,
        });
        break;

      case "update_shape":
        if (action.shape_id) {
          editor.updateShape({
            id: createShapeId(action.shape_id),
            type: "note",
            props: {
              text: action.content,
            } as any,
          });
        }
        break;

      case "delete_shape":
        if (action.shape_id) {
          editor.deleteShape(createShapeId(action.shape_id));
        }
        break;
      
      default:
        console.warn("Unhandled agent action:", action.action);
    }
  }, [editor]);

  const handleApproveSuggestion = useCallback((action: AgentAction) => {
    // Call place shape with tentative: false
    placeAgentShape({ ...action, tentative: false });
    // Remove from active suggestions
    setActiveSuggestions(prev => prev.filter(s => s !== action));
  }, [placeAgentShape]);

  const handleDismissSuggestion = useCallback((action: AgentAction) => {
    // Remove from active suggestions
    setActiveSuggestions(prev => prev.filter(s => s !== action));
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !editor) return;

    const userMessage = input;
    setInput("");
    setIsThinking(true);
    setAgentStatus("Thinking...");

    // Get current shapes for context
    const shapes = Array.from(editor.getCurrentPageShapes().values()).map(s => ({
        id: s.id,
        type: s.type,
        content: (s.props as any).text || (s.props as any).label || "",
        x: s.x,
        y: s.y,
        color: (s.props as any).color,
    }));

    // Capture the canvas image
    let imageBase64: string | undefined = undefined;
    const currentShapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (currentShapeIds.length > 0) {
      try {
        const blob = await exportToBlob({
          editor: editor,
          ids: currentShapeIds,
          format: "png",
        });
        
        imageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error("Failed to capture canvas image:", err);
      }
    }

    await streamAgentMessage(userMessage, shapes, "brainstorm", imageBase64, {
      onThinking: (text) => {
        setAgentStatus(text);
      },
      onAction: (action) => {
        if (action.tentative) {
          setActiveSuggestions(prev => {
              if (prev.length >= 3) {
                  // Keep newest 3
                  return [...prev.slice(1), action];
              }
              return [...prev, action];
          });
          // Still update agent pose so we know where it suggested
          if (action.x && action.y) {
            setAgentPos({ x: action.x, y: action.y });
          }
        } else {
          placeAgentShape(action);
        }
      },
      onClose: () => {
        setIsThinking(false);
        setAgentStatus("");
      },
      onError: (err) => {
        console.error("Agent error:", err);
        setIsThinking(false);
        setAgentStatus("Error connecting to agent.");
      },
    });
  };

  return (
    <div className="relative w-full h-screen bg-slate-50 flex flex-col">
      {/* Canvas Area */}
      <div className="flex-grow relative">
        <Tldraw onMount={handleMount} />

        {/* Ghost Cursor / Agent Thinking Indicator */}
        {isThinking && (
          <div 
            className="absolute z-[1000] pointer-events-none transition-all duration-500 ease-in-out"
            style={{ 
              left: agentPos.x, 
              top: agentPos.y,
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full animate-ping absolute opacity-40"></div>
              <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">AI</span>
              </div>
              <div className="absolute left-8 top-0 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm border border-slate-200 whitespace-nowrap">
                <p className="text-xs font-medium text-slate-700">{agentStatus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Suggestions */}
        {activeSuggestions.map((suggestion, index) => (
          <SuggestionCard 
            key={suggestion.shape_id || `suggest-${index}`}
            action={suggestion}
            editor={editor}
            onApprove={handleApproveSuggestion}
            onDismiss={handleDismissSuggestion}
          />
        ))}
      </div>

      {/* Agent Input Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-[2000]">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 flex items-center gap-2 group transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI to brainstorm, group, or organize..."
            className="flex-grow bg-transparent border-none outline-none px-4 py-2 text-slate-800 placeholder:text-slate-400"
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={isThinking || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
          >
            {isThinking ? "..." : "Ask Agent"}
          </button>
        </div>
        
        {/* Status Bar */}
        {isThinking && (
            <div className="mt-2 text-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold animate-pulse">
                    Agent Stream Active • {agentStatus}
                </span>
            </div>
        )}
      </div>
    </div>
  );
}
