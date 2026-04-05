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
import { notePlainText } from "@/components/GenerateMediaButton";
import { consumeGenerateMediaSse } from "@/lib/generateMediaSse";

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

/** Minimal shape view for grouping bounds (page space). */
export type AgentShapeView = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
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

export function getAgentShapeViews(editor: Editor): AgentShapeView[] {
  return editor.getCurrentPageShapes().map((shape) => {
    const b = editor.getShapePageBounds(shape.id);
    return {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: b?.w,
      height: b?.h,
    };
  });
}

/**
 * Runs the same pipeline as the sticky “Generate Video” button (Claude → image → video).
 */
/**
 * Instruments menu: create a sticky and run Higgsfield image and/or video generation from a free-form prompt.
 */
export function runHiggsfieldFromPrompt(prompt: string, mode: "image" | "video"): void {
  const editor = _editor;
  if (!editor) {
    console.warn("[agentActions] Editor not ready for Higgsfield generation");
    return;
  }
  const trimmed = prompt.trim();
  if (!trimmed) return;

  const shapeId = createShapeId(`media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const vp = editor.getViewportPageBounds();
  const x = vp.x + vp.w / 2 - 160;
  const y = vp.y + vp.h / 2 - 100;

  editor.createShape<TLNoteShape>({
    id: shapeId,
    type: "note",
    x,
    y,
    props: {
      color: "light-violet",
      labelColor: "black",
      size: "m",
      font: "draw",
      fontSizeAdjustment: 0,
      align: "middle",
      verticalAlign: "middle",
      growY: 0,
      url: "",
      richText: toRichText(trimmed),
      scale: 1,
    },
    meta: { isAgentShape: true },
  });

  void (async () => {
    try {
      const res = await fetch("/api/generate-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stickyText: trimmed, mode }),
      });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) detail = j.error;
        } catch {
          /* ignore */
        }
        console.error("[runHiggsfieldFromPrompt]", detail);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) return;
      await consumeGenerateMediaSse(reader, editor, shapeId as string);
    } catch (e) {
      console.error("[runHiggsfieldFromPrompt]", e);
    }
  })();
}

export function triggerVideoGeneration(sourceStickyId: string, prompt: string): void {
  const editor = _editor;
  if (!editor) {
    console.warn("[agentActions] Editor not ready for generate_video");
    return;
  }
  const shape = editor.getShape(sourceStickyId as TLShapeId);
  let stickyText = prompt;
  if (shape?.type === "note") {
    const t = notePlainText(editor, shape as TLNoteShape).trim();
    if (t) stickyText = t;
  }

  void (async () => {
    try {
      const res = await fetch("/api/generate-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stickyText }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      await consumeGenerateMediaSse(reader, editor, sourceStickyId);
    } catch (e) {
      console.error("[agentActions] generate_video failed", e);
    }
  })();
}

/**
 * Applies one backend agent action using the current editor.
 * `shapes` should reflect the canvas before this action (used for group bounds).
 */
export function executeAgentAction(
  action: AgentAction,
  shapes: AgentShapeView[],
  editor: Editor
): void {
  switch (action.action) {
    case "place_sticky": {
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
          agentTentative: action.tentative ?? false,
        },
      });
      break;
    }

    case "move_sticky": {
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
      break;
    }

    case "edit_sticky": {
      if (!action.id) return;
      const sid = action.id as TLShapeId;
      const shape = editor.getShape(sid);
      if (!shape || shape.type !== "note") return;
      const prev = shape as TLNoteShape;
      editor.updateShape({
        id: sid,
        type: "note",
        props: {
          ...prev.props,
          richText: toRichText(action.content ?? ""),
        },
      });
      break;
    }

    case "delete_sticky": {
      if (!action.id) return;
      editor.deleteShapes([action.id as TLShapeId]);
      break;
    }

    case "group_stickies": {
      const idList = action.ids ?? [];
      const snapshotMembers = shapes.filter((s) => idList.includes(s.id));
      if (snapshotMembers.length === 0) break;

      const ids = snapshotMembers.map((s) => s.id as TLShapeId);
      const members = ids.map((id) => editor.getShape(id)).filter((s): s is NonNullable<typeof s> => !!s);
      if (members.length === 0) break;

      const gap = 24;
      let minY = Infinity;
      const boundsList = members.map((m) => {
        const b = editor.getShapePageBounds(m.id);
        if (!b) return null;
        minY = Math.min(minY, b.y);
        return { id: m.id, type: m.type, b };
      }).filter((x): x is NonNullable<typeof x> => !!x);

      if (boundsList.length === 0) break;

      let cursorX = Math.min(...boundsList.map((x) => x.b.x));
      for (const { id, type, b } of boundsList) {
        editor.updateShape({
          id,
          type,
          x: cursorX,
          y: minY,
        });
        cursorX += b.w + gap;
      }

      const box = editor.getShapesPageBounds(ids);
      if (!box) break;

      const pad = 50;
      const x = box.x - pad;
      const y = box.y - pad;
      const w = Math.max(box.w + pad * 2, 80);
      const h = Math.max(box.h + pad * 2, 80);
      const strokeColor = mapAgentColor(action.color, "blue");

      const rectId = createShapeId(`agent-group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
      const label = action.label?.trim() ?? "Group";
      const colorKey = (action.color ?? "blue").toLowerCase();
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
        opacity: 0,
        meta: {
          isAgentShape: true,
          agentGroupRect: true,
          agentGroupLabel: label,
          agentColorKey: colorKey,
        },
      });
      editor.sendToBack([rectId]);
      break;
    }

    case "ungroup_stickies": {
      if (!action.group_id) return;
      editor.deleteShapes([action.group_id as TLShapeId]);
      break;
    }

    case "connect_stickies": {
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
        opacity: 0,
        meta: {
          isAgentShape: true,
          agentFromId: action.from_id,
          agentToId: action.to_id,
          agentArrowLabel: labelText,
        },
        props: arrowProps,
      });
      break;
    }

    case "clear_canvas": {
      const ids = editor.getCurrentPageShapes().map((s) => s.id);
      if (ids.length > 0) editor.deleteShapes(ids);
      break;
    }

    case "generate_video": {
      const sid = action.source_sticky_id ?? "";
      const p = action.prompt ?? "";
      triggerVideoGeneration(sid, p);
      break;
    }

    case "place_label": {
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
      break;
    }

    default:
      console.warn("[agentActions] Unknown action.action:", action.action);
  }
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
  const shapes = getAgentShapeViews(editor);
  executeAgentAction(action, shapes, editor);
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
