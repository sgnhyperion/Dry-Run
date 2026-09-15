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

## #4 — Gemini project denied access (403) — forced provider re-evaluation  ✅
**Dates:** 2026-09-03 (onset) · 2026-09-10 (**resolved, self-healed**) · **Phase:** 1.x · **Status:** ✅ closed — transient, hypothesis falsified

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

### Resolution (2026-09-10) — self-healed; the hypothesis was **wrong**
Re-ran the identical bisect **seven days later, with no action taken** — same `AQ.`-prefixed 53-char key, same
Workspace-managed project, no new key minted, no support ticket:

| Request | 2026-09-03 | 2026-09-10 |
|---|---|---|
| `GET /v1beta/models` | 200 | **200** |
| `gemini-3.6-flash:generateContent` | — | **200** — real reply returned |
| `POST /v1beta/interactions` (`gemini-3.6-flash`) ← *the call `askBrain()` makes* | **403 denied** | **200** — `status:"completed"` + id |
| `gemini-2.5-flash` | 404 "not available to new users" | now **listed** in the catalog again |

**Conclusion. The 403 was a transient provider-side denial, NOT Google Workspace org policy.** The
"`@scalerailabs.com` org blocks generative APIs" hypothesis is **falsified**: org policy does not lapse by
itself, and the key that supposedly violated it now serves inference unchanged. The `AQ.`-vs-`AIza…` key-format
reasoning was **correlation, not cause** — the newer console-issued format works fine.

**⚠️ The diagnostic lesson (worth more than the fix).** The bisect correctly localized the fault to
*provider-side, not code* — that part was rigorous and right. The error was going one step further and naming a
**specific permanent cause** from **circumstantial evidence** (key prefix + account domain), then writing a
remediation ("mint a personal-Gmail key") against it. A 403 with a generic vendor message is **under-determined**:
transient infra denial and permanent policy denial are indistinguishable from the response alone. **The cheapest
test was never "mint a new key" — it was "wait and re-run the same curl."** Rule going forward: for an opaque
provider-side failure, **re-test before remediating**, and record hypotheses as hypotheses, not as findings.

