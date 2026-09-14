"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRecorder } from "@/lib/useRecorder";
import { AudioQueue } from "@/lib/audioQueue";
import { runTurn, type TurnTimings } from "@/lib/turnClient";

const AvatarViewer = dynamic(() => import("@/components/AvatarViewer"), { ssr: false });

type Msg = { role: "assistant" | "user"; content: string };

export default function InterviewPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey — I'm your interviewer. Tell me a bit about what you work on." },
  ]);
  const [streaming, setStreaming] = useState("");
  const [message, setMessage] = useState("");
  const [timings, setTimings] = useState<TurnTimings | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { recording, start: startRec, stop: stopRec } = useRecorder();
  const ctxRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<AudioQueue | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const busy = thinking || transcribing;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // AudioContext must be created inside a user gesture (autoplay policy) and never on the server.
  const audio = () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      queueRef.current = new AudioQueue(ctxRef.current, () => setSpeaking(false));
    }
    return queueRef.current!;
  };

  /** Barge-in: kill scheduled audio AND tell the server to stop generating. */
  const interrupt = () => {
    queueRef.current?.stop();
    abortRef.current?.abort();
    abortRef.current = null;
    setSpeaking(false);
    setThinking(false);
  };

  const takeTurn = async (userText: string, micReleasedAt?: number, sttMs?: number) => {
    const queue = audio();
    const history: Msg[] = [...messages, { role: "user", content: userText }];

    setMessages(history);
    setStreaming("");
    setThinking(true);
    setError(null);

    const turnTimings: TurnTimings = { sttMs };
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runTurn(
        history,
        {
          onStart: (p) => setProvider(p),
          onToken: (t) => setStreaming((prev) => prev + t),
          onTiming: (key, ms) => {
            Object.assign(turnTimings, { [key]: ms });
            setTimings({ ...turnTimings });
          },
          onAudio: async (_i, wav) => {
            // The moment that matters: first audible word after the user stopped talking.
            if (turnTimings.perceivedMs === undefined && micReleasedAt !== undefined) {
              turnTimings.perceivedMs = Math.round(performance.now() - micReleasedAt);
            }
            setSpeaking(true);
            setThinking(false);
            await queue.enqueue(wav);
          },
          onDone: (reply, serverTimings) => {
            Object.assign(turnTimings, serverTimings);
            setTimings({ ...turnTimings });
            setStreaming("");
            if (reply.trim()) {
              setMessages((prev) => [...prev, { role: "assistant", content: reply.trim() }]);
            }
          },
          onError: (m) => setError(m),
        },
        controller.signal,
      );
    } catch (err) {
      // An abort is a barge-in, not a failure — don't surface it as an error.
      if ((err as Error)?.name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Turn failed");
      }
    } finally {
      setThinking(false);
      abortRef.current = null;
    }
  };

  const handleMic = async () => {
    if (!recording) {
      // Starting to talk while the agent is talking IS the interruption.
      if (speaking || thinking) interrupt();
      audio(); // unlock the AudioContext inside this gesture
      setError(null);
      try {
        await startRec();
      } catch {
        setError("Microphone permission denied.");
      }
      return;
    }

    const releasedAt = performance.now();
    setTranscribing(true);
    let transcript = "";
    let sttMs: number | undefined;

    try {
      const blob = await stopRec();
      if (!blob) throw new Error("No audio captured — hold the mic a little longer.");

      const t = performance.now();
      const res = await fetch("/api/stt", {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Transcription failed (${res.status})`);
      sttMs = Math.round(performance.now() - t);

      transcript = (data.text ?? "").trim();
      if (!transcript) throw new Error("Didn't catch that — try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed.");
    } finally {
      setTranscribing(false);
    }

    if (transcript) await takeTurn(transcript, releasedAt, sttMs);
  };

  const handleSend = () => {
    const text = message.trim();
    if (!text || busy) return;
    if (speaking) interrupt();
    setMessage("");
    void takeTurn(text);
  };

  const status = recording
    ? { label: "Listening", dot: "animate-pulse bg-rose-400" }
    : transcribing
    ? { label: "Transcribing", dot: "animate-pulse bg-sky-400" }
    : speaking
    ? { label: "Speaking", dot: "bg-violet-400" }
    : thinking
    ? { label: "Thinking", dot: "animate-pulse bg-amber-400" }
    : { label: "Ready", dot: "bg-emerald-400" };

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-[#0B0E14] text-zinc-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-72 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto grid h-full w-full max-w-6xl grid-cols-1 gap-5 px-5 py-6 lg:grid-cols-[1fr_20rem]">
        {/* ── main column ─────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-col">
          <header className="mb-4 flex shrink-0 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Dry Run</h1>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Streaming Voice Interviewer
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
              <span className={"h-2 w-2 rounded-full " + status.dot} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300">
                {status.label}
              </span>
            </div>
          </header>

          <div className="relative mb-4 h-52 shrink-0 overflow-hidden rounded-3xl border border-white/10 ring-1 ring-white/5">
            <AvatarViewer showMic={false} />
            {(speaking || thinking) && (
              <button
                onClick={interrupt}
                className="absolute bottom-3 right-3 z-10 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur-md transition hover:bg-black/70"
              >
                Interrupt
              </button>
            )}
          </div>

          <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.content} />
            ))}
            {streaming && <Bubble role="assistant" text={streaming} live />}
            <div ref={bottomRef} />
          </section>

          <footer className="mt-4 shrink-0">
            <div className="relative">
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={recording || transcribing}
                placeholder={recording ? "Listening… click again to send" : "Type, or hit the mic to speak…"}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-36 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none disabled:opacity-60"
              />
              <button
                onClick={handleMic}
                disabled={transcribing}
                aria-label={recording ? "Stop and send" : "Speak"}
                className={
                  "absolute bottom-2.5 right-[5.5rem] flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:opacity-40 " +
                  (recording
                    ? "animate-pulse border-rose-400/50 bg-rose-500/20 text-rose-300"
                    : "border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12]")
                }
              >
                {recording ? (
                  <span className="h-3 w-3 rounded-[3px] bg-rose-300" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 0 1-14 0" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3M8 21h8" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || busy}
                className="absolute bottom-2.5 right-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40"
              >
                Send
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          </footer>
        </div>

        {/* ── latency panel ───────────────────────────────────────────── */}
        <aside className="hidden min-h-0 flex-col lg:flex">
          <LatencyPanel timings={timings} provider={provider || "—"} />
        </aside>
      </div>
    </main>
  );
}

function Bubble({ role, text, live }: { role: "assistant" | "user"; text: string; live?: boolean }) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[11px] font-semibold text-white">
          AI
        </div>
      )}
      <div
        className={
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
          (isUser
            ? "rounded-br-md bg-gradient-to-br from-violet-500 to-cyan-500 text-white"
            : "rounded-bl-md border border-white/10 bg-white/[0.04] text-zinc-100")
        }
      >
        {text}
        {live && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-violet-300 align-middle" />}
      </div>
    </div>
  );
}

/**
 * The latency budget, live. This is the point of the whole rebuild: "it feels fast" is not an
 * engineering claim, so every stage boundary is timestamped and shown. The gap between
 * "first audio" and "LLM finished" is the win — whenever first audio lands EARLIER, the user was
 * already hearing the answer while the model was still writing it.
 */
function LatencyPanel({ timings, provider }: { timings: TurnTimings | null; provider: string }) {
  const rows: { label: string; value?: number; hint: string }[] = [
    { label: "STT", value: timings?.sttMs, hint: "speech → text" },
    { label: "LLM first token", value: timings?.llmFirstTokenMs, hint: "TTFT" },
    { label: "First sentence", value: timings?.firstSentenceMs, hint: "chunker cut" },
    { label: "First audio", value: timings?.firstAudioMs, hint: "TTFA (server)" },
    { label: "LLM finished", value: timings?.llmDoneMs, hint: "full reply written" },
    { label: "Turn total", value: timings?.totalMs, hint: "all audio sent" },
  ];

  const overlap =
    timings?.llmDoneMs !== undefined && timings?.firstAudioMs !== undefined
      ? timings.llmDoneMs - timings.firstAudioMs
      : undefined;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Latency budget</h2>

      <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">Perceived</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
          {timings?.perceivedMs !== undefined ? `${timings.perceivedMs}` : "—"}
          <span className="ml-1 text-base font-normal text-zinc-400">ms</span>
        </p>
        <p className="mt-1 text-[11px] leading-snug text-zinc-400">
          mic release → first audible word
        </p>
      </div>

      <dl className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <dt className="truncate text-xs text-zinc-300">{r.label}</dt>
              <dd className="font-mono text-[10px] text-zinc-600">{r.hint}</dd>
            </div>
            <span className="shrink-0 font-mono text-sm tabular-nums text-zinc-200">
              {r.value !== undefined ? `${r.value}ms` : "—"}
            </span>
          </div>
        ))}
      </dl>

      {overlap !== undefined && overlap > 0 && (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
            Pipelining win
          </p>
          <p className="mt-1 text-sm text-zinc-200">
            Audio started <span className="font-mono font-semibold text-emerald-300">{overlap}ms</span> before
            the model finished writing.
          </p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-400">
            Sequentially, the user would have waited for the full reply plus all synthesis.
          </p>
        </div>
      )}

      <p className="mt-auto pt-4 font-mono text-[10px] text-zinc-600">provider: {provider}</p>
    </div>
  );
}
