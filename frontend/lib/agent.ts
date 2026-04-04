export type AgentAction = {
  action: "place_sticky" | "update_shape" | "delete_shape" | "suggest" | "group" | "draw_arrow";
  content?: string;
  x?: number;
  y?: number;
  shape_id?: string;
  reasoning: string;
  tentative: boolean;
};

type StreamCallbacks = {
  onThinking: (text: string) => void;
  onAction: (action: AgentAction) => void;
  onClose: () => void;
  onError: (error: any) => void;
};

/**
 * Custom SSE implementation because standard EventSource doesn't support POST with body.
 */
export async function streamAgentMessage(
  message: string,
  shapes: any[],
  agentMode: string,
  callbacks: StreamCallbacks
) {
  try {
    const response = await fetch("http://localhost:8000/agent/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        shapes,
        agent_mode: agentMode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to connect to agent: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body reader available.");
    }

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split by double newline (SSE event separator)
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || ""; // Keep the last partial piece in the buffer

      for (const part of parts) {
        if (!part.trim()) continue;

        const lines = part.split("\n");
        let event = "";
        let data = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            event = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            data = line.replace("data: ", "").trim();
          }
        }

        if (event === "thinking") {
          callbacks.onThinking(data);
        } else if (event === "action") {
          try {
            const action = JSON.parse(data) as AgentAction;
            callbacks.onAction(action);
          } catch (e) {
            console.error("Failed to parse agent action JSON:", e, data);
          }
        } else if (event === "close") {
          callbacks.onClose();
          return;
        }
      }
    }
  } catch (error) {
    callbacks.onError(error);
  }
}
