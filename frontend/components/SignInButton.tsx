"use client";

import { useState } from "react";
import { AuthModal } from "./AuthModal";

export function SignInButton() {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        id="sign-in-to-share-btn"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setModalOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0 14px",
          height: "36px",
          borderRadius: "8px",
          border: "1px solid #e2e2e2",
          backgroundColor: hovered ? "#f5f5f5" : "#ffffff",
          color: "#1a1a1a",
          fontSize: "13px",
          fontWeight: 500,
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          cursor: "pointer",
          transition: "background-color 0.15s ease, box-shadow 0.15s ease",
          boxShadow: hovered
            ? "0 1px 4px rgba(0,0,0,0.12)"
            : "0 1px 2px rgba(0,0,0,0.06)",
          whiteSpace: "nowrap",
          userSelect: "none",
          pointerEvents: "auto",
        }}
      >
        {/* Person icon */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <circle cx="8" cy="5" r="3" stroke="#1a1a1a" strokeWidth="1.5" />
          <path
            d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Sign in to share
      </button>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

