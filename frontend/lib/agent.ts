/**
 * Connects to the FastAPI backend SSE endpoint (POST /agent/message).
 */

import type { Editor, TLShape } from "tldraw";
import { renderPlaintextFromRichText } from "tldraw";
import type { TLRichText } from "@tldraw/editor";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export const DEFAULT_SESSION_ID = "room-1";

export type AgentMode = "idea_generator" | "devils_advocate" | "summarizer";

export interface CanvasShapePayload {
  id: string;
  text: string;
  x: number;
  y: number;
  shape_type: string;
  /** Sticky / geo stroke color when available (for AI context). */
  color?: string;
}

/** Payload from POST /agent/message SSE (flexible per action type). */
export interface AgentAction {
  action: string;
  content?: string;
  x?: number;
  y?: number;
  reasoning?: string;
  tentative?: boolean;
  color?: string;
  id?: string;
  ids?: string[];
  from_id?: string;
  to_id?: string;
  /** Group title or arrow edge label */
  label?: string;
  group_id?: string;
  source_sticky_id?: string;
  prompt?: string;
}

type ShapeUtilWithText = {
  getText?: (shape: TLShape) => string | undefined;
};

function getPlainTextFromShape(editor: Editor, shape: TLShape): string {
  try {
    const util = editor.getShapeUtil(shape) as ShapeUtilWithText;
    const text = util.getText?.(shape);
    if (typeof text === "string" && text.length > 0) return text;
  } catch {
    /* shape util may not support getText */
  }

  const props = shape.props as {
    text?: string;
    richText?: TLRichText;
  };

  if (typeof props.text === "string" && props.text.length > 0) {
    return props.text;
  }

  if (props.richText) {
    try {
      return renderPlaintextFromRichText(editor, props.richText) ?? "";
    } catch {
      return "";
    }
  }

  return "";
}

function shapeColorForPayload(shape: TLShape): string | undefined {
  const props = shape.props as { color?: string };
  return typeof props.color === "string" && props.color.length > 0 ? props.color : undefined;
}

/**
 * Maps the current page shapes to the payload format expected by the backend.
 */
export function extractCanvasShapes(editor: Editor): CanvasShapePayload[] {
  return editor.getCurrentPageShapes().map((shape) => ({
    id: shape.id,
    text: getPlainTextFromShape(editor, shape),
    x: shape.x,
    y: shape.y,
    shape_type: shape.type,
    color: shapeColorForPayload(shape),
  }));
}

function parseSseEventBlock(block: string): { event: string; data: string } | null {
  const lines = block.split(/\r?\n/);
  let eventType = "";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^\s/, ""));
    }
  }

  if (!eventType) return null;
  return { event: eventType, data: dataLines.join("\n") };
}

/**
 * POSTs to the agent SSE endpoint, reads the stream, and returns all parsed `action` payloads.
 * @param audioData - Optional full data URI (`data:audio/webm;base64,...`) for voice input.
 */
export async function sendToAgent(
  message: string,
  canvasShapes: CanvasShapePayload[],
  mode: AgentMode,
  sessionId: string = DEFAULT_SESSION_ID,
  audioData?: string
): Promise<AgentAction[]> {
  const response = await fetch(`${BACKEND_URL}/agent/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      canvas_state: canvasShapes,
      session_id: sessionId,
      agent_mode: mode,
      ...(audioData !== undefined && audioData !== "" ? { audio_data: audioData } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Agent request failed: ${response.status} ${response.statusText}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body reader available");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  const actions: AgentAction[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const parsed = parseSseEventBlock(trimmed);
      if (!parsed) continue;

      if (parsed.event === "action" && parsed.data) {
        try {
          const raw = JSON.parse(parsed.data) as unknown;
          // SSE payload may be one action or a JSON array of actions
          const batch = Array.isArray(raw) ? raw : [raw];
          for (const item of batch) {
            if (item && typeof item === "object" && !Array.isArray(item)) {
              actions.push(item as AgentAction);
            }
          }
        } catch {
          console.error("Failed to parse agent action JSON:", parsed.data);
        }
      } else if (parsed.event === "done") {
        return actions;
      }
    }
  }

  return actions;
}

export function actionsEqual(a: AgentAction, b: AgentAction): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
