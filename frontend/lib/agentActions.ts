/**
 * agentActions.ts
 *
 * Exposes placeAgentShape() — callable from anywhere in the app (API routes,
 * server actions, other components) to programmatically create shapes on the
 * tldraw canvas.
 *
 * Usage:
 *   import { placeAgentShape } from "@/lib/agentActions";
 *   placeAgentShape({ type: "sticky-note", x: 200, y: 300, text: "Hello!" });
 */

import type { Editor } from "tldraw";

// --- Types ---

export type AgentAction =
  | {
      type: "sticky-note";
      x: number;
      y: number;
      text: string;
      /** Optional label shown as prefix; defaults to "🤖 Agent" */
      label?: string;
    }
  | {
      type: "arrow";
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      label?: string;
    };

// --- Module-level editor reference ---
// Populated by CollaborativeTldraw via registerEditor()

let _editor: Editor | null = null;

export function registerEditor(editor: Editor | null) {
  _editor = editor;
}

// --- Agent shape placement ---

export function placeAgentShape(action: AgentAction): void {
  if (!_editor) {
    console.warn("[agentActions] Editor not yet ready. Call registerEditor() first.");
    return;
  }

  const editor = _editor;

  if (action.type === "sticky-note") {
    const label = action.label ?? "🤖 Agent";

    // Create a note shape (tldraw built-in "note" type)
    editor.createShape({
      type: "note",
      x: action.x,
      y: action.y,
      props: {
        // Distinct visual style: orange background + large size
        color: "orange",
        size: "l",
        text: `${label}\n${action.text}`,
        align: "middle",
        verticalAlign: "middle",
        font: "draw",
        growY: 0,
      },
      // meta lets us query / identify agent shapes programmatically
      meta: {
        isAgentShape: true,
        agentLabel: label,
      },
    });

  } else if (action.type === "arrow") {
    // Create an arrow shape between two points
    const dx = action.toX - action.fromX;
    const dy = action.toY - action.fromY;

    editor.createShape({
      type: "arrow",
      x: action.fromX,
      y: action.fromY,
      props: {
        color: "orange",
        size: "l",
        bend: 0,
        start: { x: 0, y: 0 },
        end: { x: dx, y: dy },
        text: action.label ?? "",
        arrowheadStart: "none",
        arrowheadEnd: "arrow",
      },
      meta: { isAgentShape: true },
    });
  }
}

/**
 * Returns all agent-created shapes currently on the canvas.
 */
export function getAgentShapes() {
  if (!_editor) return [];
  return _editor
    .getCurrentPageShapes()
    .filter((shape) => shape.meta?.isAgentShape === true);
}
