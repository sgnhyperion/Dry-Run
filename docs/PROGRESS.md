# Dry Run — Progress Tracker

> Single source of truth for **where we are**. Each phase has its own doc in `docs/phase-N.md`.
> Master design/architecture lives in `/DRY_RUN.md`.
> Tool/model choices (with rationale + eval stats) live in `docs/decisions.md` (ADR-style decision log).
> *(Rebuilt 2026-09-04 after the original was lost to the `/docs/*` gitignore rule — aggregates intact,
> per-sentence eval rows regenerable via `scripts/eval-tts.mjs`. `docs/` is now tracked.)*
>
> **Convention:** starting a phase → create `docs/phase-N.md`; finishing a phase → update that doc into a
> completed record and flip its status here.

## ⚠️ IMPORTANT — Working mode (as of 2026-08-06): MENTOR, not intern
**Harsh writes all the code from here on. Claude's role is to GUIDE, not build.**
- Do **not** write/scaffold implementation code for him, and don't make the edits yourself.
- Instead: explain concepts, give the mental model + approach, point to the right APIs/files/papers,
  review his code, debug alongside him, and unblock — like a senior mentor pairing with an engineer.
- Exceptions only if Harsh explicitly asks Claude to write a specific piece.
- Rationale: maximize his hands-on learning in AI/ML/agents (the whole point of the project).

## Status legend
🔵 in progress · ✅ done · ⚪ not started · ⏸️ paused

## Phases

| Phase | Status | Doc | One-line summary |
|------:|:------:|-----|------------------|
| 0 — Make it run | ✅ | [phase-0.md](phase-0.md) | Gut legacy MimiChat stack → clean, building Next.js skeleton on Mac |
| 1 — Talking spine | 🔵 | [phase-1.md](phase-1.md) | GLB avatar + lip-sync + STT→Claude→TTS (voice→avatar loop) |
| 2 — Memory | ⚪ | — | Generative Agents memory (observation→retrieval→reflection→planning) over pgvector |
| 3 — Coding substrate + judge | ⚪ | — | Code editor + run tests + **trained judge/reward model** + debrief |
| 4 — Affect (SER) | ⚪ | — | **Trained speech-emotion model** → composure meter → reward signal |
| 5 — Self-improvement + evals | ⚪ | — | Reflexion loop + eval harness + A/B research result (graphs) |
| 6 — Polish + deploy | ⚪ | — | Full-duplex/barge-in polish · Dockerize · deploy (GCP/AWS free tier) · write-up |

## Current focus
**Phase 1, Milestone 1.3 — the brain. ✅ COMPLETE (2026-08-13).** Full text interviewer working: `POST /api/interview`
→ LLM behind an `askBrain()` seam → interviewer persona (`system_instruction`) → multi-turn memory (Gemini
`previous_interaction_id`) → a browser chat UI + **full-transcript history** at `/interview` (browser holds the `id`).
(1.1 ✅ VRM avatar · 1.2 ✅ mic lip-sync at `/studio`.) On the **Gemini free tier** for now (no Anthropic credits);
Claude swaps in via the seam later. **▶ Milestone 1.4 (voice out / TTS) — IN PROGRESS.** ✅ Stage A (browser
`SpeechSynthesis`) done. ✅ Gemini TTS wired behind a `textToSpeech()` seam (`/api/tts`) + a robust eval harness
(`scripts/eval-tts.mjs`, throttle + success-rate). **Gemini free-tier TTS ELIMINATED** (429, low RPM + slow RTF 1.5–4.3).
**✅ Kokoro-82M ADOPTED (2026-08-17)** — self-hosted Python FastAPI server (`tts-server/server.py`: `KPipeline` loaded
once at boot, `af_heart` voice, chunks stitched via `np.concatenate`, in-memory WAV), swapped behind the same
`textToSpeech()` seam (one-file change). Benchmark: **RTF 0.08–0.12, sub-second synth, 27/27 calls, $0** (vs Gemini RTF
1.5–4.3 + 429s); MOS ~3.5. Fixed the `window is not defined` SSR crash (AudioContext created lazily in `handleSend`).
✅ **Avatar bridge DONE (2026-08-17) — talking spine closed:** shared audio bus (`src/lib/lipsync.ts`), avatar mounted on
`/interview` (`dynamic`, `ssr:false`), TTS spliced through an inline `AnalyserNode` (`source → analyser → destination`)
driving the 1.2 `aa` viseme → avatar lip-syncs the interviewer's voice. Full loop: type → Gemini brain → Kokoro TTS →
sound + synced mouth. **▶ NEXT — Milestone 1.5 (voice IN / STT):** candidate *speaks* → transcribe (local Whisper) →
feed the brain, closing the full voice loop. See `docs/decisions.md` entry 3 + `phase-1.md`. Streaming + brain-latency
deferred (TTS is NOT the bottleneck — synth is sub-second; perceived lag is the LLM + no-overlap pipeline). NOTE: `/interview`
UI was built by a *separate* AI agent — Harsh owns the logic, not the UI. Harsh writes the code (mentor/co-pilot). PM = **pnpm**.
See [phase-1.md](phase-1.md) for gotchas (`reactStrictMode: false`, three pinned `0.180.0`, RPM→VRM).

**⛔ BLOCKED (2026-09-03) — the brain is down.** `POST /api/interview` → **HTTP 403 `permission_denied`**
("Your project has been denied access"). curl bisect proved it is **provider-side, not code**: `GET /v1beta/models`
returns **200** (key valid, env loads, `gemini-3.6-flash` present) while **every** model 403s at inference, and
`gemini-2.5-flash` is 404 "no longer available to new users" — boxed in from both sides. Leading hypothesis: the key
was minted under the **Workspace-managed** `@scalerailabs.com` account, where org policy blocks generative APIs.
**Next action: mint a key from a personal Gmail and re-run the curl.** Full evidence table → `decisions.md` entry 4.

**⏸️ Ollama brain switch — deferred to Phase 2 (decided 2026-09-04).** Ollama is installed and ready
(`qwen2.5:14b` on M5 Pro / 24 GB) as a $0 offline fallback, but making the brain switchable **requires** dropping
Gemini's server-side `previous_interaction_id` for a caller-owned transcript (`askBrain(messages) → {text}`) — which
*is* Phase 2's memory foundation. Building it twice is wasted work, so the provider switch lands as a side effect of
memory. Design of record + Ollama API gotchas → `decisions.md` entry 5.

## Key locked decisions (see `/DRY_RUN.md` for full rationale)
- Product: **Dry Run** — affective, self-improving AI technical interviewer (voice + 3D avatar).
- Papers: Generative Agents (memory) + Reflexion (self-improvement) + SER (affect) + reward modeling + hybrid IR.
- Stack: Next.js + three.js/**VRM** (`@pixiv/three-vrm`; RPM shut down 2026-01-31) + **Claude** (Opus 4.8 / Sonnet 4.6) + **Supabase** (Postgres+pgvector) +
  **Pipecat/LiveKit** (real-time voice) + Python FastAPI (SER + judge + embeddings) + Piston (code exec).
- Non-goal: NOT a general assistant / Jarvis (kills measurability). Cross-device assistant = separate future project.
- Working mode: **MENTOR, not intern** — Harsh writes the code, Claude guides only (see the IMPORTANT block at top).
