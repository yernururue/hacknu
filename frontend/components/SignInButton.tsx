import { useState, useRef, useEffect } from "react";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function SignInButton() {
  const { user, loading } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Profile Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setIsEditingName(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
  };

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleSaveName = async () => {
    if (!newName.trim()) {
      setIsEditingName(false);
      return;
    }
    await supabase.auth.updateUser({
      data: { name: newName.trim() }
    });
    setIsEditingName(false);
  };

  if (loading) {
    return (
      <div
        style={{
          height: "36px",
          width: "120px",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
          animation: "pulse 1.5s infinite ease-in-out",
        }}
      />
    );
  }

  if (user) {
    return (
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 12px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid #eee",
            backgroundColor: hovered || dropdownOpen ? "#f9f9f9" : "#ffffff",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: hovered ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            pointerEvents: "auto",
          }}
          title="Profile menu"
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#1a1a1a",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {userInitial}
          </div>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a", display: "flex", alignItems: "center", gap: "4px" }}>
            {displayName}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "220px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              border: "1px solid #eee",
              padding: "12px",
              zIndex: 99999,
              fontFamily: "'Inter', sans-serif",
              pointerEvents: "auto",
            }}
          >
            <div style={{ padding: "0 4px 12px 4px", borderBottom: "1px solid #eee", marginBottom: "8px", color: "#666", fontSize: "12px", wordBreak: "break-all" }}>
              Signed in as <strong style={{ color: "#1a1a1a" }}>{user.email}</strong>
            </div>

            {isEditingName ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="New username"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={handleSaveName}
                    style={{ flex: 1, padding: "6px", backgroundColor: "#1a1a1a", color: "white", borderRadius: "6px", border: "none", fontSize: "12px", cursor: "pointer" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    style={{ flex: 1, padding: "6px", backgroundColor: "#f0f0f0", color: "#333", borderRadius: "6px", border: "none", fontSize: "12px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <button
                  onClick={() => { setIsEditingName(true); setNewName(displayName); }}
                  style={{ padding: "8px", textAlign: "left", borderRadius: "6px", border: "none", background: "none", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>
                  Change username
                </button>
                <button
                  onClick={handleSignOut}
                  style={{ padding: "8px", textAlign: "left", borderRadius: "6px", border: "none", background: "none", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#e5484d" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff0f0"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

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
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
