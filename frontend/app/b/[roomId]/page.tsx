"use client";

import { use, useState, useCallback } from "react";
import CollaborativeTldraw from "@/components/CollaborativeTldraw";
import { Room } from "@/app/Room";
import { SignInButton } from "@/components/SignInButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { TLComponents, DefaultMainMenu, DefaultMainMenuContent, TldrawUiMenuGroup, TldrawUiMenuItem } from "tldraw";
import { useBoard } from "@/hooks/useBoard";
import { useBoardsList } from "@/hooks/useBoardsList";
import { useRouter } from "next/navigation";
import ChatInput from "@/components/ChatInput";
import { agentCanvasLayerComponents } from "@/components/AgentCanvasLayers";
import { AgentMode, sendToAgent, extractCanvasShapes } from "@/lib/agent";
import { getEditor, applyBackendAgentAction } from "@/lib/agentActions";

function TopNavWrapper() {
  const roomId = typeof window !== "undefined" ? window.location.pathname.split('/').pop() || "" : "";
  const { board, isOwner, updateAccess } = useBoard(roomId);

  return (
    <div style={{ display: "flex", gap: "8px", pointerEvents: "auto", zIndex: 999 }}>
      {isOwner && board && (
        <select
          value={board.link_access}
          onChange={(e) => updateAccess(e.target.value as "edit" | "view")}
          style={{
            height: "36px",
            padding: "0 12px",
            borderRadius: "8px",
            border: "1px solid #e2e2e2",
            backgroundColor: "#fff",
            color: "#1a1a1a",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            outline: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <option value="edit">Anyone can edit</option>
          <option value="view">Anyone can view</option>
        </select>
      )}
      <CopyLinkButton roomId={roomId} />
      <SignInButton />
    </div>
  );
}

// We inject the Your Boards list straight into the Tldraw Native Menu Dropdown
function CustomMainMenu() {
  const { boards, user } = useBoardsList();
  const router = useRouter();

  return (
    <DefaultMainMenu>
      {user && (
        <TldrawUiMenuGroup id="your-boards">
          <TldrawUiMenuItem
            id="new-board"
            label="✨ Create New Board"
            onSelect={() => router.push("/")}
            readonlyOk
          />
          {boards.slice(0, 5).map((board) => (
            <div
              key={board.id}
              onContextMenu={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const newTitle = window.prompt("Rename this board:", board.title);
                if (newTitle && newTitle.trim() !== "" && newTitle !== board.title) {
                  const { supabase } = await import('@/lib/supabase');
                  await supabase.from('boards').update({ title: newTitle.trim() }).eq('id', board.id);
                  window.location.reload();
                }
              }}
            >
              <TldrawUiMenuItem
                id={`board-${board.id}`}
                label={`📄 ${board.title}`}
                onSelect={() => { window.location.href = `/b/${board.id}`; }}
                readonlyOk
              />
            </div>
          ))}
        </TldrawUiMenuGroup>
      )}
      <DefaultMainMenuContent />
    </DefaultMainMenu>
  );
}

const components: TLComponents = {
  SharePanel: TopNavWrapper,
  MainMenu: CustomMainMenu,
  ...agentCanvasLayerComponents,
};

export default function BoardPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { isReadonly } = useBoard(roomId);
  
  // Agent states
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [agentMode, setAgentMode] = useState<AgentMode>("idea_generator");
  const [summarizeLoading, setSummarizeLoading] = useState(false);

  // Agent summarizing action
  const handleSummarize = useCallback(async () => {
    if (!agentEnabled || summarizeLoading) return;

    const editor = getEditor();
    if (!editor) return;

    const shapes = extractCanvasShapes(editor);
    setSummarizeLoading(true);

    try {
      const actions = await sendToAgent(
        "Summarize all ideas into key themes",
        shapes,
        "summarizer",
        roomId
      );
      for (const action of actions) {
        applyBackendAgentAction(action);
      }
    } catch (error) {
      console.error("Failed to summarize:", error);
    } finally {
      setSummarizeLoading(false);
    }
  }, [agentEnabled, summarizeLoading, roomId]);

  // Analyze screen action
  const handleAnalyze = useCallback(async () => {
    if (!agentEnabled || summarizeLoading) return;

    const editor = getEditor();
    if (!editor) return;

    const shapes = extractCanvasShapes(editor);
    setSummarizeLoading(true);

    try {
      const actions = await sendToAgent(
        "Analyze the current canvas: identify patterns, gaps, and connections between ideas",
        shapes,
        agentMode,
        roomId
      );
      for (const action of actions) {
        applyBackendAgentAction(action);
      }
    } catch (error) {
      console.error("Failed to analyze:", error);
    } finally {
      setSummarizeLoading(false);
    }
  }, [agentEnabled, summarizeLoading, agentMode, roomId]);

  return (
    <Room roomId={roomId}>
      <div className="flex w-full h-screen bg-[#f9f9f9] overflow-hidden relative">
        <div className="flex-1 relative bg-white shadow-sm overflow-hidden">
          <div className="absolute inset-0">
            <CollaborativeTldraw components={components} isReadonly={isReadonly} />
          </div>
          
          {/* AI Controls Overlay */}
          <div style={{ position: "absolute", zIndex: 1000, pointerEvents: "none", inset: 0 }}>
            {/* We re-enable pointer events for the actual children */}
            <div style={{ pointerEvents: "auto" }}>
              <ChatInput
                agentEnabled={agentEnabled}
                agentMode={agentMode}
                sessionId={roomId}
                onSummarize={handleSummarize}
                onAnalyze={handleAnalyze}
                isPanelLoading={summarizeLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </Room>
  );
}
