"use client";

import { ClientSideSuspense } from "@liveblocks/react";
import { Tldraw, TLComponents, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useSync } from "@/lib/useSync";
import { registerEditor } from "@/lib/agentActions";
import { useCallback, useState, useEffect } from "react";

/**
 * Inner canvas — lives inside ClientSideSuspense so Liveblocks hooks are
 * only called on the client. Registers the editor instance with agentActions
 * so placeAgentShape() is always callable.
 */
function Canvas({ components, isReadonly }: { components?: TLComponents; isReadonly?: boolean }) {
  const storeWithStatus = useSync();
  const [editor, setEditor] = useState<Editor | null>(null);

  const handleMount = useCallback((mountedEditor: Editor) => {
    registerEditor(mountedEditor);
    setEditor(mountedEditor);

    // Give agent shapes a distinct visual treatment via CSS custom property
    const style = document.createElement("style");
    style.id = "agent-shape-styles";
    style.textContent = `
      .tl-shape[data-shape-type="note"] { transition: filter 0.15s ease; }
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
    setEditor(null);
  }, []);

  useEffect(() => {
    if (editor) {
      editor.updateInstanceState({ isReadonly: !!isReadonly });
    }
  }, [editor, isReadonly]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
  isReadonly = false,
}: {
  components?: TLComponents;
  isReadonly?: boolean;
}) {
  return (
    <ClientSideSuspense
      fallback={
        <div
          style={{
            position: "absolute",
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
      <Canvas components={components} isReadonly={isReadonly} />
    </ClientSideSuspense>
  );
}
