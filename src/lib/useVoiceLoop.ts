"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioCapture } from "@/lib/audioCapture";

/**
 * Hands-free turn-taking. The mic stays open; VAD decides when you started and stopped talking.
 *
 * This replaces push-to-talk, which could never support barge-in: a click-to-record mic is CLOSED
 * while the agent is speaking, so speaking over it is physically unheard. The only "interrupt" a
 * push-to-talk UI can offer is a stop button, which is not the same thing.
 *
 * The state machine:
 *   silence ──(loud for N frames)──▶ speech ──(quiet for HANG_MS)──▶ emit utterance ──▶ silence
 *
 * Speech onset fires `onSpeechStart` immediately, before the utterance ends — that's the barge-in
 * signal, and it has to be immediate or interrupting feels broken.
 *
 * ECHO IS THE HARD PART. On laptop speakers the mic hears the agent's own voice, and a naive VAD
 * treats that as the user barging in — the agent interrupts itself in a loop. Three defenses:
 *   1. Browser AEC (in audioCapture) removes most of it.
 *   2. The onset threshold is raised while the agent is speaking.
 *   3. Onset requires more consecutive loud frames while the agent speaks, so a transient can't
 *      trip it — only sustained speech can.
 * Headphones make all of this moot, which is why real voice agents recommend them.
 */

/** ~21ms per frame at 48kHz, so these counts are in frames, not milliseconds. */
const ONSET_FRAMES = 4; // ~85ms of sustained sound to call it speech
const ONSET_FRAMES_WHILE_SPEAKING = 9; // ~190ms — echo guard: harder to trigger a barge-in
const HANG_MS = 700; // silence before the utterance is considered finished
const PREROLL_MS = 300; // audio kept from BEFORE onset, so the first word isn't clipped
const MIN_UTTERANCE_MS = 350; // shorter than this is a cough, a click, or a door
const CALIBRATION_MS = 700; // ambient noise measurement at startup

export type VoiceLoopState = "off" | "calibrating" | "listening" | "speaking";

export function useVoiceLoop(opts: {
  /** A complete utterance, as a WAV blob. */
  onUtterance: (wav: Blob) => void;
  /** Fires the instant speech is detected — use this to barge in. */
  onSpeechStart?: () => void;
  /** Whether the agent is currently talking, so the echo guard can tighten. */
  isAgentSpeaking?: () => boolean;
}) {
  const [state, setState] = useState<VoiceLoopState>("off");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const captureRef = useRef<AudioCapture | null>(null);
  const rafRef = useRef<number | null>(null);
  // Handlers live in a ref so the polling loop never restarts when the page re-renders.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    captureRef.current?.stop();
    captureRef.current = null;
    setState("off");
    setLevel(0);
  }, []);

  const start = useCallback(
    async (ctx: AudioContext) => {
      if (captureRef.current) return;
      setError(null);

      const capture = new AudioCapture(ctx);
      try {
        await capture.start();
      } catch {
        setError("Microphone permission denied — allow mic access and reload.");
        return;
      }
      captureRef.current = capture;
      setState("calibrating");

      const startedAt = performance.now();
      let noiseFloor = 0.01;
      const samples: number[] = [];

      let loudFrames = 0;
      let quietSince = 0;
      let speaking = false;
      let utteranceStart = 0;

      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        const cap = captureRef.current;
        if (!cap) return;

        const now = performance.now();
        const rms = cap.level;
        setLevel(rms);

        // ── Calibrate against this room, not a hardcoded constant ──────────────
        if (now - startedAt < CALIBRATION_MS) {
          samples.push(rms);
          return;
        }
        if (samples.length) {
          const sorted = [...samples].sort((a, b) => a - b);
          // p95 rather than mean, so a single cough during calibration can't set the floor high.
          noiseFloor = Math.max(sorted[Math.floor(sorted.length * 0.95)] ?? 0.01, 0.004);
          samples.length = 0;
          setState("listening");
        }

        const agentTalking = optsRef.current.isAgentSpeaking?.() ?? false;
        const onThreshold = Math.max(noiseFloor * (agentTalking ? 6 : 3), agentTalking ? 0.035 : 0.014);
        const offThreshold = onThreshold * 0.55;
        const needed = agentTalking ? ONSET_FRAMES_WHILE_SPEAKING : ONSET_FRAMES;

        if (!speaking) {
          if (rms > onThreshold) {
            loudFrames++;
            if (loudFrames >= needed) {
              speaking = true;
              quietSince = 0;
              // Back-date the start so the pre-roll covers the onset we only just detected.
              utteranceStart = Math.max(
                0,
                cap.position - Math.floor((PREROLL_MS / 1000) * cap.sampleRate),
              );
              setState("speaking");
              optsRef.current.onSpeechStart?.();
            }
          } else {
            loudFrames = 0;
          }
          return;
        }

        // ── Currently speaking: wait for a sustained gap ───────────────────────
        if (rms > offThreshold) {
          quietSince = 0;
          return;
        }
        if (quietSince === 0) {
          quietSince = now;
          return;
        }
        if (now - quietSince < HANG_MS) return;

        // Utterance finished.
        speaking = false;
        loudFrames = 0;
        quietSince = 0;
        setState("listening");

        const end = cap.position;
        const durationMs = ((end - utteranceStart) / cap.sampleRate) * 1000;
        if (durationMs < MIN_UTTERANCE_MS + PREROLL_MS) return; // too short to be speech

        const wav = cap.sliceToWav(utteranceStart, end);
        if (wav) optsRef.current.onUtterance(wav);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  useEffect(() => stop, [stop]);

  return { state, level, error, start, stop, active: state !== "off" };
}
