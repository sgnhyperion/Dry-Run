# Phase 1 — The talking spine (voice → Claude → avatar)

**Status:** 🔵 In progress · **Started:** 2026-08-05

## Goal
Close the core loop: **you speak → Claude (as an interviewer) responds → a 3D avatar speaks it back with
lip-sync.** This is the demo-able spine everything else (memory, judge, affect, RL) builds on.

## Milestones
Built incrementally so each step is visible and understood (teach + pair mode).

- [ ] **1.1 — Avatar on screen.** Render a Ready Player Me GLB in three.js via `@react-three/fiber` +
  `@react-three/drei`. *No credentials needed.*
  - Learn: GLB format, morph targets/blendshapes, react-three-fiber scene graph, camera/lighting.
- [ ] **1.2 — Lip-sync.** Drive the avatar's viseme morph targets from audio in the browser.
  - Learn: visemes vs phonemes, ARKit/Oculus blendshape sets, real-time audio → mouth-shape mapping.
- [ ] **1.3 — The brain.** Text → Claude (interviewer persona) → text, via `@anthropic-ai/sdk` in a Next route.
  - Learn: Messages API, system prompts, streaming, adaptive thinking/effort, model tiering.
- [ ] **1.4 — Voice out (TTS).** Claude's reply → speech → feeds 1.2's lip-sync.
  - Learn: TTS provider (Google Cloud TTS vs Kokoro), audio streaming to the browser.
- [ ] **1.5 — Real-time loop.** Wire **Pipecat/LiveKit** for streaming voice-in + barge-in; close the circle.
  - Learn: real-time voice agents, VAD, turn-taking/interruption, WebRTC/websocket transport.

## Prerequisites / credentials (grab in parallel, only when the milestone needs them)
- **Anthropic API key** (for 1.3) — console.anthropic.com → API keys → create. Needed before the brain step.
- **Ready Player Me avatar** (for 1.1) — create at readyplayer.me, export the `.glb` URL. Needed to start.
- Google Cloud TTS **or** Kokoro (1.4), streaming STT provider (1.5) — deferred to those milestones.

## Current step
**1.1** — awaiting an RPM avatar `.glb` URL from Harsh, then we scaffold the r3f canvas + load it together.

## Decisions / notes (fill in as we build)
- _(record avatar choice, lip-sync lib, TTS provider, Pipecat-vs-LiveKit, and any gotchas here as we go)_
