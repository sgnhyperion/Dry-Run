import { streamBrain, activeProvider, type ChatMessage } from "@/lib/brain";
import { analyzeAnswer, buildDirective } from "@/lib/agents";
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
  const { messages, mode = "pipelined", directive } = (await request.json()) as {
    messages: ChatMessage[];
    /** Coaching note produced by the analyst DURING the previous turn. See lib/agents.ts. */
    directive?: string | null;
    /**
     * "sequential" reproduces the OLD blocking pipeline — full reply, then one TTS call — so the
     * two strategies can be A/B'd through identical code, models, and hardware. It exists purely
     * so the latency claim is measured rather than asserted (scripts/bench-latency.mjs).
     */
    mode?: "pipelined" | "sequential";
  };

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

        // ── The analyst: off the critical path, but HOW depends on the deployment ─────
        // It scores the answer the user just gave and steers the NEXT turn, so nothing in this
        // turn waits on its verdict. The open question is whether to run it *concurrently* with
        // the interviewer or *after* the audio is out — and that's an infrastructure question,
        // not a design preference:
        //
        //   hosted (OpenAI/Gemini) — separate inference infra, so concurrency is genuinely free.
        //   single local Ollama    — one process, one model slot. Concurrency measurably HURT:
        //                            same model → CPU contention pushed TTFA 1463ms → 4307ms;
        //                            different model → an evict-and-reload stalled a turn 56s.
        //                            Deferring until the audio is sent costs nothing audible.
        //
        // "Not awaited" is not the same as "free" when everything shares one machine.
        const runAnalyst = () =>
          analyzeAnswer(messages)
            .then((analysis) => {
              if (abort.signal.aborted) return;
              timings.analystMs = since();
              send({
                type: "analysis",
                at: since(),
                analysis,
                directive: buildDirective(analysis),
              });
            })
            .catch(() => {
              /* best-effort by design — never let the analyst break the conversation */
            });

        const deferAnalyst =
          (process.env.ANALYST_MODE || (activeProvider() === "ollama" ? "deferred" : "concurrent")) ===
          "deferred";
        const analystJob = deferAnalyst ? null : runAnalyst();

        // Context engineering: the directive from the PREVIOUS turn's analyst rides in as a
        // system-adjacent note on the latest user message, so the interviewer adapts without
        // the candidate ever seeing the scoring machinery.
        const contexted: ChatMessage[] = directive
          ? messages.map((m, i) =>
              i === messages.length - 1 && m.role === "user"
                ? { ...m, content: `${m.content}\n\n${directive}` }
                : m,
            )
          : messages;

        // ── Producer: stream the brain, cutting sentences as they complete ─────────────
        for await (const delta of streamBrain(contexted, { signal: abort.signal })) {
          if (abort.signal.aborted) break;

          if (timings.llmFirstTokenMs === undefined) {
            timings.llmFirstTokenMs = since();
            send({ type: "timing", key: "llmFirstTokenMs", ms: timings.llmFirstTokenMs });
          }

          fullReply += delta;
          send({ type: "token", text: delta });

          // Sequential mode deliberately does NOT cut sentences here — it waits for everything.
          if (mode === "pipelined") {
            for (const sentence of chunker.push(delta)) {
              synthesize(sentence, sentenceIndex++);
            }
          }
        }

        timings.llmDoneMs = since();

        if (mode === "pipelined") {
          const tail = chunker.flush();
          if (tail && !abort.signal.aborted) synthesize(tail, sentenceIndex++);
        } else if (fullReply.trim() && !abort.signal.aborted) {
          // The old way: one synthesis of the whole reply, started only once the model is done.
          synthesize(fullReply.trim(), sentenceIndex++);
        }

        producerDone = true;
        wake();
        await drain;

        // The voice path is DONE here. Stamp it before joining the analyst — otherwise the
        // off-critical-path agent would inflate the very metric that exists to prove it isn't on
        // the critical path.
        timings.totalMs = since();

        // Either join the concurrent analyst, or start the deferred one now that the audio is
        // fully sent. Both paths keep it off the critical path; only the contention differs.
        await (analystJob ?? runAnalyst());
        send({ type: "done", reply: fullReply, timings, mode, aborted: abort.signal.aborted });
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
