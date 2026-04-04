"use client";

import React from "react";
import { AgentAction } from "@/lib/agent";
import { Editor, useValue } from "tldraw";

interface SuggestionCardProps {
  action: AgentAction;
  editor: Editor | null;
  onApprove: (action: AgentAction) => void;
  onDismiss: (action: AgentAction) => void;
}

export default function SuggestionCard({ action, editor, onApprove, onDismiss }: SuggestionCardProps) {
  // track viewport position of (x, y)
  const pos = useValue("suggestion-pos", () => {
    if (!editor) return { x: action.x ?? 100, y: action.y ?? 100 };
    return editor.pageToViewport({ x: action.x ?? 100, y: action.y ?? 100 });
  }, [editor, action.x, action.y]);

  return (
    <div
      className="absolute z-[3000] animate-in fade-in zoom-in duration-300 ease-out pointer-events-none"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, calc(-100% - 20px))",
      }}
    >
      <div className="w-72 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden flex flex-col pointer-events-auto hover:translate-y-[-4px] transition-all duration-300 group">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">✨</span>
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Suggestion</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposed Content</p>
                <div className="px-1.5 py-0.5 bg-blue-50 rounded text-[9px] text-blue-500 font-bold border border-blue-100">STICKY</div>
            </div>
            <div className="relative">
                <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-500/20 rounded-full"></div>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed pl-2">
                  {action.content}
                </p>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Why this?</p>
            <p className="text-[11px] text-slate-600/90 leading-normal font-medium bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 italic">
              "{action.reasoning}"
            </p>
          </div>
          
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => onApprove(action)}
              className="flex-grow bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span className="text-[13px]">✔</span> Approve
            </button>
            <button
              onClick={() => onDismiss(action)}
              className="px-4 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-[11px] font-bold py-2.5 rounded-xl transition-all border border-slate-200 active:scale-95 flex items-center justify-center"
            >
              <span className="text-[13px]">✖</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Premium Connector line */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <div className="w-0.5 h-4 bg-gradient-to-b from-blue-400 to-transparent opacity-40"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full ring-4 ring-blue-500/10 animate-ping"></div>
      </div>
    </div>
  );
}
