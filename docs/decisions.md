# Dry Run — Decision Log (ADR)

> Every tool/model/architecture choice, **with the evidence that drove it**. One entry per decision:
> context → options → decision → measurements → consequences. Append, don't rewrite: superseded entries
> get a `Superseded by #N` banner but stay, because the *reasoning trail* is the point.
>
> Companion to `/DRY_RUN.md` (architecture) and `docs/phase-N.md` (build narrative).
> Status: ✅ adopted · ❌ rejected · ⏸️ deferred · ⚠️ superseded
>
> ---
> **⚠️ Reconstruction note (2026-09-04).** The original `decisions.md` was lost (it sat under the
> `/docs/*` gitignore rule and was never committed). This file was rebuilt from the surviving records in
> `docs/phase-1.md`, `docs/PROGRESS.md`, and `/DRY_RUN.md`. **Aggregate metrics below are quoted from those
> docs and are trustworthy. The original per-sentence eval tables did NOT survive** — they are marked
> `[per-sentence rows lost]` and can be regenerated at any time by re-running `scripts/eval-tts.mjs`.
> Entry numbering preserves `#3 = TTS`, because `phase-1.md` and `PROGRESS.md` both cite "entry 3" by number.

---

## #1 — Avatar format: Ready Player Me → **VRM**  ✅
**Date:** 2026-08-05 · **Phase:** 1.1 · **Status:** ✅ adopted

**Context.** Phase 1 needs a rigged humanoid avatar with **morph-target blendshapes** (the prerequisite for
browser lip-sync — established in Phase 0, where both legacy GLBs were found to have **0 morph targets** and
were therefore unusable). The plan of record was Ready Player Me.

**Forcing event.** **RPM shut down 2026-01-31** (Netflix acquisition). `models.readyplayer.me` is NXDOMAIN;
the creator tool is gone. Not a preference change — the option ceased to exist.

**Options.**
| Option | Verdict |
|---|---|
| Ready Player Me | ❌ dead — CDN NXDOMAIN, no creator |
| **VRM** (VRoid Studio to author, `@pixiv/three-vrm` to load) | ✅ **adopted** |
| Hand-rigged GLB in Blender | ❌ graphics work, not AI work — violates "avatar is a thin presentation layer" |

**Decision.** **VRM.** Open standard, free Mac authoring tool (VRoid Studio), mature three.js loader.

**Bonus that mattered later.** VRM ships **standardized emotion presets** (happy/angry/sad/relaxed/surprised)
*alongside* visemes (`aa/ih/ou/ee/oh`). RPM did not. **Phase 4 affect display gets its render layer for free** —
the SER model's output has somewhere to go without new avatar work. This turned a forced migration into an
architectural win.

**Verified.** Sample `public/avatar.vrm` = official VRM-spec **Seed-san** (VRM 1.0), confirmed to carry
**18 expression presets** — visemes, emotions, blinks, gaze. (First tried `VRM1_Constraint_Twist_Sample`,
a physics stress-test model; swapped for the clean character.)

**Consequences.** Avatar renders in default **T-pose** (bind pose) — acceptable for Phase 1, needs an idle
pose in Phase 6 polish. Locked `three` to **0.180.0** to match `@pixiv/three-vrm` 3.5.5's tested version.

---

## #2 — Brain provider: Anthropic → **Gemini free tier** (budget-driven, temporary)  ⚠️
**Date:** 2026-08-11 · **Phase:** 1.3 · **Status:** ⚠️ **superseded by #4 (2026-09-03 — project 403'd)**

**Context.** Phase 1.3 needs an LLM for the interviewer persona. `DRY_RUN.md` locks **Claude** as the
long-term brain. But the Anthropic API has **no free tier** (~$5 minimum credits) and no credits were
available at the time.

**Options.**
| Option | Quality | Setup cost | Verdict |
|---|---|---|---|
| Anthropic (Claude) | best | **needs ~$5** | ⏸️ deferred, remains the target |
| **Gemini free tier** | high | instant, $0 | ✅ **adopted (interim)** |
| Local Ollama | medium | model pull + RAM | ❌ slower to set up, weaker at persona |
| Groq free tier | medium-high | instant | ❌ not needed once Gemini chosen |

**Decision.** Ship 1.3 on **Gemini free tier** (`@google/genai`, `gemini-3.6-flash`, `GEMINI_API_KEY`),
behind a hand-owned **`askBrain()` seam** so the swap back to Claude is a one-file change.

