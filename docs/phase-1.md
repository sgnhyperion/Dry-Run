# Phase 1 — The talking spine (voice → Claude → avatar)

**Status:** 🔵 In progress · **Started:** 2026-08-05

## Goal
Close the core loop: **you speak → Claude (as an interviewer) responds → a 3D avatar speaks it back with
lip-sync.** This is the demo-able spine everything else (memory, judge, affect, RL) builds on.

## Milestones
Built incrementally so each step is visible and understood (teach + pair mode).

- [x] **1.1 — Avatar on screen.** ✅ VRM renders in three.js via `@react-three/fiber` +
  `@react-three/drei` + `@pixiv/three-vrm` (`src/components/AvatarViewer.tsx`, route `/studio`).
  - Learn: VRM format, morph targets/blendshapes, `VRMLoaderPlugin`, react-three-fiber scene graph,
    camera/lighting, the per-frame `vrm.update()` loop (spring bones, look-at, expressions).
- [ ] **1.2 — Lip-sync.** Drive the avatar's viseme expressions (`aa/ih/ou/ee/oh`) from audio in the browser.
  - Learn: visemes vs phonemes, VRM expression presets, real-time audio → mouth-shape mapping.
- [ ] **1.3 — The brain.** Text → Claude (interviewer persona) → text, via `@anthropic-ai/sdk` in a Next route.
  - Learn: Messages API, system prompts, streaming, adaptive thinking/effort, model tiering.
- [ ] **1.4 — Voice out (TTS).** Claude's reply → speech → feeds 1.2's lip-sync.
  - Learn: TTS provider (Google Cloud TTS vs Kokoro), audio streaming to the browser.
- [ ] **1.5 — Real-time loop.** Wire **Pipecat/LiveKit** for streaming voice-in + barge-in; close the circle.
  - Learn: real-time voice agents, VAD, turn-taking/interruption, WebRTC/websocket transport.

## Prerequisites / credentials (grab in parallel, only when the milestone needs them)
- **Anthropic API key** (for 1.3) — console.anthropic.com → API keys → create. Needed before the brain step.
- **Avatar** (for 1.1) — ✅ using a bundled sample `public/avatar.vrm`. Harsh makes a custom one in **VRoid Studio**
  (free, Mac) and we swap it over the same file. No credentials needed.
- Google Cloud TTS **or** Kokoro (1.4), streaming STT provider (1.5) — deferred to those milestones.

## Current step
**1.2 — lip-sync (in progress).** Mic → Web Audio `AnalyserNode` → per-frame loudness (avg of
`getByteFrequencyData` ÷ 255) → drives the `aa` viseme in `useFrame`. Mouth follows the mic. **Harsh is
building this himself** via the co-pilot method (see PROGRESS.md IMPORTANT block). Next: scale/clamp the loudness
(raw average opens the mouth only slightly), then later multi-viseme + drive from TTS audio (1.4) instead of mic.

## Decisions / notes (fill in as we build)
- **Avatar source pivot (2026-08-05):** Ready Player Me shut down Jan 31 2026 (Netflix acquisition) — CDN
  `models.readyplayer.me` is NXDOMAIN, creator gone. **Switched to VRM** (VRoid Studio to author, `@pixiv/three-vrm`
  to load). Bonus vs RPM: VRM ships standardized **emotion** presets (happy/angry/sad/relaxed/surprised) alongside
  visemes — Phase 4 affect display reuses them for free.
- **Sample model:** `public/avatar.vrm` = official VRM-spec **`Seed-san`** (VRM 1.0). (Briefly tried
  `VRM1_Constraint_Twist_Sample` first — a physics stress-test model — but swapped to the clean Seed-san character.)
  Verified it carries visemes `aa/ih/ou/ee/oh`, emotions, blinks, and gaze presets (18 expression presets).
- **Lip-sync approach (1.2):** amplitude-based — average all frequency bins of `getByteFrequencyData`, ÷255 →
  0–1, feed to the `aa` viseme every frame. Crude but works. Test source = **mic** (`getUserMedia`) via a
  "Start mic" button (browsers need a user gesture to start audio). Real driver = TTS audio in 1.4. Multi-viseme
  (`ih/ou/ee/oh` from frequency bands, or `wawa-lipsync`) is a later refinement.
- **Lib versions:** three **`0.180.0`** (pinned to match `@pixiv/three-vrm` 3.5.5's tested three), `@react-three/fiber`
  `9` (React-19 compatible), `@react-three/drei` `10`, `@pixiv/three-vrm` `3.5.5`.
- **🔥 The big 1.1 gotcha — `reactStrictMode: false` (set in `next.config.ts`).** Symptom: the avatar rendered
  for ~1s then Chrome tab crashed ("Aw, Snap" / `THREE.WebGLRenderer: Context Lost`). Spent a long bisect ruling
  out: RPM shutdown → VRM swap, three 0.185→0.180, MToon shaders, skinning, morph targets, textures, ANGLE
  backend (Metal vs GL vs SwiftShader), even browser engine — all red herrings. **Root cause:** React **Strict
  Mode** (Next.js dev default) double-mounts components; combined with Suspense (model loading suspends), r3f
  created→disposed→recreated the WebGL context, and that churn crashed it. A hand-built box worked *only* because
  it doesn't suspend. Disabling Strict Mode fixed it instantly. Tradeoff accepted (common for r3f apps); revisit
  if we want Strict-Mode safety later (would need r3f context-preservation handling).
- **Debug method that cracked it:** drove the *real* M5 GPU via a headed Playwright script
  (`scratchpad/angle-test.js`) checking `gl.isContextLost()` — headless uses SwiftShader (software) which can't
  render heavy VRMs and was misleading. Bisected box vs glTF vs skinned vs textured vs Strict-Mode.
- **Avatar pose:** renders in default **T-pose** (bind pose). Fine for 1.1; give it a relaxed/idle pose in polish.
- _(TTS provider, Pipecat-vs-LiveKit, lip-sync mapping — record as we reach them.)_
