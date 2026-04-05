import "server-only";

/**
 * Server-only Higgsfield helpers. Bypasses the broken SDK's 'subscribe' 
 * method to correctly wrap input in the 'params' field required by the latest API.
 */

const BASE_URL = "https://platform.higgsfield.ai";

type V2Like = {
  status: string;
  images?: { url: string }[];
  video?: { url: string };
  request_id?: string;
  url?: string;
  output?: string[];
};

function getHeaders(): HeadersInit {
  const id = process.env.HIGGSFIELD_KEY_ID;
  const secret = process.env.HIGGSFIELD_KEY_SECRET;
  if (!id || !secret) {
    throw new Error("HIGGSFIELD_KEY_ID or HIGGSFIELD_KEY_SECRET not set in env");
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${id}:${secret}`,
  };
}

async function directSubscribe(endpoint: string, input: any): Promise<V2Like> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  const body = JSON.stringify({
    params: {
      input,
    },
  });

  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Higgsfield API error (${res.status}): ${errorBody}`);
  }

  let data = (await res.json()) as V2Like;

  // Polling loop
  if (data.request_id && data.status !== "completed") {
    const pollUrl = `${BASE_URL}/requests/${data.request_id}/status`;
    const startTime = Date.now();
    const MAX_POLL_TIME = 120000; // 2 minutes

    while (true) {
      if (Date.now() - startTime > MAX_POLL_TIME) {
        throw new Error(`Polling exceeded maximum time of ${MAX_POLL_TIME}ms`);
      }

      const pollRes = await fetch(pollUrl, { headers: getHeaders() });
      if (pollRes.ok) {
        const pollData = (await pollRes.json()) as V2Like;
        if (pollData.status === "completed" || pollData.status === "failed" || pollData.status === "nsfw") {
          return pollData;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return data;
}

function requireCompletedImage(res: V2Like): string {
  console.log("[higgsfield] image response:", JSON.stringify(res));
  if (res.status !== "completed") {
    throw new Error(`Image generation did not complete (status=${res.status})`);
  }
  const loose = res as Record<string, unknown>;
  const fromImages = res.images?.[0]?.url;
  if (fromImages) return fromImages;
  const top = typeof loose.url === "string" ? loose.url : undefined;
  if (top) return top;
  const output0 = (loose.output as string[] | undefined)?.[0];
  if (output0) return output0;
  throw new Error(`No image URL in response. Keys: ${Object.keys(loose).join(",")}`);
}

function requireCompletedVideo(res: V2Like): string {
  console.log("[higgsfield] video response:", JSON.stringify(res));
  if (res.status !== "completed") {
    throw new Error(`Video generation did not complete (status=${res.status})`);
  }
  const loose = res as Record<string, unknown>;
  const fromVideo = res.video?.url;
  if (fromVideo) return fromVideo;
  const top = typeof loose.url === "string" ? loose.url : undefined;
  if (top) return top;
  const output0 = (loose.output as string[] | undefined)?.[0];
  if (output0) return output0;
  throw new Error(`No video URL in response. Keys: ${Object.keys(loose).join(",")}`);
}

export async function generateImageFromText(prompt: string): Promise<string> {
  const data = await directSubscribe("/flux-pro/kontext/max/text-to-image", {
    prompt,
    aspect_ratio: "16:9",
    safety_tolerance: 2,
  });
  return requireCompletedImage(data);
}

export async function generateVideoFromImage(imageUrl: string, prompt: string): Promise<string> {
  const data = await directSubscribe("/v1/image2video/dop", {
    model: "dop-turbo",
    prompt,
    input_images: [
      {
        type: "image_url",
        image_url: imageUrl,
      },
    ],
  });
  return requireCompletedVideo(data);
}
