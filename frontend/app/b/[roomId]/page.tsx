"use client";

import { use } from "react";
import CollaborativeTldraw from "@/components/CollaborativeTldraw";
import { Room } from "@/app/Room";
import { SignInButton } from "@/components/SignInButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { TLComponents, DefaultMainMenu, DefaultMainMenuContent, TldrawUiMenuGroup, TldrawUiMenuItem } from "tldraw";
import { useBoard } from "@/hooks/useBoard";
import { useBoardsList } from "@/hooks/useBoardsList";
import { useRouter } from "next/navigation";

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
                  // Optimistically update the UI by reloading, or just triggering an update
                  // But we don't have local state mutation easily accessible here, so let's import supabase
                  const { supabase } = await import('@/lib/supabase');
                  await supabase.from('boards').update({ title: newTitle.trim() }).eq('id', board.id);
                  // Refresh page to show new name immediately (simplest approach for now)
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
      {/* Renders standard Tldraw Edit/View/Export menus below your boards */}
      <DefaultMainMenuContent />
    </DefaultMainMenu>
  );
}

const components: TLComponents = {
  SharePanel: TopNavWrapper,
  MainMenu: CustomMainMenu,
};

export default function BoardPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { isReadonly } = useBoard(roomId);

  return (
    <Room roomId={roomId}>
      <div className="flex w-full h-screen bg-[#f9f9f9] overflow-hidden">
        {/* We removed the explicit SidebarDashboard component from here */}
        <div className="flex-1 relative bg-white shadow-sm overflow-hidden">
          <div className="absolute inset-0">
            <CollaborativeTldraw components={components} isReadonly={isReadonly} />
          </div>
        </div>
      </div>
    </Room>
  );
}
