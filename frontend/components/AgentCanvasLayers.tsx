"use client";

/**
 * Custom SVG renderers for agent group rectangles (behind stickies) and
 * connector arrows (above stickies). Wired via TLComponents OnTheCanvas + Overlays.
 */

import { useEditor, useValue, type TLGeoShape, type TLShape, type TLShapeId } from "tldraw";

export const colorMap: Record<string, string> = {
  yellow: "#FCD34D",
  blue: "#93C5FD",
  green: "#6EE7B7",
  pink: "#F9A8D4",
  orange: "#FDB07A",
  purple: "#C4B5FD",
};

type GroupRectModel = {
  id: string;
  type: "group_rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
};

type ArrowModel = {
  id: string;
  type: "arrow";
  from_id: string;
  to_id: string;
  label: string;
};

function collectGroupRects(editor: ReturnType<typeof useEditor>): GroupRectModel[] {
  const out: GroupRectModel[] = [];
  for (const s of editor.getCurrentPageShapes()) {
    if (s.type !== "geo" || !s.meta?.agentGroupRect) continue;
    const geo = s as TLGeoShape;
    const meta = s.meta as {
      agentGroupLabel?: string;
      agentColorKey?: string;
    };
    const key = (meta.agentColorKey ?? "blue").toLowerCase();
    out.push({
      id: s.id,
      type: "group_rect",
      x: s.x,
      y: s.y,
      width: geo.props.w,
      height: geo.props.h,
      color: colorMap[key] ?? colorMap.blue,
      label: meta.agentGroupLabel ?? "",
    });
  }
  return out;
}

function collectArrows(editor: ReturnType<typeof useEditor>): ArrowModel[] {
  const out: ArrowModel[] = [];
  for (const s of editor.getCurrentPageShapes()) {
    if (s.type !== "arrow") continue;
    const meta = s.meta as { agentFromId?: string; agentToId?: string; agentArrowLabel?: string };
    if (!meta.agentFromId || !meta.agentToId) continue;
    out.push({
      id: s.id,
      type: "arrow",
      from_id: meta.agentFromId,
      to_id: meta.agentToId,
      label: meta.agentArrowLabel ?? "",
    });
  }
  return out;
}

function renderGroupRect(shape: GroupRectModel) {
  const stroke = shape.color;
  const fill = shape.color;
  return (
    <g key={shape.id}>
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={fill}
        fillOpacity={0.15}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray="8 4"
        rx={12}
      />
      <text
        x={shape.x + 12}
        y={shape.y + 20}
        fontSize={13}
        fontWeight={600}
        fill={stroke}
        opacity={0.8}
      >
        {shape.label}
      </text>
    </g>
  );
}

function renderArrow(shape: ArrowModel, shapes: TLShape[], editor: ReturnType<typeof useEditor>) {
  const byId = new Map<string, TLShape>();
  for (const s of shapes) byId.set(s.id, s);

  const from = byId.get(shape.from_id as TLShapeId);
  const to = byId.get(shape.to_id as TLShapeId);
  if (!from || !to) return null;

  const fromB = editor.getShapePageBounds(from.id);
  const toB = editor.getShapePageBounds(to.id);
  if (!fromB || !toB) return null;

  const x1 = from.x + fromB.w / 2;
  const y1 = from.y + fromB.h / 2;
  const x2 = to.x + toB.w / 2;
  const y2 = to.y + toB.h / 2;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const markerId = `agent-arrowhead-${shape.id.replace(/:/g, "_")}`;

  return (
    <g key={shape.id}>
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#6B7280"
        strokeWidth={1.5}
        markerEnd={`url(#${markerId})`}
        strokeDasharray="6 3"
      />
      {shape.label ? (
        <text x={midX} y={midY - 6} fontSize={11} fill="#6B7280" textAnchor="middle">
          {shape.label}
        </text>
      ) : null}
    </g>
  );
}

/**
 * Renders behind tldraw shapes (same layer order as OnTheCanvas — before ShapesLayer).
 */
export function AgentGroupRectLayer() {
  const editor = useEditor();
  const groupRects = useValue(
    "agent-group-rect-models",
    () => collectGroupRects(editor),
    [editor]
  );

  return (
    <svg
      className="tl-agent-group-rect-layer"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {groupRects.map((shape) => {
        switch (shape.type) {
          case "group_rect":
            return renderGroupRect(shape);
          default:
            return null;
        }
      })}
    </svg>
  );
}

/**
 * Renders above tldraw shapes (Overlays slot — after ShapesLayer in DOM).
 */
export function AgentArrowLayer() {
  const editor = useEditor();
  const arrows = useValue("agent-arrow-models", () => collectArrows(editor), [editor]);
  const pageShapes = useValue("agent-page-shapes", () => editor.getCurrentPageShapes(), [editor]);

  return (
    <svg
      className="tl-agent-arrow-layer"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {arrows.map((shape) => {
        switch (shape.type) {
          case "arrow":
            return renderArrow(shape, pageShapes, editor);
          default:
            return null;
        }
      })}
    </svg>
  );
}

/** Merged TLComponents entries for CollaborativeTldraw / Tldraw */
export const agentCanvasLayerComponents = {
  OnTheCanvas: AgentGroupRectLayer,
  Overlays: AgentArrowLayer,
};
