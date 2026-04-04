"use client";

import { use } from "react";
import CollaborativeTldraw from "@/components/CollaborativeTldraw";
import { Room } from "@/app/Room";
import { SignInButton } from "@/components/SignInButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SidebarDashboard } from "@/components/SidebarDashboard";
import { TLComponents } from "tldraw";
import { useBoard } from "@/hooks/useBoard";

// We create a wrapper to display both the Copy Link button and the Sign In button.
function TopNavWrapper() {
  // To get the roomId inside here, we can extract it from the URL since we are on /b/[roomId]
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

const components: TLComponents = {
  SharePanel: TopNavWrapper,
};

export default function BoardPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { isReadonly } = useBoard(roomId);

  return (
    <Room roomId={roomId}>
      <div className="flex w-full h-screen bg-[#f9f9f9] overflow-hidden">
        <SidebarDashboard />
        <div className="flex-1 relative bg-white border-l border-[#e2e2e2] shadow-sm overflow-hidden">
          {/* Tldraw wrapper */}
          <div className="absolute inset-0">
            <CollaborativeTldraw components={components} isReadonly={isReadonly} />
          </div>
        </div>
      </div>
    </Room>
  );
}
