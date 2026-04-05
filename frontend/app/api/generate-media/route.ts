import { NextRequest } from "next/server";
// CHANGED: removed Anthropic import, replaced with Groq
import Groq from "groq-sdk";
import { generateImageFromText, generateVideoFromImage } from "@/lib/higgsfield";

export async function POST(req: NextRequest) {
  // CHANGED: removed Anthropic key check, now validates Groq key
  const groqKey = process.env.GROQ_API_KEY ?? "";
  if (!groqKey.startsWith("gsk_")) {
    return new Response(
      JSON.stringify({
        error: "GROQ_API_KEY missing or invalid in frontend/.env.local — must start with gsk_",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Higgsfield credentials check — unchanged
  const hfId = process.env.HIGGSFIELD_KEY_ID ?? "";
  const hfSecret = process.env.HIGGSFIELD_KEY_SECRET ?? "";
  if (!hfId || !hfSecret || hfSecret.startsWith("=")) {
    return new Response(
      JSON.stringify({
        error:
          `Higgsfield credentials invalid. ID=${hfId ? "set" : "MISSING"}, ` +
          `SECRET=${hfSecret.startsWith("=") ? "has == typo" : hfSecret ? "set" : "MISSING"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = (await req.json()) as { stickyText?: string; mode?: "image" | "video" };
  const stickyText = body.stickyText ?? "";
  const mode = body.mode === "image" ? "image" : "video";

  // CHANGED: Groq client instead of Anthropic
  const groq = new Groq({ apiKey: groqKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        console.log("[generate-media] sending:", chunk.trim());
        controller.enqueue(encoder.encode(chunk));
      };

      try {
        console.log("[generate-media] starting for:", stickyText.slice(0, 120));
        send("progress", { step: "prompt", message: "Writing cinematic prompt..." });

        // CHANGED: Groq/llama call instead of Anthropic/Claude
        const groqRes = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: `Convert this brainstorm idea into a cinematic visual prompt
for AI image generation. Be specific about lighting, camera angle,
mood, and visual style. Keep it under 80 words.
Idea: "${stickyText}"`,
            },
          ],
        });

        // CHANGED: Groq response shape is choices[0].message.content
        const cinematicPrompt =
          groqRes.choices[0]?.message?.content ?? stickyText;

        send("progress", {
          step: "prompt_done",
          message: "Generating image...",
          prompt: cinematicPrompt,
        });

        // Higgsfield image generation — unchanged
        const imageUrl = await generateImageFromText(cinematicPrompt);
        send("progress", {
          step: "image_done",
          message:
            mode === "image" ? "Image ready." : "Animating image into video...",
          imageUrl,
        });

        if (mode === "image") {
          send("done", { imageUrl, prompt: cinematicPrompt });
          return;
        }

        const videoUrl = await generateVideoFromImage(imageUrl, cinematicPrompt);
        send("done", { imageUrl, videoUrl, prompt: cinematicPrompt });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Generation failed";
        console.error("[generate-media] ERROR:", err);
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
