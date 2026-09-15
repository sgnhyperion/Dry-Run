"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { AudioQueue } from "@/lib/audioQueue";
import { useVoiceLoop } from "@/lib/useVoiceLoop";
import { runTurn, type TurnTimings, type Analysis, type RecalledMemory } from "@/lib/turnClient";

const AvatarViewer = dynamic(() => import("@/components/AvatarViewer"), { ssr: false });

type Msg = { role: "assistant" | "user"; content: string };

export default function InterviewPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey — I'm your interviewer. Tell me a bit about what you work on." },
  ]);
  const [streaming, setStreaming] = useState("");
  const [message, setMessage] = useState("");
  const [timings, setTimings] = useState<TurnTimings | null>(null);
  const [provider, setProvider] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [recalled, setRecalled] = useState<RecalledMemory[]>([]);
  const [reflections, setReflections] = useState<string[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<AudioQueue | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const directiveRef = useRef<string | null>(null);
  // Memory is scoped to this id. Stored in localStorage so "it remembers you" actually
  // survives a reload — which is the entire point of the feature and the whole demo.
  const userIdRef = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // The VAD loop runs outside React's render cycle, so it can't read state — it reads these.
  const speakingRef = useRef(false);
  const thinkingRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const setSpeakingBoth = (v: boolean) => {
    speakingRef.current = v;
    setSpeaking(v);
  };
  const setThinkingBoth = (v: boolean) => {
    thinkingRef.current = v;
    setThinking(v);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Warm the models on mount so a cold reload lands here, not on the first thing you say.
  useEffect(() => {
    let id = localStorage.getItem("dryrun_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("dryrun_user_id", id);
    }
    userIdRef.current = id;
    fetch("/api/warmup", { method: "POST" }).catch(() => {});
  }, []);

  const audio = () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      queueRef.current = new AudioQueue(ctxRef.current, () => setSpeakingBoth(false));
    }
    return queueRef.current!;
  };

  /** Stop the agent mid-sentence: kill queued audio and abort the server stream. */
  const interrupt = useCallback(() => {
    queueRef.current?.stop();
    abortRef.current?.abort();
    abortRef.current = null;
    setSpeakingBoth(false);
    setThinkingBoth(false);
  }, []);

  const takeTurn = useCallback(async (userText: string, spokeAt?: number, sttMs?: number) => {
    const queue = audio();
    const history: Msg[] = [...messagesRef.current, { role: "user", content: userText }];

    setMessages(history);
    setStreaming("");
    setThinkingBoth(true);
    setError(null);

    const t: TurnTimings = { sttMs };
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runTurn(
        history,
        {
          onStart: (p) => setProvider(p),
          onToken: (tok) => setStreaming((prev) => prev + tok),
          onTiming: (key, ms) => {
            Object.assign(t, { [key]: ms });
            setTimings({ ...t });
          },
          onAudio: async (_i, wav) => {
            if (t.perceivedMs === undefined && spokeAt !== undefined) {
              t.perceivedMs = Math.round(performance.now() - spokeAt);
            }
            setSpeakingBoth(true);
            setThinkingBoth(false);
            await queue.enqueue(wav);
          },
          onAnalysis: (a, directive) => {
            setAnalysis(a);
            directiveRef.current = directive;
          },
          onMemory: (mems) => setRecalled(mems),
          onDone: (reply, serverTimings) => {
            Object.assign(t, serverTimings);
            setTimings({ ...t });
            setStreaming("");
            if (reply.trim()) {
              setMessages((prev) => [...prev, { role: "assistant", content: reply.trim() }]);
            }
          },
          onError: (m) => setError(m),
        },
        controller.signal,
        directiveRef.current,
        userIdRef.current,
      );
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Turn failed");
      }
    } finally {
      setThinkingBoth(false);
      abortRef.current = null;

      // Reflection runs HERE — after the turn is done and the agent is talking or the
      // candidate is thinking. Deliberately not awaited and deliberately not inside
      // /api/turn: it is 1 + N LLM calls, and this is the only point in the loop where
      // that is free. Most calls return immediately without inferring anything, because
      // the trigger is a summed-importance threshold on the server (see lib/reflection.ts).
      const uid = userIdRef.current;
      if (uid) {
        fetch("/api/reflect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid }),
        })
          .then((r) => r.json())
          .then((r: { reflected?: boolean; insights?: { text: string }[] }) => {
            if (r.reflected && r.insights?.length) {
              setReflections((prev) => [...r.insights!.map((i) => i.text), ...prev].slice(0, 6));
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // ── the hands-free loop ────────────────────────────────────────────────────
  const voice = useVoiceLoop({
    // Fires the instant speech is detected, before the utterance finishes. This IS barge-in:
    // if the agent is mid-sentence when you start talking, it stops immediately rather than
    // talking over you for another two seconds.
    onSpeechStart: () => {
      if (speakingRef.current || thinkingRef.current) interrupt();
    },
    onUtterance: async (wav) => {
      const spokeAt = performance.now();
      setTranscribing(true);
      let transcript = "";
      let sttMs: number | undefined;
      try {
        const t0 = performance.now();
        const res = await fetch("/api/stt", {
          method: "POST",
          headers: { "Content-Type": "audio/wav" },
          body: wav,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Transcription failed (${res.status})`);
        sttMs = Math.round(performance.now() - t0);
        transcript = (data.text ?? "").trim();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transcription failed.");
      } finally {
        setTranscribing(false);
      }
      // Whisper emits filler like "Thank you." for noise; ignore anything too trivial to be a turn.
      if (transcript.length > 1) await takeTurn(transcript, spokeAt, sttMs);
    },
    isAgentSpeaking: () => speakingRef.current,
  });

  const toggleConversation = async () => {
    if (voice.active) {
      voice.stop();
      interrupt();
      return;
    }
    // Both the AudioContext and getUserMedia need a user gesture — this click is it.
    audio();
    await ctxRef.current?.resume();
    await voice.start(ctxRef.current!);
  };

  const handleSend = () => {
    const text = message.trim();
    if (!text || thinking || transcribing) return;
    if (speaking) interrupt();
    setMessage("");
    void takeTurn(text);
  };

  const status =
    voice.state === "speaking"
      ? { label: "You're talking", dot: "animate-pulse bg-rose-400" }
      : transcribing
      ? { label: "Transcribing", dot: "animate-pulse bg-sky-400" }
      : speaking
      ? { label: "Speaking", dot: "bg-violet-400" }
      : thinking
      ? { label: "Thinking", dot: "animate-pulse bg-amber-400" }
      : voice.state === "calibrating"
      ? { label: "Calibrating", dot: "animate-pulse bg-zinc-400" }
      : voice.active
      ? { label: "Listening", dot: "bg-emerald-400" }
      : { label: "Mic off", dot: "bg-zinc-600" };

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-[#0B0E14] text-zinc-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-72 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto grid h-full w-full max-w-6xl grid-cols-1 gap-5 px-5 py-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-h-0 flex-col">
          <header className="mb-4 flex shrink-0 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Dry Run</h1>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Full-duplex voice interviewer
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

            {!voice.active && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                <button
                  onClick={toggleConversation}
                  className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:brightness-110"
                >
                  Start conversation
                </button>
              </div>
            )}

            {voice.active && (
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-3">
                {/* Live input meter — fastest way to tell "it can't hear me" from "it's thinking". */}
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={
                      "h-full rounded-full transition-[width] duration-75 " +
                      (voice.state === "speaking" ? "bg-rose-400" : "bg-emerald-400/70")
                    }
                    style={{ width: `${Math.min(100, voice.level * 600)}%` }}
                  />
                </div>
                <button
                  onClick={toggleConversation}
                  className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[11px] text-zinc-200 backdrop-blur-md transition hover:bg-black/70"
                >
                  Stop mic
                </button>
              </div>
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
                placeholder={voice.active ? "Just talk — or type here" : "Type, or start the conversation above"}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-24 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || thinking || transcribing}
                className="absolute bottom-2.5 right-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40"
              >
                Send
              </button>
            </div>
            {error ? (
              <p className="mt-2 text-xs text-rose-400">{error}</p>
            ) : voice.error ? (
              <p className="mt-2 text-xs text-rose-400">{voice.error}</p>
            ) : (
              <p className="mt-2 text-xs text-zinc-600">
                Mic stays open — just start talking to interrupt. Headphones recommended.
              </p>
            )}
          </footer>
        </div>

        <aside className="hidden min-h-0 flex-col lg:flex">
          <LatencyPanel
            timings={timings}
            provider={provider || "—"}
            analysis={analysis}
            recalled={recalled}
            reflections={reflections}
          />
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

function LatencyPanel({
  timings,
  provider,
  analysis,
  recalled,
  reflections,
}: {
  timings: TurnTimings | null;
  provider: string;
  analysis: Analysis | null;
  recalled: RecalledMemory[];
  reflections: string[];
}) {
  const rows = [
    { label: "STT", value: timings?.sttMs, hint: "speech → text" },
    { label: "Memory recall", value: timings?.memoryMs, hint: "hybrid + rerank" },
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
    <div className="flex h-full flex-col overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Latency budget</h2>

      <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">Perceived</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
          {timings?.perceivedMs !== undefined ? timings.perceivedMs : "—"}
          <span className="ml-1 text-base font-normal text-zinc-400">ms</span>
        </p>
        <p className="mt-1 text-[11px] leading-snug text-zinc-400">you stop talking → first word back</p>
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
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">Pipelining win</p>
          <p className="mt-1 text-sm text-zinc-200">
            Audio started <span className="font-mono font-semibold text-emerald-300">{overlap}ms</span> before
            the model finished writing.
          </p>
        </div>
      )}

      {recalled.length > 0 && (
        <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">
            Recalled ({recalled.length})
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {recalled.map((m, i) => (
              <li key={i} className="text-[11px] leading-snug text-zinc-300">
                <span className="font-mono text-cyan-400/70">{m.score.toFixed(2)}</span> {m.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reflections.length > 0 && (
        <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">
            Reflections ({reflections.length})
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {reflections.map((text, i) => (
              <li key={i} className="text-[11px] leading-snug text-zinc-300">
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Analyst</p>
            <span className="font-mono text-lg font-semibold tabular-nums text-white">
              {analysis.score}
              <span className="text-xs font-normal text-zinc-500">/10</span>
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-emerald-300">+ {analysis.strength}</p>
          <p className="text-[11px] text-amber-300">− {analysis.gap}</p>
          <p className="mt-2 font-mono text-[10px] text-zinc-500">
            next turn → {analysis.nextMove.replace("_", " ")}
          </p>
        </div>
      )}

      <p className="mt-auto pt-4 font-mono text-[10px] text-zinc-600">provider: {provider}</p>
    </div>
  );
}
