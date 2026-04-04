"use client";

import { ClientSideSuspense } from "@liveblocks/react";
import { Tldraw, TLComponents, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useSync } from "@/lib/useSync";
import { registerEditor } from "@/lib/agentActions";
import { useCallback } from "react";

/**
 * Inner canvas — lives inside ClientSideSuspense so Liveblocks hooks are
 * only called on the client. Registers the editor instance with agentActions
 * so placeAgentShape() is always callable.
 */
function Canvas({ components }: { components?: TLComponents }) {
  const storeWithStatus = useSync();

  const handleMount = useCallback((editor: Editor) => {
    registerEditor(editor);

    // Give agent shapes a distinct visual treatment via CSS custom property
    // tldraw note shapes with color="orange" already look distinct; this adds
    // a subtle glowing border to anything with data-agent="true" in the future.
    const style = document.createElement("style");
    style.id = "agent-shape-styles";
    style.textContent = `
      /* Agent-created note shapes get an orange drop-shadow ring */
      .tl-shape[data-shape-type="note"] {
        transition: filter 0.15s ease;
      }
      .tl-shape[data-shape-type="note"].tl-shape__is-agent {
        filter: drop-shadow(0 0 6px rgba(255, 140, 0, 0.85));
      }
    `;
    if (!document.getElementById("agent-shape-styles")) {
      document.head.appendChild(style);
    }
  }, []);

  const handleUnmount = useCallback(() => {
    registerEditor(null);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        store={storeWithStatus.store}
        components={components}
        onMount={handleMount}
        autoFocus
      />
    </div>
  );
}

/**
 * CollaborativeTldraw
 *
 * Wraps tldraw in Liveblocks' ClientSideSuspense to ensure hooks only run
 * client-side (avoids SSR errors). Exposes the editor via agentActions module
 * so placeAgentShape() can be called from anywhere in the app.
 */
export default function CollaborativeTldraw({
  components,
}: {
  components?: TLComponents;
}) {
  return (
    <ClientSideSuspense
      fallback={
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontSize: "14px",
            color: "#999",
            letterSpacing: "0.02em",
          }}
        >
          Connecting to canvas…
        </div>
      }
    >
      <Canvas components={components} />
    </ClientSideSuspense>
  );
}
