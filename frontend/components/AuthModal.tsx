"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only enable portal on client to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isSignUp, setIsSignUp] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode("choose");
      setIsSignUp(false);
      setEmail("");
      setPassword("");
    }
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Account created successfully!");
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      alert(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(4px)",
          zIndex: 99998,
          animation: "fadeIn 0.15s ease",
          pointerEvents: "auto",
          cursor: "default",
        }}
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 99999,
          width: "min(400px, calc(100vw - 32px))",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
          padding: "32px",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          animation: "slideUp 0.2s ease",
          pointerEvents: "auto",
          cursor: "default",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#888",
            padding: "4px",
            borderRadius: "6px",
            lineHeight: 1,
            fontSize: "18px",
            transition: "color 0.1s",
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = "#333")}
          onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = "#888")}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "#1a1a1a",
              borderRadius: "10px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16L10 4L16 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 12H13.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2
            id="auth-modal-title"
            style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.3px" }}
          >
            Sign in to share
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#666", lineHeight: 1.5 }}>
            Create a free account to share and collaborate on your drawings.
          </p>
        </div>

        {mode === "choose" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Google */}
            <button
              id="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                height: "44px",
                borderRadius: "10px",
                border: "1px solid #e2e2e2",
                backgroundColor: "#fff",
                color: "#1a1a1a",
                fontSize: "14px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.15s, box-shadow 0.15s",
                opacity: loading ? 0.7 : 1,
                pointerEvents: "auto",
              }}
              onMouseEnter={(e) =>
                !loading &&
                ((e.currentTarget.style.backgroundColor = "#f7f7f7"),
                (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"))
              }
              onMouseLeave={(e) =>
                ((e.currentTarget.style.backgroundColor = "#fff"),
                (e.currentTarget.style.boxShadow = "none"))
              }
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e8e8e8" }} />
              <span style={{ fontSize: "12px", color: "#aaa", fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e8e8e8" }} />
            </div>

            {/* Email */}
            <button
              id="auth-email-btn"
              onClick={() => { setMode("email"); setIsSignUp(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                height: "44px",
                borderRadius: "10px",
                border: "1px solid #e2e2e2",
                backgroundColor: "#fff",
                color: "#1a1a1a",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color 0.15s, box-shadow 0.15s",
                pointerEvents: "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7f7f7";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="#555" strokeWidth="1.5"/>
                <path d="M1 5.5L8 9.5L15 5.5" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Continue with email
            </button>

            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#999", textAlign: "center", lineHeight: 1.6 }}>
              By continuing, you agree to our{" "}
              <a href="#" style={{ color: "#555", textDecoration: "underline" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="#" style={{ color: "#555", textDecoration: "underline" }}>Privacy Policy</a>.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <button
              type="button"
              onClick={() => setMode("choose")}
              style={{
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666",
                fontSize: "13px",
                padding: "0 0 4px 0",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "4px",
                pointerEvents: "auto",
              }}
            >
              ← Back
            </button>

            <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Email</label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    height: "42px",
                    borderRadius: "8px",
                    border: "1px solid #e2e2e2",
                    padding: "0 12px",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    outline: "none",
                    transition: "border-color 0.15s",
                    pointerEvents: "auto",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1a1a1a")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e2e2")}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Password</label>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    height: "42px",
                    borderRadius: "8px",
                    border: "1px solid #e2e2e2",
                    padding: "0 12px",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    outline: "none",
                    transition: "border-color 0.15s",
                    pointerEvents: "auto",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1a1a1a")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e2e2")}
                />
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "4px",
                  height: "44px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#1a1a1a",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                  opacity: loading ? 0.7 : 1,
                  pointerEvents: "auto",
                }}
              >
                {loading ? (isSignUp ? "Signing up…" : "Signing in…") : (isSignUp ? "Create account" : "Sign in")}
              </button>
            </form>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontSize: "13px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  pointerEvents: "auto",
                }}
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );

  // createPortal mounts directly on document.body — completely outside
  // tldraw's DOM tree, escaping its pointer-events:none layout wrappers
  return createPortal(content, document.body);
}
