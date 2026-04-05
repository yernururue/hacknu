import {
  AssetRecordType,
  createShapeId,
  type Editor,
  type TLShapeId,
} from "tldraw";

/** Shared SSE consumer for POST /api/generate-media (browser). */
export async function consumeGenerateMediaSse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  editor: Editor,
  stickyId: string,
  onProgress?: (message: string) => void,
  onError?: (message: string) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";

    for (const line of parts) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      }

      if (line.startsWith("data: ")) {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(line.slice(6)) as Record<string, unknown>;
        } catch {
          continue;
        }

        if (currentEvent === "progress" && onProgress) {
          onProgress(String(data.message ?? ""));
        }

        console.log("[media] event:", currentEvent, "data:", data);

        if (currentEvent === "done") {
          const sticky = editor.getShape(stickyId as TLShapeId);
          if (!sticky) return;

          const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl : undefined;
          const videoUrl = typeof data.videoUrl === "string" ? data.videoUrl : undefined;

          if (videoUrl) {
            const vidAssetId = AssetRecordType.createId();
            editor.createAssets([
              {
                id: vidAssetId,
                typeName: "asset",
                type: "video",
                meta: {},
                props: {
                  name: "generated-video.mp4",
                  src: videoUrl,
                  w: 1024,
                  h: 576,
                  mimeType: "video/mp4",
                  isAnimated: true,
                },
              },
            ]);

            editor.createShape({
              id: createShapeId(),
              type: "video",
              x: sticky.x,
              y: sticky.y,
              props: {
                assetId: vidAssetId,
                w: 600,
                h: 337,
              },
            });
            editor.deleteShapes([sticky.id]);
          } else if (imageUrl) {
            const imgAssetId = AssetRecordType.createId();
            editor.createAssets([
              {
                id: imgAssetId,
                typeName: "asset",
                type: "image",
                meta: {},
                props: {
                  name: "generated-image.png",
                  src: imageUrl,
                  w: 1024,
                  h: 576,
                  mimeType: "image/png",
                  isAnimated: false,
                },
              },
            ]);

            editor.createShape({
              id: createShapeId(),
              type: "image",
              x: sticky.x,
              y: sticky.y,
              props: {
                assetId: imgAssetId,
                w: 600,
                h: 337,
              },
            });
            editor.deleteShapes([sticky.id]);
          }
        }


        if (currentEvent === "error") {
          const msg = String(data.message ?? "Generation failed");
          console.error("[generate-media] SSE error:", msg);
          onError?.(msg);
        }
      }
    }
  }
}


