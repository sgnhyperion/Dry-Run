import { streamBrain, activeProvider, type ChatMessage } from "@/lib/brain";
import { SentenceChunker } from "@/lib/sentences";
import { textToSpeech } from "@/lib/voice";

export const runtime = "nodejs";
// Never let a CDN or the framework buffer this route — buffering a stream defeats its entire purpose.
export const dynamic = "force-dynamic";

/**
 * One conversational turn, streamed and PIPELINED.
 *
 * The old pipeline was three blocking stages end to end:
 *     brain (all of it) → TTS (all of it) → play
 * so the user heard nothing until everything was finished.
 *
 * Here the stages OVERLAP. Tokens stream in; the chunker cuts a speakable sentence the moment one
 * is complete; that sentence's TTS starts IMMEDIATELY while the model keeps writing. Synthesis for
 * sentence N+1 happens behind the audio for sentence N that's already playing.
 *
 * Two rules make that safe:
 *   1. TTS calls are STARTED eagerly and concurrently, and a separate consumer drains them
 *      WHILE the model is still generating — first audio never waits on the full reply.
 *   2. Audio is EMITTED strictly in order, because speech played out of order is worse than
 *      speech played slowly.
 * So concurrency buys latency without ever risking ordering.
 *
 * Emits SSE. Every stage is timestamped, because "it feels faster" is not an engineering claim —
 * the client renders these as a live latency budget.
 */
export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages[] required" }, { status: 400 });
  }

  const t0 = performance.now();
  const since = () => Math.round(performance.now() - t0);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (event: Record<string, unknown>) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      // Barge-in / navigation: when the client aborts, stop burning tokens and TTS immediately.
      const abort = new AbortController();
      request.signal.addEventListener("abort", () => abort.abort());

      const timings: Record<string, number> = {};
      const chunker = new SentenceChunker();
      let fullReply = "";
      let sentenceIndex = 0;

      // ── The producer/consumer pair that makes this actually concurrent ──────────────
      // TTS jobs land here the moment a sentence is cut. A separate drain loop consumes them
      // IN ORDER while the model is still generating — so audio 0 goes out as soon as its own
      // synthesis finishes, not after the whole reply is written.
      const ttsJobs: Promise<{ index: number; wav: ArrayBuffer }>[] = [];
      let producerDone = false;
      let notify: (() => void) | null = null;
      const jobAdded = () => new Promise<void>((resolve) => (notify = resolve));
      const wake = () => {
        notify?.();
        notify = null;
      };

      const synthesize = (text: string, index: number) => {
        send({ type: "sentence", index, text, at: since() });
        if (timings.firstSentenceMs === undefined) timings.firstSentenceMs = since();
        ttsJobs.push(textToSpeech(text).then((wav) => ({ index, wav })));
        wake();
      };

      // Consumer: strictly ordered emission. Speech played out of order is worse than slow speech,
      // so concurrency lives in when jobs START, never in when they're SENT.
      const drain = (async () => {
        let i = 0;
        for (;;) {
          if (i >= ttsJobs.length) {
            if (producerDone) return;
            await jobAdded();
            continue;
          }
          if (abort.signal.aborted) return;

          const { index, wav } = await ttsJobs[i++];

          if (timings.firstAudioMs === undefined) {
            timings.firstAudioMs = since();
            send({ type: "timing", key: "firstAudioMs", ms: timings.firstAudioMs });
          }
          send({ type: "audio", index, at: since(), wav: Buffer.from(wav).toString("base64") });
        }
      })();

      try {
        send({ type: "start", provider: activeProvider(), at: 0 });

        // ── Producer: stream the brain, cutting sentences as they complete ─────────────
        for await (const delta of streamBrain(messages, abort.signal)) {
          if (abort.signal.aborted) break;

          if (timings.llmFirstTokenMs === undefined) {
            timings.llmFirstTokenMs = since();
            send({ type: "timing", key: "llmFirstTokenMs", ms: timings.llmFirstTokenMs });
          }

          fullReply += delta;
          send({ type: "token", text: delta });

          for (const sentence of chunker.push(delta)) {
            synthesize(sentence, sentenceIndex++);
          }
        }

        const tail = chunker.flush();
        if (tail && !abort.signal.aborted) synthesize(tail, sentenceIndex++);
        timings.llmDoneMs = since();

        producerDone = true;
        wake();
        await drain;

        timings.totalMs = since();
        send({ type: "done", reply: fullReply, timings, aborted: abort.signal.aborted });
      } catch (error) {
        console.error("turn failed:", error);
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Turn failed",
        });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Tells nginx not to buffer — matters the moment this is deployed behind a proxy.
      "X-Accel-Buffering": "no",
    },
  });
}
