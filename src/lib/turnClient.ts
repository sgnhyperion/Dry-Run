"use client";

export type TurnTimings = {
  llmFirstTokenMs?: number;
  firstSentenceMs?: number;
  firstAudioMs?: number;
  llmDoneMs?: number;
  totalMs?: number;
  /** Client-side: STT round-trip. Added by the caller, not the server. */
  sttMs?: number;
  /** Client-side: mic release → first audible word. The number the user actually feels. */
  perceivedMs?: number;
};

export type TurnEvent =
  | { type: "start"; provider: string }
  | { type: "token"; text: string }
  | { type: "sentence"; index: number; text: string; at: number }
  | { type: "audio"; index: number; wav: string; at: number }
  | { type: "timing"; key: string; ms: number }
  | { type: "done"; reply: string; timings: TurnTimings; aborted: boolean }
  | { type: "error"; message: string };

export type TurnHandlers = {
  onStart?: (provider: string) => void;
  onToken?: (text: string) => void;
  onSentence?: (index: number, text: string) => void;
  onAudio?: (index: number, wavBase64: string) => void | Promise<void>;
  onTiming?: (key: string, ms: number) => void;
  onDone?: (reply: string, timings: TurnTimings) => void;
  onError?: (message: string) => void;
};

/**
 * Consumes the /api/turn SSE stream.
 *
 * Hand-rolled rather than using EventSource, for two reasons that both matter here:
 *   1. EventSource is GET-only — it can't send a transcript body.
 *   2. EventSource offers no way to abort mid-stream, and aborting IS barge-in. The AbortSignal
 *      threaded through here propagates all the way to the server, which stops generating and
 *      stops synthesizing the moment the user starts talking.
 */
export async function runTurn(
  messages: { role: "user" | "assistant"; content: string }[],
  handlers: TurnHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok || !res.body) {
    handlers.onError?.(`Turn failed (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line. A network chunk can land mid-frame, so only
    // parse up to the last complete separator and keep the remainder buffered.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;

      const event = JSON.parse(line.slice(6)) as TurnEvent;
      switch (event.type) {
        case "start":
          handlers.onStart?.(event.provider);
          break;
        case "token":
          handlers.onToken?.(event.text);
          break;
        case "sentence":
          handlers.onSentence?.(event.index, event.text);
          break;
        case "audio":
          await handlers.onAudio?.(event.index, event.wav);
          break;
        case "timing":
          handlers.onTiming?.(event.key, event.ms);
          break;
        case "done":
          handlers.onDone?.(event.reply, event.timings);
          break;
        case "error":
          handlers.onError?.(event.message);
          break;
      }
    }
  }
}
