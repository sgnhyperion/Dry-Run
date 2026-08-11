# Dry Run — Progress Tracker

> Single source of truth for **where we are**. Each phase has its own doc in `docs/phase-N.md`.
> Master design/architecture lives in `/DRY_RUN.md`.
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
**Phase 1, Milestone 1.3 — the brain. ✅ Text interviewer working (2026-08-12):** `POST /api/interview` runs a
coherent multi-turn interview — persona via `system_instruction`, dynamic input, and memory via Gemini's
`previous_interaction_id` (caller chains the returned `id`). All model calls sit behind an `askBrain()` seam.
(1.1 ✅ VRM avatar · 1.2 ✅ mic lip-sync at `/studio`.) On the **Gemini free tier** for now (no Anthropic credits);
Claude swaps in via the seam later. **Next:** a minimal browser chat UI (the browser holds the `id` → "we own the
state") → then streaming → then 1.4 TTS / 1.5 real-time voice. Harsh writes the code (mentor/co-pilot). PM = **pnpm**.
See [phase-1.md](phase-1.md) for gotchas (`reactStrictMode: false`, three pinned `0.180.0`, RPM→VRM).

## Key locked decisions (see `/DRY_RUN.md` for full rationale)
- Product: **Dry Run** — affective, self-improving AI technical interviewer (voice + 3D avatar).
- Papers: Generative Agents (memory) + Reflexion (self-improvement) + SER (affect) + reward modeling + hybrid IR.
- Stack: Next.js + three.js/**VRM** (`@pixiv/three-vrm`; RPM shut down 2026-01-31) + **Claude** (Opus 4.8 / Sonnet 4.6) + **Supabase** (Postgres+pgvector) +
  **Pipecat/LiveKit** (real-time voice) + Python FastAPI (SER + judge + embeddings) + Piston (code exec).
- Non-goal: NOT a general assistant / Jarvis (kills measurability). Cross-device assistant = separate future project.
- Working mode: **MENTOR, not intern** — Harsh writes the code, Claude guides only (see the IMPORTANT block at top).
