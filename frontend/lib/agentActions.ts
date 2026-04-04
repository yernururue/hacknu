/**
 * agentActions.ts
 *
 * Registers the tldraw editor and exposes helpers to apply AI-driven canvas changes.
 * Use `applyBackendAgentAction` for SSE payloads from POST /agent/message.
 */

import type {
  Editor,
  TLArrowShape,
  TLGeoShape,
  TLNoteShape,
  TLShapeId,
  TLTextShape,
} from "tldraw";
import { createShapeId } from "tldraw";
import { toRichText } from "@tldraw/tlschema";
import type { TLDefaultColorStyle } from "@tldraw/tlschema";
import type { AgentAction } from "@/lib/agent";

// --- Types for programmatic placement (non-SSE) ---

export type ProgrammaticAgentShape =
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

export function getEditor() {
  return _editor;
}

const AGENT_COLOR_TO_TL: Record<string, TLDefaultColorStyle> = {
  yellow: "yellow",
  blue: "blue",
  green: "green",
  pink: "light-violet",
  orange: "orange",
  purple: "violet",
};

function mapAgentColor(c: string | undefined, fallback: TLDefaultColorStyle = "blue"): TLDefaultColorStyle {
  if (!c) return fallback;
  const k = c.toLowerCase();
  return AGENT_COLOR_TO_TL[k] ?? fallback;
}

/**
 * Applies one backend /agent SSE action on the canvas (place_sticky, move_sticky, etc.).
 */
export function applyBackendAgentAction(action: AgentAction): void {
  if (!_editor) {
    console.warn("[agentActions] Editor not yet ready. Call registerEditor() first.");
    return;
  }

  const editor = _editor;
  const kind = action.action;

  if (kind === "place_sticky") {
    const shapeId = createShapeId(
      `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    );
    const props: TLNoteShape["props"] = {
      color: mapAgentColor(action.color, "blue"),
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
        agentReasoning: action.reasoning ?? "",
      },
    });
    return;
  }

  if (kind === "move_sticky") {
    if (action.id === undefined || action.x === undefined || action.y === undefined) return;
    const sid = action.id as TLShapeId;
    const shape = editor.getShape(sid);
    if (!shape) return;
    editor.updateShape({
      id: sid,
      type: shape.type,
      x: action.x,
      y: action.y,
    });
    return;
  }

  if (kind === "group_stickies") {
    const ids = (action.ids ?? []).map((id) => id as TLShapeId);
    if (ids.length === 0) return;
    const box = editor.getShapesPageBounds(ids);
    if (!box) return;

    const pad = 40;
    const x = box.x - pad;
    const y = box.y - pad;
    const w = Math.max(box.w + pad * 2, 80);
    const h = Math.max(box.h + pad * 2, 80);
    const strokeColor = mapAgentColor(action.color, "blue");

    const rectId = createShapeId(`agent-group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    const geoProps: TLGeoShape["props"] = {
      geo: "rectangle",
      w,
      h,
      color: strokeColor,
      fill: "semi",
      dash: "draw",
      size: "s",
      font: "draw",
      align: "start",
      verticalAlign: "start",
      growY: 0,
      url: "",
      richText: toRichText(""),
      labelColor: "black",
      scale: 1,
    };

    editor.createShape<TLGeoShape>({
      id: rectId,
      type: "geo",
      x,
      y,
      props: geoProps,
      opacity: 0.45,
      meta: { isAgentShape: true, agentGroupRect: true },
    });
    editor.sendToBack([rectId]);

    const label = action.label?.trim() ?? "Group";
    const labelId = createShapeId(`agent-glabel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    const textProps: TLTextShape["props"] = {
      color: strokeColor,
      size: "s",
      font: "draw",
      textAlign: "start",
      w: 400,
      richText: toRichText(label),
      scale: 1,
      autoSize: true,
    };
    editor.createShape<TLTextShape>({
      id: labelId,
      type: "text",
      x: x + 8,
      y: y + 6,
      props: textProps,
      meta: { isAgentShape: true, agentGroupLabel: true },
    });
    return;
  }

  if (kind === "connect_stickies") {
    if (!action.from_id || !action.to_id) return;
    const from = editor.getShapePageBounds(action.from_id as TLShapeId);
    const to = editor.getShapePageBounds(action.to_id as TLShapeId);
    if (!from || !to) return;

    const ax = from.x + from.w / 2;
    const ay = from.y + from.h / 2;
    const bx = to.x + to.w / 2;
    const by = to.y + to.h / 2;
    const dx = bx - ax;
    const dy = by - ay;

    const labelText = action.label?.trim() ?? "";

    const arrowProps: TLArrowShape["props"] = {
      kind: "arc",
      elbowMidPoint: 0.5,
      dash: "draw",
      size: "m",
      fill: "none",
      color: "black",
      labelColor: "black",
      bend: 0,
      start: { x: 0, y: 0 },
      end: { x: dx, y: dy },
      arrowheadStart: "none",
      arrowheadEnd: "arrow",
      richText: toRichText(labelText),
      labelPosition: 0.5,
      font: "draw",
      scale: 1,
    };
    editor.createShape<TLArrowShape>({
      type: "arrow",
      x: ax,
      y: ay,
      meta: { isAgentShape: true },
      props: arrowProps,
    });
    return;
  }

  if (kind === "place_label") {
    if (action.x === undefined || action.y === undefined) return;
    const labelId = createShapeId(`agent-label-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    const textProps: TLTextShape["props"] = {
      color: "black",
      size: "l",
      font: "draw",
      textAlign: "start",
      w: 480,
      richText: toRichText(action.content ?? ""),
      scale: 1,
      autoSize: true,
    };
    editor.createShape<TLTextShape>({
      id: labelId,
      type: "text",
      x: action.x,
      y: action.y,
      props: textProps,
      meta: { isAgentShape: true, agentLabel: true },
    });
    return;
  }

  console.warn("[agentActions] Unknown action.action:", kind);
}

// --- Legacy programmatic API (sticky-note / point arrow) ---

export function placeAgentShape(action: ProgrammaticAgentShape): void {
  if (!_editor) {
    console.warn("[agentActions] Editor not yet ready. Call registerEditor() first.");
    return;
  }

  const editor = _editor;

  if (action.type === "sticky-note") {
    const label = action.label ?? "🤖 Agent";

    editor.createShape<TLNoteShape>({
      type: "note",
      x: action.x,
      y: action.y,
      props: {
        color: "orange",
        labelColor: "black",
        size: "l",
        font: "draw",
        fontSizeAdjustment: 0,
        align: "middle",
        verticalAlign: "middle",
        growY: 0,
        url: "",
        richText: toRichText(`${label}\n${action.text}`),
        scale: 1,
      },
      meta: {
        isAgentShape: true,
        agentLabel: label,
      },
    });
  } else if (action.type === "arrow") {
    const dx = action.toX - action.fromX;
    const dy = action.toY - action.fromY;

    const legacyArrow: TLArrowShape["props"] = {
      kind: "arc",
      elbowMidPoint: 0.5,
      color: "orange",
      labelColor: "black",
      fill: "none",
      dash: "draw",
      size: "l",
      bend: 0,
      start: { x: 0, y: 0 },
      end: { x: dx, y: dy },
      arrowheadStart: "none",
      arrowheadEnd: "arrow",
      richText: toRichText(action.label ?? ""),
      labelPosition: 0.5,
      font: "draw",
      scale: 1,
    };
    editor.createShape<TLArrowShape>({
      type: "arrow",
      x: action.fromX,
      y: action.fromY,
      props: legacyArrow,
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
