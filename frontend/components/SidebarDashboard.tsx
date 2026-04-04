"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Board = {
  id: string;
  title: string;
  created_at: string;
};

export function SidebarDashboard() {
  const { user, loading } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (user) {
      // Fetch boards from the database
      supabase
        .from("boards")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setBoards(data);
          }
        });
    }
  }, [user, pathname]);

  if (loading || !user) return null;

  return (
    <div
      style={{
        width: "240px",
        height: "100%",
        backgroundColor: "#f9f9f9",
        borderRight: "1px solid #e2e2e2",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        zIndex: 100, // Stay above background elements
      }}
    >
      <div style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a", margin: "0 0 16px 0", letterSpacing: "-0.2px" }}>
          Your Dashboard
        </h2>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button
            style={{
              width: "100%",
              height: "40px",
              backgroundColor: "#1a1a1a",
              color: "#fff",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "opacity 0.2s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Board
          </button>
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 20px" }}>
        <h3 style={{ fontSize: "12px", textTransform: "uppercase", color: "#888", fontWeight: 600, padding: "0 8px", marginBottom: "8px", letterSpacing: "0.5px" }}>
          Recent Boards
        </h3>
        {boards.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#666", padding: "8px" }}>No boards yet. Create one!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {boards.map((board) => {
              const url = `/b/${board.id}`;
              const isActive = pathname === url;
              return (
                <Link key={board.id} href={url} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      backgroundColor: isActive ? "#e2e2e2" : "transparent",
                      color: isActive ? "#000" : "#444",
                      fontSize: "13px",
                      fontWeight: isActive ? 500 : 400,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.backgroundColor = "#eee" }}
                    onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.backgroundColor = "transparent" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {board.title}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
