# Dry Run — Progress Tracker

> Single source of truth for **where we are**. Each phase has its own doc in `docs/phase-N.md`.
> Master design/architecture lives in `/DRY_RUN.md`.
> Tool/model choices (with rationale + eval stats) live in `docs/decisions.md` (ADR-style decision log).
> *(Rebuilt 2026-09-04 after the original was lost to the `/docs/*` gitignore rule — aggregates intact,
> per-sentence eval rows regenerable via `scripts/eval-tts.mjs`. `docs/` is now tracked.)*
>
> **Convention:** starting a phase → create `docs/phase-N.md`; finishing a phase → update that doc into a
> completed record and flip its status here.

## ⚠️ IMPORTANT — Working mode (as of 2026-09-10): BUILD MODE — Claude implements, Harsh reviews
**Claude writes the code. Harsh reviews and directs.**
- Ship working code; explain it at review time rather than before.
- Fewer clarifying questions — make the routine call, state the assumption, keep moving.
- Cut teaching prose. Harsh reads the diff, not a lecture.
- Docs + decision-log upkeep remain Claude's.
- Rationale: Phases 2–5 hold the resume value; build speed is now the bottleneck, not learning rate.
- *(Supersedes MENTOR mode, 2026-08-06 → 2026-09-10, under which Harsh wrote all implementation code.)*

## Status legend
🔵 in progress · ✅ done · ⚪ not started · ⏸️ paused

## Phases

| Phase | Status | Doc | One-line summary |
|------:|:------:|-----|------------------|
| 0 — Make it run | ✅ | [phase-0.md](phase-0.md) | Gut legacy MimiChat stack → clean, building Next.js skeleton on Mac |
| 1 — Talking spine | ✅ | [phase-1.md](phase-1.md) | VRM avatar + lip-sync + STT→LLM→TTS — **full voice loop closed** |
| 2 — Memory | ⚪ | — | Generative Agents memory (observation→retrieval→reflection→planning) over pgvector |
| 3 — Coding substrate + judge | ⚪ | — | Code editor + run tests + **trained judge/reward model** + debrief |
| 4 — Affect (SER) | ⚪ | — | **Trained speech-emotion model** → composure meter → reward signal |
| 5 — Self-improvement + evals | ⚪ | — | Reflexion loop + eval harness + A/B research result (graphs) |
| 6 — Polish + deploy | 🔵 | — | ✅ **streaming + pipelining + barge-in done early** (see #7) · Dockerize · deploy · write-up |

## Current focus
**▶ PIVOT (2026-09-14) — streaming voice + multi-agent orchestration, pulled forward from Phase 6.**
Triggered by ShortLoop (voice AI platform) reaching out about their founding team. Their stack is
*real-time multi-agent orchestration, streaming voice, context engineering, latency* — so **#6 had deferred
exactly the wrong thing.** Streaming/barge-in went to Phase 6 as "lowest resume value"; for this target it's
the whole product. Pulled forward. Full reasoning + measurements → `decisions.md` **#7**.

**Shipped (branch `streaming-voice-pipeline`, 5 commits):**
- **Pipelined turn** — tokens stream, a chunker cuts speakable sentences, TTS starts on each while the
  model keeps writing. Audio emitted strictly in order. **Mean TTFA speedup 3.13×** (3.97× / 3.76× / 1.67×),
  total turn time did not regress. A/B'd through identical code via a `mode` flag (`scripts/bench-latency.mjs`).
- **Stateless provider-agnostic brain** — dropped Gemini's `previous_interaction_id` for a caller-owned
  transcript; three adapters (openai · gemini · ollama) behind one streaming seam. **This is #5's deferred
  refactor, now done** — and it's the precondition for Phase 2 memory *and* their "context engineering".
- **Multi-agent** — interviewer on the critical path, analyst off it; the analyst's verdict compiles into a
  directive that steers the next turn. Split by **latency class**, not by topic.
- **Barge-in** — stops scheduled-but-unstarted audio and aborts the server mid-generation.
- **Live latency panel** — per-stage budget in the UI, because "it feels faster" isn't an engineering claim.

**🔑 The finding worth keeping:** *"not awaited" is not the same as "free."* Running the analyst concurrently
on shared local compute pushed TTFA 1463 → 4307 ms; "fixing" it with a smaller model triggered an Ollama
evict-and-reload that stalled one turn **56 seconds**. Scheduling is now deployment-aware — concurrent on
hosted infra, deferred on a single local instance.

**⚠️ Two things NOT verified:**
1. **OpenAI is wired but never ran** — the key in the environment is rejected (`sk-svcac…`, service-account).
   Every number above is Ollama. **Needs a working key in `.env.local`.**
2. **The client has never run in a browser.** It typechecks and builds and the server pipeline is verified
   end to end by curl, but the Chrome extension was unavailable to drive a real page. **Click through
   `/interview` before demoing.**

**Provider decision (2026-09-14): stay on Ollama + Kokoro, buy nothing.** Priced the alternative —
Anthropic at ~$0.0014/turn (Haiku 4.5 interactive + Sonnet 5 background) is ~3,600 turns for $5 — but the
local stack is $0, quota-free, and measurably fast enough. The **Gemini free tier is disqualified**: the
429 body gives the hard number, **5 requests/minute**, and this architecture makes 2 calls per turn, so it
caps at ~2.5 turns/min. An Anthropic adapter is written and typechecks but has **never executed** (no key).

**Demo stability work.** The one real risk of going local was the cold-model stall (36.5 s measured from
cold; 56 s when a swap was involved). `/api/warmup` now fires on page mount so that cost lands during page
load, and `keep_alive` holds the model for 30 min. Verified warm across 6 consecutive turns:
first-audio **1031–2189 ms**, no stalls.

**▶ PHASE 2 IN PROGRESS — memory stream BUILT, unevaluated (2026-09-14).** The interviewer now writes
observations and recalls them across sessions. Hybrid retrieval (custom BM25 + FAISS dense → RRF →
cross-encoder rerank) scored by relevance + recency-decay + LLM-rated importance, wired into `/api/turn`
(~15ms warm, on the critical path, measured). The corpus is **self-generating** — the analyst emits the
observations. Full reasoning + the four bugs found → `decisions.md` **#8**.

**▶ NEXT, in order:** (1) **reflection** — it fixes a *measured* retrieval failure, and it changes what's
in the corpus, so evaluating before it means evaluating twice; (2) the **in-domain retrieval eval**, which
replaces every guessed threshold with a measured one; (3) streaming STT (the last big latency win, and what
would make "full-duplex" true).

**Owed:** human-speech WER eval for STT (#6); retrieval eval (#8) — every threshold there is currently a
guess set by reading score distributions across five memories.

## Key locked decisions (see `/DRY_RUN.md` for full rationale)
- Product: **Dry Run** — affective, self-improving AI technical interviewer (voice + 3D avatar).
- Papers: Generative Agents (memory) + Reflexion (self-improvement) + SER (affect) + reward modeling + hybrid IR.
- Stack: Next.js + three.js/**VRM** (`@pixiv/three-vrm`; RPM shut down 2026-01-31) + **Claude** (Opus 4.8 / Sonnet 4.6) + **Supabase** (Postgres+pgvector) +
  **Pipecat/LiveKit** (real-time voice) + Python FastAPI (SER + judge + embeddings) + Piston (code exec).
- Non-goal: NOT a general assistant / Jarvis (kills measurability). Cross-device assistant = separate future project.
- Working mode: **BUILD MODE** — Claude implements, Harsh reviews (see the IMPORTANT block at top; superseded MENTOR mode on 2026-09-10).