**What survives.** The *strategic* read above still stands on its own merits — free-tier walls (TTS 429s in #3)
are a real recurring risk, and #5's provider-agnostic seam is still the right Phase-2 move. But it is **no longer
forced by an outage**: the Gemini brain is serving, so #5 stays deliberately deferred to Phase 2 as designed,
driven by the memory refactor rather than by an emergency.

**Live observation to carry into tuning.** The resolution trace showed **462 thought tokens for a 7-token reply**
(`total_thought_tokens: 462`, `total_output_tokens: 7`). `gemini-3.6-flash` reasons by default. This compounds
#3's headline finding — **the brain, not TTS, is the latency bottleneck** — and is the first place to look when
tightening interviewer turn latency.

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

## #6 — Voice IN: **self-hosted `faster-whisper`** + push-to-talk · **Pipecat/LiveKit deferred to Phase 6**  ✅
**Date:** 2026-09-10 · **Phase:** 1.5 · **Status:** ✅ adopted — Phase 1 talking spine now closed both ways

**Context.** Milestone 1.5 is the last open item in Phase 1: the candidate must *speak* and be understood.

**The doc contradiction that had to be resolved first.** `DRY_RUN.md` said two incompatible things:
§3.3, §3.4 (MVP screen), §9 Phase 1 and §9 Phase 6 all specify **push-to-talk in v1, barge-in in Phase 6** —
while §6 "Decided" said **adopt Pipecat/LiveKit now, with VAD and barge-in from the start, *not* push-to-talk**.
`phase-1.md` had inherited the §6 version, so the plan of record for 1.5 was a full real-time framework migration.

**Decision — go with the 4-to-1 majority: push-to-talk now, framework deferred to Phase 6.** A Pipecat/LiveKit
adoption is the largest remaining Phase-1 cost and, by this project's own stated bar (*"implementing research
papers, training real models … not gluing together API calls"*), the **lowest resume value in the roadmap** —
it is framework integration, not applied AI. Critically, **it blocks nothing**: memory, the judge model, SER,
Reflexion and the eval harness are all reachable with turn-based audio. §6 has been corrected in place.

**Options for the STT engine itself.**
| Option | Verdict |
|---|---|
| Browser Web Speech API | ❌ still out — quality varies by browser, and it was already ruled out |
| Deepgram / AssemblyAI free tier | ❌ a **third** free-tier dependency after #3's 429s and #4's 403. Not paying that tax again for a component we can self-host |
| **Self-hosted `faster-whisper`** | ✅ **adopted** — $0, offline, no quota, no account |

**Decision — `faster-whisper` (`small.en`, `compute_type="int8"`, CPU) served from the FastAPI service we
already run.** `small.en` over `base.en` because technical jargon punishes the smaller models; `int8` CPU
because ctranslate2 has no Metal/MPS backend. `beam_size=1` (greedy) roughly halves latency at negligible WER
cost here, and `vad_filter=True` strips the silence push-to-talk recordings are full of — which both cuts
latency and stops Whisper hallucinating text into dead air.

**The structural win.** This did **not** add a service. `tts-server/` already hosts Kokoro, and `DRY_RUN.md`
already slates that Python service to host **embeddings (Phase 2), the SER model (Phase 4), and the judge
(Phase 3)**. Adding `/stt` turns it into the ML backbone it was always going to become — same process, same
load-once-at-import pattern, one extra endpoint. Phase 1.5 cost ~an afternoon on proven infrastructure instead
of a framework migration.

**Measurements** (TTS→STT round-trip; Kokoro synthesises known ground truth, Whisper transcribes it back):
| Utterance | Audio | Transcribe | RTF | Transcript |
|---|---|---|---|---|
| "…variational autoencoder and a GAN?" | 5.03 s | 1.90 s | **0.378** | exact, bar `auto-encoder` hyphenation |
| "What is the time complexity of your solution?" | 2.98 s | 0.79 s | **0.266** | **exact** |
| "Walk me through how you would handle a hash collision." | 3.25 s | 0.81 s | **0.248** | **exact** |

**⚠️ Honest limitation — this is a smoke test, not a WER number.** The audio is *synthetic* (Kokoro), so it is
clean, unaccented, and free of room noise and disfluency. It proves the pipeline works and bounds the latency;
it says nothing reliable about accuracy on real human speech. **A real eval on human audio is owed** before
any accuracy claim — same discipline as #3.

**Verified end-to-end** through the real Next.js routes: audio → `/api/stt` → `/api/interview` → `/api/tts` →
audio, transcript word-perfect, TTS reply in 0.41 s.

**Implementation notes.**
- **Raw bytes, not `multipart/form-data`** — skips the `python-multipart` dependency and an encoding round-trip;
  the browser's `MediaRecorder` Blob POSTs directly. PyAV (bundled with faster-whisper) demuxes whatever
  container the browser picked — webm/opus on Chrome, mp4 on Safari — so the client never has to normalise.
- **`speechToText()` seam** in `src/lib/ears.ts`, mirroring `textToSpeech()`. It handles **both** failure
  shapes: `fetch` **throws** on a dead daemon and only returns `!res.ok` for HTTP errors — the exact gap #5
  flagged in `voice.ts`. A `!res.ok` guard alone would miss "the server isn't running", the likeliest local failure.
- **One send path.** `sendAnswer(answer)` takes the text explicitly instead of reading `message` state, because
  the voice path sends a transcript that was never in the textarea and `setState` is async — staging it there
  would have sent a stale value. Text and voice now converge on identical logic.
- **`MediaRecorder` flushes asynchronously.** The final chunk only lands after `stop` fires, so the Blob must be
  assembled inside `onstop`; reading the chunk array synchronously after `stop()` silently truncates every
  recording's tail.
- **The user's audio is now captured** — which is exactly the input **Phase 4's SER model** needs. Nothing to
  re-plumb when affect lands.

**Consequences.** Phase 1 is functionally complete. Deferred by choice: streaming/barge-in (Phase 6), and a
real human-speech WER eval before any accuracy claim is made.

---

## #7 — Streaming, pipelined voice turns + multi-agent orchestration  ✅
**Date:** 2026-09-14 · **Phase:** pivot (pulled Phase 6 forward) · **Status:** ✅ adopted

**Context — a target change, not a technical one.** ShortLoop (voice AI platform, thousands of calls
daily) reached out about their founding team. Their stated stack: *real-time multi-agent orchestration,
streaming voice, context engineering, latency*. Dry Run's roadmap optimised for a different audience —
research-y AI labs — and **#6 had deferred exactly the wrong thing**, moving streaming and barge-in to
Phase 6 on the grounds that they were "the lowest resume value — framework integration, not applied AI."
For this target that judgement **inverts**: streaming and latency *are* the product.

**Decision.** Pull Phase 6 forward. Rebuild the turn as a streaming, pipelined, multi-agent pipeline with
the latency budget measured rather than asserted. Phase 2 (memory) still maps to their "context
engineering", so it stays on the roadmap rather than being discarded.

### The change: blocking → pipelined
The old turn was three blocking stages — brain writes everything → TTS synthesises everything → audio
plays. Time-to-first-audio was the sum. Now the stages overlap: tokens stream, a chunker cuts a speakable
sentence the instant one completes, and that sentence's synthesis starts while the model keeps writing.

Two invariants make it safe: TTS jobs **start** eagerly and a separate consumer drains them *while*
generation continues; audio is **emitted** strictly in order, because speech played out of order is worse
than speech played late. Concurrency lives in when work starts, never in when it's sent.

### Measured (`scripts/bench-latency.mjs`)
A `mode` flag reproduces the old blocking path, so both arms run through **identical** code, models, and
hardware — the delta is attributable to the pipelining and nothing else. Ollama `qwen2.5:14b` + Kokoro,
3 runs/prompt, median, one warmup turn discarded:

| prompt | sequential TTFA | pipelined TTFA | saved | speedup |
|---|---|---|---|---|
| short ack | 3110 ms | **784 ms** | 2326 ms | **3.97×** |
| normal answer | 2055 ms | **546 ms** | 1509 ms | **3.76×** |
| long multi-part reply | 5686 ms | **3398 ms** | 2288 ms | **1.67×** |

**Mean TTFA speedup: 3.13×.** Total turn time did **not** regress (5669 → 4937 ms on the long reply),
which rules out the obvious failure mode of improving TTFA by pushing work later.

Headline metric is deliberately **time-to-first-audio, not total** — a voice agent is judged on when it
starts talking, not when it stops. Total is reported anyway so a regression there stays visible.

### Multi-agent: split by latency class, not by topic
- **Interviewer** — critical path. Streamed, chunked, spoken.
- **Analyst** — off the critical path. Scores the answer, steers the **next** turn via a compiled
  directive injected into the interviewer's context. The interviewer never sees the raw analysis.

**🔑 The finding worth more than the feature: "not awaited" is not the same as "free".**
| Configuration | Time-to-first-audio |
|---|---|
| no analyst | ~1463 ms |
| analyst concurrent, **same** local model | **4307 ms** — plain CPU contention |
| analyst concurrent, **smaller** model | **56 000 ms** on one turn — Ollama evict-and-reload |
| analyst **deferred** until audio is sent | ~728–1690 ms (restored) |

Tiering the analyst to a smaller model — the obvious fix for contention — made it dramatically *worse*,
because Ollama holds one model at a time unless `OLLAMA_MAX_LOADED_MODELS` is raised on the daemon, and a
model swap costs far more than the contention it was avoiding. So **scheduling is deployment-aware**:
hosted providers run the analyst concurrently (separate infra, concurrency genuinely free); a single local
Ollama defers it until the audio is out. Both keep it off the critical path; only the contention differs.

### Other decisions folded in
- **Stateless brain** — dropped Gemini's server-side `previous_interaction_id` for a caller-owned
  transcript. This is **#5's deferred refactor, now done**: three adapters (openai · gemini · ollama)
  behind one seam, persona outside the adapters. It's also the precondition for context engineering —
  you cannot compact, re-rank, or inject retrieved memory into a context window the provider hides.
- **Gemini thinking budget bounded to 128.** It burned a measured 462 thought tokens on a 7-token reply,
  all dead air. Budget `0` is **rejected** by `gemini-3.6-flash` (400 INVALID_ARGUMENT, verified by
  bisect) — it can bound reasoning, not disable it.
- **Guardrail on structured output.** A 4/10 answer returned `nextMove: "go_deeper"`, compiling into a
  directive that told the interviewer the candidate did well. When two fields of an LLM's JSON
  contradict each other, the score wins. Don't trust structured output against other available signal.
- **Client schedules audio on the AudioContext clock** rather than chaining `onended`, which inserted an
  audible gap between every sentence.
- **Barge-in** stops scheduled-but-unstarted sources too — by the time a user interrupts, several
  sentences may already be queued into the future — and aborts the request so the server stops generating.
- **`voice.ts` now throws** instead of returning a `Response` from its catch, which had forced callers to
  `instanceof`-sniff the result. (Flagged twice before; fixed now that the orchestrator depends on it.)

### Open / owed
- **OpenAI is wired but unverified** — the key in the environment is rejected (`sk-svcac…`, a service
  account key). Everything above was measured on **Ollama**. Numbers on a hosted provider will differ,
  and the concurrent-analyst path in particular has never run.
- **The client has not run in a browser.** It typechecks and builds; the server pipeline is verified end
  to end by curl. The Chrome extension was unavailable to drive a real page.
- Human-speech WER eval for STT still owed from #6.

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
