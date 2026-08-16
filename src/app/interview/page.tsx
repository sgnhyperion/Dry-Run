"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { lipSync } from "@/lib/lipsync";

const AvatarViewer = dynamic(() => import("@/components/AvatarViewer"), { ssr: false });

type Msg = { role: "interviewer" | "user"; text: string };

export default function InterviewPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [previousId, setPreviousId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "interviewer", text: "Hello! Welcome to the technical interview. Let's get started." },
  ]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const canSend = !!message?.trim() && !loading;

  // keep the newest message in view
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!canSend) return;
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const answer = message!.trim();
    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: answer }]);
    setMessage(null);
    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: answer, previousId }),
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "interviewer", text: data.text }]);
      setPreviousId(data.id); // thread the next turn

      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.text }),
      });

      if (!ttsResponse.ok) throw new Error(`TTS request failed (${ttsResponse.status})`);
      const ttsBuffer = await ttsResponse.arrayBuffer();

      // 2. Decode the raw WAV ArrayBuffer into an AudioBuffer
      const audioBuffer = await audioCtx.current.decodeAudioData(ttsBuffer);
      
      // 3. Create a buffer source node
      const source = audioCtx.current.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = audioCtx.current.createAnalyser();
      analyser.fftSize = 2048;
      
      // 4. Connect the source to the browser speakers and play
      source.connect(analyser);
      analyser.connect(audioCtx.current.destination);

      lipSync.analyser = analyser;
      source.start(0);
      setSpeaking(true);
      source.onended = () => {
        lipSync.analyser = null;
        setSpeaking(false);
      };

      // const utterance = new SpeechSynthesisUtterance(data.text);
      // window.speechSynthesis.speak(utterance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main
      className="relative flex h-screen flex-col overflow-hidden bg-[#0B0E14] text-zinc-100"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      {/* ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-72 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col px-5 py-6">
        {/* header */}
        <header className="mb-4 flex shrink-0 items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dry Run</h1>
            <p
              className="mt-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Technical Interview
            </p>
          </div>
          {/* static waveform mark */}
          <div className="flex h-6 items-center gap-[3px]" aria-hidden>
            {[10, 18, 24, 14, 8].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400"
                style={{ height: h }}
              />
            ))}
          </div>
        </header>

        {/* avatar hero — pinned, does not scroll away with the transcript */}
        <div className="relative mb-4 h-60 shrink-0 overflow-hidden rounded-3xl border border-white/10 shadow-[0_10px_40px_-12px_rgba(139,92,246,0.45)] ring-1 ring-white/5">
          <AvatarViewer  showMic={false} />

          {/* status pill */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-md">
            <span
              className={
                "h-2 w-2 rounded-full " +
                (speaking
                  ? "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]"
                  : loading
                  ? "animate-pulse bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                  : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]")
              }
            />
            <span
              className="text-[10px] uppercase tracking-[0.2em] text-zinc-300"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {speaking ? "Speaking" : loading ? "Thinking" : "Ready"}
            </span>
          </div>

          {/* bottom scrim for depth (does not block orbit controls) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* chat transcript */}
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {loading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[11px] font-semibold text-white">
                AI
              </div>
              <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-end gap-[3px]" aria-label="Interviewer is thinking">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="voice-wave"
                      style={{ height: 18, animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        {/* composer */}
        <footer className="mt-4 shrink-0">
          <div className="relative">
            <textarea
              rows={2}
              value={message ?? ""}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer…"
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-24 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="absolute bottom-2.5 right-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>

          {error ? (
            <p className="mt-2 text-xs text-rose-400">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-zinc-600">
              Press <kbd className="text-zinc-400">Enter</kbd> to send ·{" "}
              <kbd className="text-zinc-400">Shift</kbd>+
              <kbd className="text-zinc-400">Enter</kbd> for a new line
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[11px] font-semibold text-white">
          AI
        </div>
      )}
      <div
        className={
          "max-w-[80%] whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed rounded-2xl " +
          (isUser
            ? "rounded-br-md bg-gradient-to-br from-violet-500 to-cyan-500 text-white"
            : "rounded-bl-md border border-white/10 bg-white/[0.04] text-zinc-100")
        }
      >
        {msg.text}
      </div>
    </div>
  );
}
