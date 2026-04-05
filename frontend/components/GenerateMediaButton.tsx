"use client";

import { useState, useCallback } from "react";
import { useEditor, type Editor, type TLNoteShape } from "tldraw";
import { renderPlaintextFromRichText } from "tldraw";
import { consumeGenerateMediaSse } from "@/lib/generateMediaSse";

interface Props {
  stickyId: string;
  stickyText: string;
}

export function GenerateMediaButton({ stickyId, stickyText }: Props) {
  const editor = useEditor();
  const [step, setStep] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setStep("Starting...");

    try {
      const res = await fetch("/api/generate-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stickyText }),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* ignore */
        }
        setStep(msg.slice(0, 120));
        setTimeout(() => setStep(null), 6000);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStep("No stream");
        setTimeout(() => setStep(null), 4000);
        return;
      }

      let errored = false;
      await consumeGenerateMediaSse(
        reader,
        editor,
        stickyId,
        (msg) => setStep(msg || "Working..."),
        (msg) => {
          errored = true;
          setStep(`Error: ${msg}`);
        }
      );
      if (!errored) setStep(null);
      else setTimeout(() => setStep(null), 4000);
    } catch (e) {
      console.error(e);
      setStep("Request failed");
      setTimeout(() => setStep(null), 4000);
    }
  }, [editor, stickyId, stickyText]);

  return (
    <button
      type="button"
      onClick={() => void handleGenerate()}
      disabled={!!step}
      style={{
        fontSize: 11,
        padding: "3px 8px",
        background: step ? "#9CA3AF" : "#6366F1",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: step ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {step || "🎬 Generate Video"}
    </button>
  );
}

export function notePlainText(editor: Editor, shape: TLNoteShape): string {
  try {
    return renderPlaintextFromRichText(editor, shape.props.richText) ?? "";
  } catch {
    return "";
  }
}
