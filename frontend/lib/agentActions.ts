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

    editor.createShape({
      type: "note",
      x: action.x,
      y: action.y,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: {
        color: "orange",
        size: "l",
        // tldraw v4 uses richText for note content
        richText: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: `${label}\n${action.text}` }],
            },
          ],
        },
        align: "middle",
        verticalAlign: "middle",
        font: "draw",
      } as any,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: {
        color: "orange",
        size: "l",
        bend: 0,
        start: { x: 0, y: 0 },
        end: { x: dx, y: dy },
        arrowheadStart: "none",
        arrowheadEnd: "arrow",
      } as any,
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