**Deliberately NOT built: a multi-provider abstraction framework.** That would be premature abstraction,
would collapse to a lowest-common-denominator interface, and would hide the SDK mechanics this project
exists to teach. One function, one provider at a time. *(Revisited in #5.)*

**Consequences — the hidden cost that surfaced later.** Multi-turn memory was implemented via Gemini's
**server-side** `previous_interaction_id`. That is **provider-locked state we don't own** — it never hands
us the transcript. Recorded at the time as acceptable; it becomes the blocking constraint in **#5**.

---

## #3 — TTS: Gemini TTS ❌ eliminated → **Kokoro-82M** ✅ adopted
**Dates:** 2026-08-16 (elimination) · 2026-08-17 (adoption) · **Phase:** 1.4 · **Status:** ✅ adopted

**Context.** Phase 1.4 needs the interviewer's reply spoken aloud, then routed into the 1.2 `AnalyserNode`
so the avatar's mouth moves in time. Requirement: fast enough for conversational turn-taking, and free.

### Stage A — browser `SpeechSynthesis` ❌
Worked ("it talks"), but a **known dead end for the avatar**: exposes **no audio node** to analyse, so it can
never drive lip-sync. Kept only as a stepping stone.

### Eval methodology (`scripts/eval-tts.mjs`)
Built deliberately as a *fair* harness, not a demo:
- **9 fixed sentences** spanning realistic interviewer output — short acks ("Right."), long technical questions,
  reassurance, numerics. One sentence intentionally **duplicated** to expose caching/variance.
- **3 runs/sentence = 27 calls**; report the **median** (first call is often a cold start).
- **~7 s throttle between calls** — deliberately generous, to give the rate-limited candidate its best case.
- **Per-call failure detection** with an honest **`ok: x/RUNS`** column — failures are reported, never silently
  dropped from the average. *(This is the part that made the result trustworthy.)*
- **RTF (real-time factor)** = `synth_seconds / audio_duration_seconds`. **RTF < 1 = faster than real time.**
  Duration derived from WAV byte count (24 kHz, 16-bit, mono).

### Results
| Engine | RTF (median) | Synth time | Success rate | Cost | MOS |
|---|---|---|---|---|---|
| Gemini `gemini-3.1-flash-tts-preview` | **1.5 – 4.3** | — | **mostly 429** even when throttled | $0 | — |
| **Kokoro-82M** (self-hosted) | **0.08 – 0.12** | **154 – 773 ms** | **27 / 27** | **$0** | ~3.5 |

`[per-sentence rows lost — re-run scripts/eval-tts.mjs to regenerate]`

**Headline:** **~19× faster** on the shared VAE sentence, **100% reliable vs mostly-failing**, same $0.

**Decision — ❌ Gemini TTS eliminated** on *two independent* grounds, either of which alone is disqualifying:
1. **Rate limits** — 429s at ~10 RPM plus a low daily cap; even a 7-s-throttled eval mostly 429'd. Unusable
   in a conversational loop.
2. **Speed** — RTF 1.5–4.3 means synthesis takes **longer than the audio it produces**. Structurally
   incompatible with real-time dialogue.

**Decision — ✅ Kokoro-82M adopted.** Apache-2.0, 82M params, CPU-viable, no account, no quota.
Served from **our own** FastAPI server (`tts-server/server.py`) rather than a prebuilt one — a deliberate
**model-serving resume win**. Design choices that mattered:
- `KPipeline(lang_code='a')` instantiated **once at module import**, not per request → warm inference,
  no cold start on the hot path.
- Generator chunks stitched with `np.concatenate`; **one in-memory WAV** via `soundfile` into `io.BytesIO`
  (`format="WAV"` is required — there's no filename for it to infer the container from).
- Python pinned to **3.12** via `uv` (PyTorch had no 3.14 wheels); `espeak-ng` via brew for phonemization.
- First run downloads weights to `~/.cache/huggingface`, then **fully offline**.

**Quality tradeoff, accepted.** MOS ~3.5 — clean but slightly non-human, below Gemini's voice quality.
Accepted because reliability and latency are load-bearing for a *conversation* and voice quality is not,
and because the `textToSpeech()` seam makes revisiting it a one-file change. `synthesizeWithGemini` retained
(commented) for a future paid-tier swap.

**🔑 The finding that redirected later work.** **TTS is NOT the app's latency bottleneck.** Synthesis is
sub-second. Perceived lag is the **LLM brain + the no-overlap pipeline** (brain fully completes → then TTS
starts → then audio plays). **Consequence: latency effort goes to streaming and the brain, not the TTS engine.**
Without this measurement the obvious-but-wrong move would have been optimizing TTS.

**Seam validated.** Swapping Gemini → Kokoro touched **one file** (`src/lib/voice.ts`), exactly as designed.
The route stayed dumb: `await textToSpeech(text)`. This is the empirical evidence that the seam pattern works —
and the reason #5 extends it to the brain.

---

## #4 — Gemini project denied access (403) — forced provider re-evaluation  ⚠️
**Date:** 2026-09-03 · **Phase:** 1.x · **Status:** ⚠️ open — blocking the brain

**Event.** `POST /api/interview` began failing with **HTTP 403 `permission_denied`**:
`"Your project has been denied access. Please contact support."`

**Diagnosis (curl bisect, 2026-09-04).** Isolated provider-side vs code-side:
| Request | Result | Tells us |
|---|---|---|
| `GET /v1beta/models` | **200** — 55 models listed, incl. `gemini-3.6-flash` | key valid, `.env.local` loads, project exists, model name correct |
| `POST /v1beta/interactions` — `gemini-3.6-flash` | **403** denied | — |
| `POST /v1beta/interactions` — `gemini-3.5-flash` | **403** denied | — |
| `POST /v1beta/interactions` — `gemini-3.1-flash-lite` | **403** denied | — |
| `POST .../gemini-2.5-flash:generateContent` | **404** "no longer available to new users → use 3.6-flash" | boxed in from both sides |

**Conclusion.** **Blanket project-level denial on inference.** Catalog reads succeed; *every* model refuses to
serve. Not a code bug, not a bad key, not a wrong model name, not quota (that would be 429), not a bad env var
(that would be 400 `API_KEY_INVALID`).

**Leading hypothesis.** The key was minted under a **Google Workspace–managed account** (`@scalerailabs.com`).
AI Studio's free tier is routinely unavailable to Workspace-managed projects — org policy blocks generative
APIs, and Google's surface message for that is this generic "denied access / contact support". The key's
format (an `AQ.`-prefixed 53-char string) is the newer console-issued style rather than a personal AI Studio
`AIza…` 39-char key,
consistent with the hypothesis. **Cheapest test: mint a key from a personal Gmail and re-run the same curl.**

**Strategic read.** This is the **second** free-tier wall in two milestones — 429s killed Gemini TTS in #3,
a 403 now kills the brain. The pattern is the argument for #5, and for eventually funding the Anthropic path
that `DRY_RUN.md` locked from the start. `@anthropic-ai/sdk` is already in `package.json`.

---

## #5 — Provider-agnostic brain seam (Gemini ⇄ Ollama) — ⏸️ deferred to Phase 2
**Date:** 2026-09-04 · **Phase:** 2 · **Status:** ⏸️ deferred (deliberately)

**Context.** #4 leaves the brain blocked on a provider we don't control. Ollama is already installed locally
(`qwen2.5:14b` 9 GB · `qwen2.5vl:7b` · `llama3.2:3b`, on M5 Pro / 24 GB) — a $0, quota-free, offline fallback.
Motivating goal: make the brain **switchable** between hosted Gemini and local Ollama.

**The blocking constraint (discovered during design).** The current contract is
`askBrain(question, previousId) → {text, id}`, where `id` is **Gemini's server-side conversation state**.
**Ollama's `/api/chat` is stateless** — you resend the full history every call. So Ollama has no
equivalent of that `id`, and a switch cannot paper over the difference. Two options:

| Option | Verdict |
|---|---|
| **(A)** Fake an `id` in the Ollama adapter via a server-side `Map<uuid, messages[]>` | ❌ preserves the interface, but dies on restart, doesn't survive multiple processes, and is a dead end |
| **(B)** Flip the contract: caller owns the transcript → `askBrain(messages) → {text}`, providers stateless | ✅ **correct** |

**Why (B).** Ollama *and* Anthropic are both natively stateless — **Gemini is the odd one out**. The
`/interview` page **already holds the full transcript** in `messages` state; it simply never sends it. And
`phase-1.md` already predicted this move: *"Phase 2 + the Claude swap move to a client/DB-owned transcript we
replay ourselves."*

**Decision — ⏸️ defer to Phase 2, don't build it standalone now.** The stateless-transcript refactor **is**
Phase 2's foundation (store rich → retrieve + linearize a relevant slice into a finite context window). Doing
it twice — once as a provider switch, again as the memory substrate — is wasted work. The provider switch
arrives as a *free side effect* of building memory properly.

**Design of record, for when Phase 2 starts.**
```
BRAIN_PROVIDER=gemini | ollama     ← one env var, server-side
askBrain(messages) → { text }      ← stateless, provider-agnostic
  ├── askGemini(messages)          ← → system_instruction + contents[]
  └── askOllama(messages)          ← → messages[] with a system role
```
- Interviewer persona lives **once, outside both adapters** — product logic, not provider logic. Each adapter
  only translates the neutral shape into its provider's dialect. Claude later = a third adapter, nothing else moves.
- Translate role vocabulary at the boundary: UI speaks `interviewer | user`, every API speaks `assistant | user`.
  Don't let API vocabulary leak into component state.
- **Ollama gotchas:** `POST http://127.0.0.1:11434/api/chat`; **`stream: false` is required** or you get NDJSON
  chunks and `res.json()` throws; read **`.message.content`** (nested, and it's `content` not `text`); a dead
  daemon makes `fetch` **throw** rather than return `!res.ok`, so an `!res.ok` guard alone won't catch it
  (same gap currently in `voice.ts`).
- **Model:** start `qwen2.5:14b`. `llama3.2:3b` is faster but drifts out of character and struggles with
  "ask exactly one question" — which is most of the persona.

**Eval owed when built** (→ future entry #6): local vs hosted on **persona adherence** (does it ask exactly one
question / avoid revealing answers), **latency**, and **cost**. Same discipline as #3 — fixed prompt set,
median of N, honest failure counts.

---

## Standing decisions inherited from `DRY_RUN.md` §6
Locked at design time, not yet re-litigated — no independent eval evidence yet, so they are *not* numbered ADR
entries. Each gets one when its phase produces measurements.

| Area | Choice | Status |
|---|---|---|
| Frontend | Next.js 15 App Router + React 19 + TS + Tailwind | ✅ in use |
| DB / auth / vector | Supabase (Postgres + pgvector/HNSW) | ⏸️ Phase 2 |
| Real-time voice | Pipecat **or** LiveKit (undecided between them) | ⏸️ Phase 1.5 / 6 |
| STT | streaming provider TBD; **Web Speech ruled out** (barge-in needs streaming) | ⏸️ Phase 1.5 |
| Embeddings | local sentence-transformers → pgvector (Anthropic has no embeddings API); Voyage = fallback | ⏸️ Phase 2 |
| Retrieval | hybrid BM25 + HNSW → RRF → cross-encoder rerank → ×recency ×importance | ⏸️ Phase 2 |
| BM25 backend | `rank_bm25` vs Postgres GIN vs ParadeDB — decide by corpus size | ⏸️ Phase 2 |
| Code execution | Piston (free) | ⏸️ Phase 3 |
| Deploy | cloud-agnostic Docker; GCP vs AWS free tier TBD | ⏸️ Phase 6 |

## Accepted tradeoffs (not choices between alternatives — costs knowingly taken on)
- **`reactStrictMode: false`** — Strict Mode double-mounts; with Suspense that made r3f create→dispose→recreate
  the WebGL context, crashing the tab. Cost: no Strict-Mode safety net. Common for r3f apps. Revisit only with
  proper context-preservation handling. *(Root-caused via a headed Playwright bisect on the real GPU — headless
  uses SwiftShader and was actively misleading.)*
- **Package manager = `pnpm`, never npm** — mixing produced an ERESOLVE + lockfile mess. `pnpm-lock.yaml` is truth.
- **No `useGLTF.preload`** — it caches by URL *without* `VRMLoaderPlugin`, so a later plugin-registered load
  silently gets the pluginless glTF (`userData.vrm === undefined`).
- **No `removeUnnecessaryVertices` / `combineSkeletons`** — corrupts morph-target vertex buffers, crashing the
  renderer the moment a morph is driven. Re-add only if perf demands *and* verified.
- **`next@15.1.7` carries CVE-2025-66478** — bump when convenient, not blocking.
