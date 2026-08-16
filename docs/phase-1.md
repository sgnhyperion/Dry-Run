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
- [x] **1.2 — Lip-sync.** ✅ Mic → Web Audio `AnalyserNode` → per-frame loudness → drives the `aa` viseme
  (with a gain factor + `Math.min` clamp so it's expressive). Harsh built it via the co-pilot method.
  - Learn: visemes vs phonemes, VRM expression presets, real-time audio → mouth-shape mapping.
  - Later refinements: multi-viseme (`ih/ou/ee/oh` from frequency bands or `wawa-lipsync`); drive from TTS (1.4).
- [x] **1.3 — The brain.** ✅ Text → LLM (interviewer persona) → text, in a Next.js API route, with coherent
  multi-turn memory. *(On the **Gemini free tier** for now behind an `askBrain()` seam — Claude swaps in later.
  Streaming + a browser chat UI still to come.)*
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
**1.3 — the brain. ✅ COMPLETE (2026-08-13).** Full text interviewer: API route → LLM behind an `askBrain()`
seam → interviewer persona → multi-turn memory → a polished browser chat UI at `/interview`. (1.1 ✅ avatar ·
1.2 ✅ lip-sync at `/studio`.) **Now starting → 1.4 voice out (TTS).**
- **What works:** `GET /api/interview` → `src/app/api/interview/route.ts` → calls the model with one hard-coded
  prompt → returns `{ reply: "<question>" }`. Verified in-browser (got a real neural-speech-synthesis question).
  Harsh wrote the call + text-extraction himself (co-pilot method).
- **Provider decision (2026-08-11):** no Anthropic API credits available right now (the API isn't free; needs
  ~$5 min). So the brain runs on **Google Gemini free tier** for now — `@google/genai`, model `gemini-3.6-flash`,
  key `GEMINI_API_KEY` in `.env.local`. Claude drops back in later via the `askBrain()` seam (see notes).
- **Concepts taught:** secret key → server-side only → Next.js API route (`app/api/<name>/route.ts` → `/api/<name>`);
  `await` for async network calls; env is a *snapshot* read at server start (restart `pnpm dev` after editing
  `.env.local`); debug by verifying assumptions (`console.log("key?", !!process.env.GEMINI_API_KEY)`).
- **Remaining for 1.3:** ✅ (a) `askBrain()` seam · ✅ (b) interviewer **system prompt / persona** (via
  `system_instruction`) · ✅ (c) **dynamic input** — `POST` reads `await request.json()` and reacts to the answer
  · ✅ (d) **multi-turn memory** — via Gemini's `previous_interaction_id`: `askBrain(message, previousId)` returns
  `{ text, id }`, and the caller chains the returned `id` into the next call. Verified via curl 2026-08-12 (turn 2
  correctly built on turn 1's VAE exchange). ⚠️ NOTE: memory currently lives **server-side on Gemini** (keyed by
  that `id`) — fine for now, but it's provider-locked and doesn't hand us the transcript. The model itself stays
  *stateless*: whatever the store, history is linearized into the context window each call (→ finite window → the
  whole point of Phase 2 memory: store rich, retrieve+linearize a relevant slice). Phase 2 + the Claude swap move
  to a client/DB-owned transcript we replay ourselves. ✅ **Browser chat UI** built at `/interview` (2026-08-13,
  `src/app/interview/page.tsx`): the *browser* holds the `id` in `previousId` state and chains it automatically (the
  "we own the handle" version). Harsh went well beyond the scaffold — `loading` + thinking-wave, `try/catch` error
  state, a `canSend` guard, Enter-to-send / Shift+Enter, Tailwind styling. Multi-turn verified in-browser ("can you
  rephrase that?" → it rephrased its own prior question). Key insight: `previousId` = state that drives *behavior*
  (memory), `reply` = state that drives the *view* (display only, never sent to the server). **1.3 DONE.**
  Deferred (optional): (e) **stream** the reply — nice-to-have for latency, more valuable once voice is in.
- ✅ **Chat history transcript (2026-08-14):** `/interview` now keeps a `messages: {role,text}[]` state array (seeded
  with a greeting), appends the user's line *immediately* + the interviewer's reply after the await — both via the
  functional updater `setMessages(prev => [...prev, …])`; captures `const answer = message` *before* clearing the input
  and sends `answer` (not the cleared state). Lesson landed: React state is immutable (replace, don't `push`), and the
  functional updater avoids the stale-closure overwrite when appending twice in one handler. Transcript display is
  independent of the model's memory (`previousId`). ⚠️ NOTE: the `/interview` page's **UI/styling/animations were built
  by a *separate* AI agent** — Harsh owns the **logic**, not the UI (calibrate mentoring accordingly).
- **▶ IN PROGRESS — 1.4 voice out (TTS):** speak the interviewer's reply aloud, then route that audio into the 1.2
  `AnalyserNode` so the avatar's mouth moves in time.
  - ✅ **Stage A done:** browser `SpeechSynthesis` in `handleSend` (`new SpeechSynthesisUtterance(data.text)` +
    `speechSynthesis.speak`). Confirmed it talks. Known dead-end for the avatar (exposes no audio node to analyze) —
    just a "hear it" win.
  - ✅ **Stage B partly done — Gemini TTS wired then eliminated:**
    - Built the seam `src/lib/voice.ts` → `textToSpeech(text)` (Gemini `gemini-3.1-flash-tts-preview`,
      `response_format:{type:'audio'}`, `generation_config.speech_config:[{voice:'Kore'}]` → base64 PCM →
      `pcmToWav` → WAV `Buffer`) + route `src/app/api/tts/route.ts` (POST → `new Response(new Uint8Array(wav),
      {'Content-Type':'audio/wav'})`). Seam now **fails loud** (throws on empty audio; the old `?? ''` hid failures).
    - `/interview/page.tsx` `handleSend` calls `/api/tts`, `decodeAudioData`s the WAV, plays via an
      `AudioBufferSourceNode` → (currently straight to `destination`; **no AnalyserNode yet** — that's the remaining bridge).
      Fixed bugs there: moved `setPreviousId` before the TTS call (a TTS error was skipping memory-threading),
      request `Content-Type: application/json`, absolute `/api/tts`, and reuse one `AudioContext` (don't `new` per send).
    - Built a **robust eval harness** `scripts/eval-tts.mjs` (fixed test set, throttle ~8/min, per-call failure
      detection, median of successes, honest `ok: x/RUNS` column, duration from byte count).
    - **DECISION (2026-08-16): ❌ Gemini free-tier TTS eliminated** — rate-limited (429; ~10 RPM + low daily cap;
      even a throttled eval mostly 429'd) **and** slow (RTF 1.5–4.3 on successes). Full result table + rationale in
      `docs/decisions.md` entry 3.
  - ✅ **Kokoro-82M ADOPTED (2026-08-17)** — self-hosted, local, open 82M model, zero quota, CPU:
    - Built our **own** Python **FastAPI** server `tts-server/server.py` (not a prebuilt one — a model-serving resume win):
      `KPipeline(lang_code='a')` loaded **once at module import** (warm inference, not cold-start per request); `POST /tts`
      takes `{text}`, loops the generator collecting each `(gs, ps, audio)` chunk, stitches with `np.concatenate`, writes
      one **in-memory** WAV via `soundfile` (`io.BytesIO`, `format="WAV"` required — no filename to infer from), returns
      `Response(..., media_type="audio/wav")`. Pinned Python **3.12** via `uv` (PyTorch has no 3.14 wheels yet); `espeak-ng`
      via brew for phonemization. First run downloads weights to `~/.cache/huggingface` then fully offline.
    - Swapped behind the seam: `synthesizeWithKokoro`/`textToSpeech` in `voice.ts` `fetch`es `http://127.0.0.1:8000/tts`
      (full URL — scheme + `/tts` path), guards `!res.ok` (fetch only throws on network death, not HTTP errors →
      fail-loud on 500), returns `Buffer.from(await res.arrayBuffer())` (no `pcmToWav` — the server already wrote the
      WAV header). Route stayed dumb: `await textToSpeech(text)` — one-file swap, as the seam promised. `synthesizeWithGemini`
      kept for a future paid-tier swap.
    - Fixed **`window is not defined`** SSR crash: `AudioContext` was built at render time (runs on the server during SSR);
      moved to lazy creation in `handleSend` (`useRef<AudioContext|null>(null)`, `if (!audioCtx.current) audioCtx.current = new …`)
      — also satisfies the browser autoplay-gesture rule for free.
    - **Benchmark** (same `scripts/eval-tts.mjs`, 3 runs/sentence, median): **RTF 0.08–0.12, sub-second synth (154–773 ms),
      27/27 calls, $0.** vs Gemini RTF 1.5–4.3 + 429s → ~19× faster on the shared VAE sentence, 100% reliable. MOS ~3.5
      (clean, slightly non-human — acceptable, revisitable via the seam). Full table in `docs/decisions.md` entry 3.
    - **Insight:** TTS is **not** the app's latency bottleneck (synth is sub-second) — perceived lag is the LLM brain +
      no-overlap pipeline. Latency work → streaming/brain, not the TTS engine.
  - **▶ NEXT — the avatar bridge:** insert an `AnalyserNode` into the playback graph (`source → analyser → destination`)
    and feed its loudness into the 1.2 `aa` viseme so the `/studio` avatar lip-syncs the voice. (Needs avatar + voice
    on the same page — a wiring decision.)
  - Deferred: streaming the reply (latency polish; the real latency lever now that TTS is proven fast).

## Decisions / notes (fill in as we build)
- **Brain provider (2026-08-11, budget-driven):** Anthropic API has no free tier (needs ~$5 credits) and Harsh has
  none yet → Phase 1.3 spine is built on the **Gemini free tier**. Install `pnpm add @google/genai`; `new
  GoogleGenAI({})` auto-reads `GEMINI_API_KEY`; call `ai.interactions.create({ model: "gemini-3.6-flash", input })`
  and read `.output_text` (a plain string — simpler than Claude's content-block array). Gemini chosen over local
  Ollama / Groq for best free quality + fastest setup. **Not tightly coupled:** all model calls go behind a
  hand-owned `askBrain()` function (one file), so switching back to Claude (`@anthropic-ai/sdk`, `claude-opus-4-8`)
  later is a one-file change — deliberately NOT a multi-provider framework (that'd be premature abstraction /
  lowest-common-denominator, and would hide the SDK mechanics Harsh is here to learn). Claude-specific features
  (adaptive thinking / effort / tool use) matter mainly in Phases 2–5; revisit the provider then.
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
- **⚠️ Package manager = `pnpm`** (NOT npm — mixing them caused an ERESOLVE + lockfile mess). Use `pnpm add`,
  `pnpm install`, `pnpm dev`. A stray npm-created `package-lock.json` can be deleted (`pnpm-lock.yaml` is the truth).
- **Security TODO:** `next@15.1.7` has CVE-2025-66478 — bump to a patched patch release when convenient (not blocking).
- **Refactor:** the mic "Start" button was pulled into `src/components/StartButton.tsx` (Harsh's own change).
- _(TTS provider, Pipecat-vs-LiveKit, lip-sync mapping — record as we reach them.)_
