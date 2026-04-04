"use client";

import React, {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Tldraw, Editor, createShapeId, TLComponents, TLNoteShape } from "tldraw";
import "tldraw/tldraw.css";
import { toRichText } from "@tldraw/tlschema";
import { ClientSideSuspense } from "@liveblocks/react";
import { useSync } from "@/lib/useSync";
import { registerEditor } from "@/lib/agentActions";
import {
  extractCanvasShapes,
  AgentAction,
  CanvasShapePayload,
  actionsEqual,
} from "@/lib/agent";
import AgentSuggestion from "./AgentSuggestion";

export interface CanvasHandle {
  placeAgentShape: (action: AgentAction) => void;
  getShapesForBackend: () => CanvasShapePayload[];
  getEditor: () => Editor | null;
}

export interface CanvasFullHandle extends CanvasHandle {
  addSuggestion: (action: AgentAction) => void;
}

interface InnerCanvasProps {
  components?: TLComponents;
}

const InnerCanvas = forwardRef<CanvasFullHandle, InnerCanvasProps>(
  function InnerCanvas({ components }, ref) {
    const storeWithStatus = useSync();
    const [editor, setEditor] = useState<Editor | null>(null);
    const [activeSuggestions, setActiveSuggestions] = useState<AgentAction[]>(
      []
    );

    const placeAgentShape = useCallback(
      (action: AgentAction) => {
        if (!editor) return;
        if (action.action && action.action !== "place_sticky") return;

        const shapeId = createShapeId(
          `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        );

        const props: TLNoteShape["props"] = {
          color: "blue",
          labelColor: "black",
          size: "m",
          font: "draw",
          fontSizeAdjustment: 0,
          align: "middle",
          verticalAlign: "middle",
          growY: 0,
          url: "",
          richText: toRichText(action.content ?? ""),
          scale: 1,
        };

        editor.createShape<TLNoteShape>({
          id: shapeId,
          type: "note",
          x: action.x ?? 200,
          y: action.y ?? 200,
          props,
          meta: {
            isAgentShape: true,
            agentReasoning: action.reasoning,
          },
        });
      },
      [editor]
    );

    const getShapesForBackend = useCallback((): CanvasShapePayload[] => {
      if (!editor) return [];
      return extractCanvasShapes(editor);
    }, [editor]);

    const getEditor = useCallback(() => editor, [editor]);

    const addSuggestion = useCallback((action: AgentAction) => {
      setActiveSuggestions((prev) => {
        const next = [...prev, action];
        if (next.length <= 3) return next;
        return next.slice(next.length - 3);
      });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        placeAgentShape,
        getShapesForBackend,
        getEditor,
        addSuggestion,
      }),
      [placeAgentShape, getShapesForBackend, getEditor, addSuggestion]
    );

    const handleMount = useCallback((ed: Editor) => {
      setEditor(ed);
      registerEditor(ed);
    }, []);

    const handleApproveSuggestion = useCallback(
      (action: AgentAction) => {
        placeAgentShape(action);
        setActiveSuggestions((prev) =>
          prev.filter((s) => !actionsEqual(s, action))
        );
      },
      [placeAgentShape]
    );

    const handleDismissSuggestion = useCallback((action: AgentAction) => {
      setActiveSuggestions((prev) =>
        prev.filter((s) => !actionsEqual(s, action))
      );
    }, []);

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Tldraw
            store={storeWithStatus.store}
            components={components}
            onMount={handleMount}
            autoFocus
          />
        </div>

        {activeSuggestions.map((suggestion, index) => (
          <AgentSuggestion
            key={`${suggestion.x}-${suggestion.y}-${suggestion.content}-${index}`}
            action={suggestion}
            onApprove={handleApproveSuggestion}
            onDismiss={handleDismissSuggestion}
          />
        ))}
      </div>
    );
  }
);

const Canvas = forwardRef<CanvasFullHandle, { components?: TLComponents }>(
  function Canvas({ components }, ref) {
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
              background: "#fafbfc",
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 14,
              color: "#94a3b8",
              letterSpacing: "0.02em",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "3px solid #e2e8f0",
                  borderTopColor: "#6366f1",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Connecting to canvas…
            </div>
          </div>
        }
      >
        <InnerCanvas ref={ref} components={components} />
      </ClientSideSuspense>
    );
  }
);

export default Canvas;
