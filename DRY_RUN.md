# Dry Run — Master Design Doc

> **Living context document.** This is the single source of truth for the Dry Run project:
> its purpose, rationale, architecture, decisions, and roadmap. Keep it updated as we build.
> Last major update: 2026-08-04.
>
> **⚠️ IMPORTANT — Working mode (2026-08-06): MENTOR, not intern.** Harsh writes all implementation code
> from here on. Claude guides only — explain concepts, give the approach/mental model, point to APIs/papers,
> review and debug his code, unblock. Claude does **not** write or edit implementation code unless Harsh
> explicitly asks for a specific piece. (Docs/memory upkeep by Claude is fine.)

---

## 0. TL;DR (read this first)

**Dry Run** is a general-purpose **affective, self-improving voice-agent engine**, shipping with one
flagship scenario: an **AI technical interviewer** you can talk to (voice + a 3D avatar face) that:

1. **Remembers you** across sessions (implements the *Generative Agents* memory architecture).
2. **Reads your composure** from your voice in real time (a **speech-emotion model we train**), and turns
   that + implicit signals into a **reward signal**.
3. **Runs real coding interviews** with *verifiable* scoring (run tests, complexity analysis) via a
   **judge/reward model we train**.
4. **Self-improves** its own interviewing (implements *Reflexion*-style verbal self-critique).
5. **Proves it works** via an **eval harness** answering a real research question with data + graphs.

It replaces the original project's Windows/GPU-only NVIDIA Audio2Face pipeline with a **Mac-native,
cloud-agnostic, free-tier-deployable** stack: **GLB avatar + browser-side lip-sync + Claude brain + hosted/
self-hosted TTS**.

**Why this project:** maximize applied-AI depth and resume signal for innovative AI companies —
by *implementing research papers*, *training real models*, and *measuring a research question*, not by
gluing together API calls.

---

## 1. Origin & pivot rationale

### 1.1 What the codebase was ("MimiChat")
A Next.js 15 app for **3D-avatar messaging**: users typed text → it was turned into a talking 3D avatar
(voice + facial animation) and sent as a chat message or a shareable video link. It had:

- 1:1 chat + guest "share" mode + a Telegram bot.
- A nascent paid developer API (Razorpay INR subscription → API key → `POST /generate`).
- Firebase (Auth, Firestore, Analytics, Storage) for chat; MongoDB/Mongoose for API keys + payments.

### 1.2 Why the original core is dead-on-arrival for us
The entire "talking avatar" feature depended on **NVIDIA Audio2Face** — a **GPU-only, Windows/Linux**
service (the `127.0.0.1:8011` calls) that converts audio → USD facial-animation files.

- **A2F cannot run on a Mac or a free-tier cloud VM.** There are no A2F weights in the repo and none we
  can obtain. The pipeline is already 100% non-functional for us.
- The only USD animation files that ever existed were generated on the original owner's Windows box and
  served from `mimichat.space`. **We have the code, not those servers or files.** No back-catalog to preserve.
- The original avatars are `.fbx`/`.usd` (Batman, iShowSpeed, Raju, Pinki) — they don't carry to a browser
  engine without manual re-rigging regardless.
- The repo is riddled with hardcoded Windows paths (`D:\chat-avatar-app\...`), localhost Flask/A2F services,
  a `192.168.31.80` WebSocket, and three duplicate copies of a 23 MB WASM USD viewer.

**Conclusion:** we don't "fix" the A2F pipeline — we *replace* it. Nothing currently working is lost.

### 1.3 Why the pivot to an AI-agent product
- The original app needs **two humans online at once** to be interesting (hence presence server, matchmaking,
  email digests). An **AI-agent** version is **self-contained** — compelling with a single user.
- The **3D avatar is graphics engineering, not AI engineering.** For a resume aimed at AI companies,
  the avatar must be a *thin presentation layer*, and the AI system must be the star.
- User's explicit goals: (a) genuinely useful/differentiated, (b) maximal learning in AI/LLMs/ML/agents,
  (c) a project that fascinates interviewers at innovative AI companies. → **Resume/interview impact is the
  primary bar.**

### 1.4 The differentiation principle (important)
"Memory / reflection / RAG / evals already exist in production agents" — true, and irrelevant. For a
portfolio, the bar is **depth + measurement + a sharp question + a clean story**, not novelty-to-the-world.
Differentiation comes from: a **novel combination**, a **specific concept**, **rigorous measurement of
something hard to measure**, and **answering a real question with data**. Dry Run's differentiation:
**emotion-as-implicit-reward → online self-improvement, measured with a trained judge + eval harness, in a
concept (a tech interviewer that remembers you and reads your stress) that any hiring engineer instantly gets.**

---

## 2. The thesis (the AI core)

> **An affective, self-improving voice agent that learns from your implicit feedback.**
> It remembers you (**Generative Agents** memory), senses your satisfaction/composure from your voice
> (a **speech-emotion model we train**), turns that into a **reward signal**, and uses it to self-critique
> and improve (**Reflexion**) — with a **trained judge/reward model** + an **eval harness** to prove whether
> it actually improves.

### Anchor papers
| # | Paper | Role in Dry Run |
|---|-------|-----------------|
| **#1** | **Generative Agents: Interactive Simulacra of Human Behavior** — Park et al., 2023 | Memory stream + retrieval (recency × importance × relevance) + reflection + planning. The interviewer's brain/memory. |
| **#3** | **Reflexion: Language Agents with Verbal Reinforcement Learning** — Shinn et al., 2023 | The agent verbally self-critiques its own interviewing and improves. |
| **#4** | **Speech Emotion Recognition** (fine-tune, e.g. wav2vec2 on RAVDESS/CREMA-D/IEMOCAP) | Reads composure/stress from the user's voice → reward signal + composure meter. |
| (opt) | **Moshi** — Kyutai, 2024 (full-duplex speech dialogue) | Inspiration for the optional Phase-6 barge-in / no-push-to-talk polish. |
| (bg) | RLHF / RLAIF, LLM-as-judge literature | Framing for the trained judge/reward model. |

---

## 3. Product concept

### 3.1 Positioning
- **Engine:** general, scenario-agnostic affective self-improving voice agent.
- **Flagship instance (v1):** the **AI technical (software-engineering) interviewer**.
- Other scenarios (visa interview, salary negotiation, hard-feedback conversation, etc.) become
  **scenario "packs"** on the same engine later.
- **Meta-narrative for interviews:** *"I built the AI interviewer to prepare for interviews like yours."*
- **Non-goal (explicit):** **NOT a general-purpose voice assistant / "Jarvis."** Generality lives in the
  *engine*, never the *positioning*. A general assistant has no bounded task → no reward signal, no judge
  model, no measurable self-improvement, no research question → it destroys the entire ML/RL/eval depth that
  makes this project resume-worthy, and it's the most generic AI project that exists. Breadth (a "general
  mode") is at most an optional late scenario-pack demo on the same engine — never the flagship or the thesis.

### 3.2 Future directions (parked — NOT v1, likely separate projects)
- **Cross-device action assistant** — an agent that connects to your devices/services and performs actions
  (via **tool use / MCP + device connectors**). Cooler than generic Jarvis, but a *different skill axis*
  (agent orchestration / distributed systems / permissioning + safety), not ML/RL/IR. Shares only Dry Run's
  voice+agent *engine*; none of the SER/judge/Reflexion/eval depth transfers (device actions are deterministic
  tool calls — no reward gradient, nothing to train or measure). Build it *after* Dry Run, as its own project;
  Dry Run's tool-use foundation carries forward. Do not let it scope-creep v1.

### 3.2 Why tech interview is the right flagship
- Specific and universally understood by the exact people who will hire the builder.
- **Verifiable scoring:** code can be *run against tests*; complexity is analyzable → the trained judge and
  eval graphs are far more rigorous than any fuzzy-conversation domain.
- **Composure under pressure** is a genuine part of interview performance → the emotion signal is
  load-bearing, not decorative.
- Rich, natural memory ("last time you brute-forced this; optimize it now", "you keep missing edge cases").

### 3.3 Concrete session loop
1. **Setup** — user gives context (target role/level, background). Seeds the agent's memory.
2. **Live voice session** — avatar = the interviewer (persona, voice, face). User speaks (STT) → interviewer
   responds in-character (Claude + memory) → speaks back (TTS + facial expression). Adaptive follow-ups pulled
   **from memory**. Push-to-talk in v1 (barge-in later).
3. **Coding surface** — an editor; candidate talks through and writes code; **tests run** for verifiable
   correctness; complexity discussed.
4. **Live composure meter** — trained SER model reads anxiety/confidence from voice in real time; logs the trend.
5. **Debrief card** — **content score** from the trained judge (correctness, communication, optimality) with
   line-by-line feedback, + **composure graph** (did arousal drop across the session?).
6. **Across reps** — memory tracks recurring weak spots; the system optimizes so composure rises and content
   score improves. That trend **is** the reward signal *and* the eval metric.

### 3.4 MVP screen
Avatar + push-to-talk mic + code editor + live composure meter + post-session debrief card. Nothing else.

---

## 4. Technical architecture

### 4.1 High-level data flow (v1)
```
[User voice] --STT--> [transcript]
                          |
                          v
   [Agent brain: Claude] <----> [Memory (Generative Agents): vector store + reflection/planning]
        |         ^                         ^
        |         | reward / implicit feedback
        v         |
   [reply text] --TTS--> [audio] --browser viseme lip-sync--> [GLB avatar speaks + emotes]
                          |
   [User voice] --SER (trained)--> [composure/arousal] --+--> reward signal
   [code] --run tests--> correctness ---------------------+
                          |
                          v
   [Judge/reward model (trained)] --> content score --> [Debrief card]
                          |
                          v
   [Reflexion loop] --self-critique--> improved interviewing
                          |
                          v
   [Eval harness] --> metrics, ablations, research graphs
```

### 4.2 Components ↔ responsibilities
- **Front-end (Next.js/React/Tailwind/TS):** session UI, avatar canvas, mic capture, code editor, debrief.
- **Avatar (three.js + GLB):** Ready Player Me avatar; **browser-side viseme lip-sync** from TTS audio
  (e.g. `wawa-lipsync` or Oculus/ARKit visemes); emotion → blended facial pose + background cue.
- **STT:** speech → text (provider TBD — see §6).
- **Agent brain:** Claude (Anthropic API), latest model; system prompt = interviewer persona + policy;
  consumes retrieved memories, produces questions/follow-ups/hints/scoring rationale.
- **Memory (#1):** observation log → importance scoring → embedding + vector retrieval
  (recency × importance × relevance) → periodic reflection → planning. Persisted per user.
- **TTS:** text → audio (provider TBD — see §6).
- **SER model (#4, trained):** audio → emotion/arousal; real-time composure meter + reward.
- **Judge/reward model (trained):** (question, answer, code, test results) → quality score; validated vs human labels.
- **Reflexion (#3):** after a turn/session, the agent produces verbal self-feedback and updates its approach.
- **Eval harness:** offline + online metrics; ablations; the research result.
- **Storage/auth:** users, sessions, transcripts, memory, scores (DB choice TBD — see §6).

### 4.3 The models we train (the "real ML" component)
See **§5A** for the full breakdown (training, RL, retrieval). In short: **SER model** (wav2vec2/HuBERT
fine-tune) + **judge/reward model** (DeBERTa fine-tune, RLHF-adjacent) as core; optional **cross-encoder
re-ranker** and **domain-adapted embeddings**. Claude is the reasoning orchestrator, not a trained component.

---

## 5. Evaluation & the research question (resume centerpiece)

**Research question:**
> Does affective, memory-driven, *adaptive* rehearsal improve candidate performance and reduce measured
> anxiety **faster** than a static baseline (no memory, no adaptation, no affect)?

**Hypotheses:**
- **H1 (content):** adaptive+memory+affect condition raises content score / test-pass-rate faster across reps.
- **H2 (composure):** SER-measured arousal decreases across reps in the affect-aware condition.
- **H3 (self-improvement):** Reflexion-enabled interviewer produces better-calibrated difficulty/hints
  (measured) than the ablated version.

**Metrics:** content score (judge), test-pass rate (verifiable), composure/arousal trend, improvement rate
across sessions, difficulty-calibration error, hint-usefulness.

**Ablations / conditions:** full system vs. {no-memory, no-affect, no-Reflexion, static-baseline}.

**Deliverable:** a short write-up + graphs. This is the thing an interviewer stops to discuss.

---

## 5A. Where the real ML lives (training, RL, retrieval)

**Framing (the "am I just calling Claude?" answer): no.** Claude is the *reasoning orchestrator*
(dialogue, reflection, planning) — not something we train (it's an API). The genuine ML we build
*surrounds* it: perception, evaluation, retrieval, and control. Knowing *when to use a frontier LLM
vs. when to train a specialized model* is itself a strong interview signal.

### Models we train / fine-tune (supervised)
1. **SER model** — fine-tune wav2vec2/HuBERT on RAVDESS/CREMA-D/IEMOCAP → arousal/valence or discrete
   emotion. Genuine audio-transformer fine-tuning.
2. **Judge / reward model** — fine-tune a small encoder (DeBERTa/RoBERTa) on labeled answer quality →
   scalar quality/reward score. **Reward modeling — RLHF-adjacent.**
3. *(optional)* **Cross-encoder re-ranker** — fine-tune a MiniLM/BGE cross-encoder on our relevance labels
   (feeds the retrieval stack below).
4. *(optional)* **Domain-adapted embeddings** — contrastive fine-tune sentence-transformers on interview Q/A.

Training on free GPU (Colab/Kaggle); artifacts served by the Python FastAPI service.

### RL — realistically scoped, but real
Can't PPO-fine-tune Claude (API). Genuine RL that *is* buildable:
- **Reward model** (#2) = the learned reward signal.
- **Best-of-N / rejection sampling** — sample N candidate interviewer turns from Claude, score with the
  reward model, keep the best. Inference-time RL-style optimization.
- **Reflexion** — verbal RL: self-critique against the reward, improve.
- **Adaptive-difficulty controller as a contextual bandit / small policy** — pick next-question
  difficulty/strategy to maximize reward (composure↑ + performance↑) via ε-greedy / Thompson sampling or a
  small policy net. The cleanest "I built an online RL loop" story.
- **Out of scope (say so honestly):** full RLHF/PPO of a large policy net solo.

### Retrieval / RAG — the IR showcase
Two surfaces: (a) agent memory (Generative Agents), (b) optional domain RAG (question banks / CS concepts).
Both use one hybrid pipeline:
1. **Sparse — BM25 over an inverted index.** Caveat: true BM25 in Postgres needs ParadeDB `pg_search`
   (not on managed Supabase). At per-user memory scale, use **`rank_bm25` in the Python service** or
   **Postgres GIN full-text** (TF-IDF/cover-density, "BM25-ish"). OpenSearch/ParadeDB only if scale demands.
2. **Dense — pgvector + HNSW index** (HNSW = graph-based ANN → the "graph-based vector index").
3. **Fusion — Reciprocal Rank Fusion (RRF)** merges the two ranked lists.
4. **Re-ranking — cross-encoder** on top-k (trained model #3) → precision jump.
5. **Generative-Agents scoring** — final memory score = **relevance × recency (exp decay) × importance
   (LLM-scored)** (the paper's formula).

Full memory pipeline: `hybrid(BM25 + HNSW) → RRF → cross-encoder rerank → × recency × importance → top-k`,
evaluated with **recall@k / MRR / nDCG**. *Optional stretch:* **GraphRAG** (entity/relation extraction →
knowledge-graph retrieval) as a second graph-based mode beyond HNSW.

### Net: ML disciplines this project exercises
Audio ML (SER) · reward modeling / RLHF-adjacent (judge) · RL / bandits (best-of-N + controller + Reflexion)
· information retrieval (hybrid BM25+HNSW+RRF+cross-encoder) · LLM agent engineering (memory, orchestration).

---

## 6. Tech-stack decisions

### Decided
- **Framing/concept/thesis:** as above (locked).
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind (reuse existing scaffold).
- **Avatar:** **VRM** (authored in **VRoid Studio**) + three.js via `@pixiv/three-vrm` + **browser-side viseme
  lip-sync**. No USD, no A2F, no GPU. *(Pivoted from Ready Player Me — RPM shut down 2026-01-31; VRM also gives us
  standardized emotion presets that Phase 4 affect reuses. See phase-1.md for the sample model + versions.)*
- **LLM brain:** **Claude** (Anthropic API), latest model. (User has an Anthropic key.)
- **Gut the legacy A2F/USD/Windows stack** (see §7).
- **v1 feature scope:** core interview session + **shareable MP4 via in-browser MediaRecorder** (not Puppeteer).
- **Deploy:** build **cloud-agnostic (Docker + Next.js)**; run on Mac first; pick GCP/AWS free tier later.
- **DB / auth / vector store:** **Supabase** — Postgres + Auth + **pgvector (HNSW)** + storage in one; SQL
  fits the session/score/eval data and the memory retrieval. (Rewrite the small Firebase auth flow.)
- **Real-time voice:** **adopt a voice-agent framework now (Pipecat or LiveKit)** — streaming STT→LLM→TTS
  with VAD and barge-in from the start (not push-to-talk). The framework integrates the STT/TTS providers.
- **Retrieval stack:** hybrid **BM25 (inverted index) + pgvector/HNSW → RRF → cross-encoder rerank →
  recency×importance** (Generative Agents). See §5A.
- **Embeddings:** local **sentence-transformers** on the Python service → pgvector (Anthropic has no
  embeddings API). Voyage AI = hosted fallback.
- **Code execution:** **Piston** (free) for running candidate code against tests in v1.

### Pending (decide as we reach them)
- **TTS provider:** **Google Cloud TTS** (best Hindi/English, ~1M chars/mo free) vs **Kokoro** (Apache-2.0,
  no account, self-hosted). Pick by which the voice framework integrates cleanly; behind an interface either way.
- **STT provider:** whichever Pipecat/LiveKit integrates for *streaming* (Deepgram/AssemblyAI free tier, or
  self-hosted faster-whisper). Browser Web Speech is out — barge-in needs streaming.
- **LLM tiering:** Opus 4.8 for reflection/planning/judging; Sonnet 4.6 / Haiku 4.5 for latency-sensitive
  interactive turns + cheap memory-importance scoring (validate against the latency budget).
- **Deployment host:** GCP e2-micro / Cloud Run vs. AWS free tier — decide once it runs locally.
- **Avatar source:** Ready Player Me default vs. a custom-styled GLB.
- **BM25 backend:** `rank_bm25` (Python service) vs Postgres GIN full-text vs ParadeDB `pg_search` — decide
  at the retrieval phase by corpus size.
- **RL controller:** contextual bandit (ε-greedy/Thompson) vs a small policy net for adaptive difficulty.

---

## 7. Codebase audit: keep / gut / rebuild

> High-level map based on the full read of the repo. A precise file-by-file audit is **Phase 0**.

### Keep (reuse / adapt)
- Next.js app scaffold, `tsconfig`, `tailwind.config.ts`, ESLint/PostCSS config.
- `src/firebase/config.ts`, `src/firebase/auth.ts` — auth + Firestore (unless we move to Supabase).
- Login / choose-username flow (`login`, `choose-username`, `LoginPageClient`, `ChooseUsernameForm`) — adapt.
- General UI/layout patterns, `layout.tsx`, `globals.css`, `PageTracker` (analytics).
- `src/app/api/hinglish/route.ts` pattern (an LLM call route) — repurpose for the Claude brain, or drop.

### Gut (delete — incompatible or dead)
- **All USD / A2F / render infra:** `usd/`, `public/usd/`, `public/usdviewer-forapi/`, `src/usdLoader.ts`,
  `src/components/AvatarCanvas.tsx` (stub), `public/index*.html/js`, `usd-typings.d.ts`.
- `scripts/*.py` (audio2faceapi, murftts, tts, tts11labs, usdcomp_server).
- `pages/api/audio2face.ts`, `pages/api/generate-video.ts`, `pages/api/convert.ts`,
  `pages/api/list-audios.ts`, `pages/api/next.ts`, `pages/api/route.ts`.
- `utils/renderUtils.ts`, `utils/a2fQueue.ts`, `utils/internal.js`.
- `mimichat-api.js` (Express public API), `presencetracker.js`, `sendUnreadEmails.js`.
- Telegram: `pages/api/telegram.ts`. Payments: `create-order.ts`, `verify-payment.ts`, `premium` page,
  `src/models/Payment.ts`, `src/models/ApiKey.ts`, `src/lib/mongo.ts` (drop Mongo entirely for v1).
- Large binary avatar assets (`*.fbx`, `*.usd`, `*.glb`, `*.obj`, `*.mtl`, `*.hdr`, `mimichat.mp4`, `.thumbs/`)
  unless a specific one is reused.
- `nginxforaws.txt`, `firebase.json` functions config, `middleware.ts` (no-op).
- Note existing bug (for the record): `create-order` charges ₹10,000 while `Payment.amount` records ₹1,000 —
  moot once payments are gutted.

### Rebuild (new)
- Session UI (replaces chat UI): avatar canvas + mic + code editor + debrief.
- Avatar rendering: three.js GLB + browser viseme lip-sync.
- API routes / services: STT, TTS (behind interface), agent brain (Claude), memory service, judge scoring,
  Reflexion loop, eval harness.
- Python training repo/notebooks for the SER model and the judge model.

---

## 8. Credentials & environment (regenerate from scratch — no `.env` exists)

We will regenerate everything. Exact click-by-click steps provided per phase. Anticipated env vars:

```
# LLM brain
ANTHROPIC_API_KEY=

# Auth + DB (if staying on Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_MEASUREMENT_ID=
FIREBASE_ADMIN_KEY=            # if server-side admin needed

# --- OR, if we consolidate on Supabase ---
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

# TTS (if Google Cloud TTS)
GOOGLE_APPLICATION_CREDENTIALS=   # path to service-account JSON  (or GCP_TTS_KEY)

# STT (if a hosted provider)
# DEEPGRAM_API_KEY= / ASSEMBLYAI_API_KEY=

# Embeddings (memory retrieval), if hosted
# VOYAGE_API_KEY= / OPENAI_API_KEY= / GOOGLE_API_KEY=
```

Accounts likely needed: **Anthropic** (have key), **Firebase or Supabase**, **GCP** (if Google TTS),
optional STT/embeddings provider, **Colab/Kaggle** (free GPU for training the two models).

---

## 9. Roadmap (phases)

Each phase is independently demo-able and adds one resume-grade component.

- **Phase 0 — Make it run (Mac).** File-by-file audit; gut the dead stack (§7); real `.env`; regenerate creds;
  clean Next.js + auth + DB skeleton that builds and runs locally.
- **Phase 1 — Talking spine.** GLB avatar in three.js + browser viseme lip-sync; STT → Claude interviewer →
  TTS → avatar speaks. Push-to-talk. *Deliverable: talk to an AI interviewer with a face.*
- **Phase 2 — Memory (#1).** Implement Generative Agents memory stream (observation → importance → retrieval →
  reflection → planning) over a vector store. *Interviewer remembers you across sessions.*
- **Phase 3 — Coding substrate + trained judge.** Code editor; run tests (verifiable correctness); complexity;
  train + validate the judge/reward model; scored debrief card.
- **Phase 4 — Affect (#4).** Fine-tune the SER model; live composure meter; turn affect + implicit signals
  (re-asks, hesitation, correctness) into the reward.
- **Phase 5 — Self-improvement + evals (#3).** Reflexion loop; eval harness; **A/B adaptive+memory+affect vs.
  static baseline → the research result with graphs.**
- **Phase 6 — Polish + deploy.** Optional full-duplex/barge-in (Moshi flavor); shareable MP4 via MediaRecorder;
  Dockerize; deploy to GCP/AWS free tier; write-up/blog (the showcase artifact).

---

## 10. Resume / interview narrative

> "I built **Dry Run**, an AI technical interviewer you talk to — with a voice and a 3D face. Its brain is a
> faithful implementation of the **Generative Agents** memory architecture, so it remembers your past sessions
> and targets your weak spots. It reads your **composure from your voice** using a **speech-emotion model I
> fine-tuned**, turns that into a **reward signal**, and **self-improves** its interviewing via a **Reflexion**
> loop. I trained my **own judge model** (instead of LLM-as-judge) to score answers — with *verifiable*
> correctness because it runs your code against tests — and I built an **eval harness** to answer a real
> question: *does affect-aware, memory-driven adaptive rehearsal improve candidates faster than a static
> baseline?* Here are the graphs."

Covers: agents, LLM orchestration, retrieval, RLHF/reward modeling, applied ML (two trained models),
real-time systems (voice), evaluation, and a measured research result. Deployed and usable.

---

## 11. Open questions / to-decide log
- [ ] TTS provider (Google Cloud TTS vs Kokoro).
- [ ] STT provider (Web Speech vs Whisper vs hosted).
- [ ] DB/vector: stay Firebase vs consolidate on Supabase+pgvector.
- [ ] Embeddings provider for memory.
- [ ] Deployment host (GCP vs AWS).
- [x] Avatar source → **VRM / VRoid Studio** (RPM shut down 2026-01-31). Sample `public/avatar.vrm` for now.
- [ ] SER dataset (RAVDESS / CREMA-D / IEMOCAP) + label scheme (discrete vs arousal/valence).
- [ ] Judge-model base + how we produce human labels.
- [ ] Coding-execution sandbox (how we run candidate code safely).

## 12. References
- Park, J. S. et al. (2023). *Generative Agents: Interactive Simulacra of Human Behavior.*
- Shinn, N. et al. (2023). *Reflexion: Language Agents with Verbal Reinforcement Learning.*
- Défossez, A. et al. (2024). *Moshi: a speech-text foundation model for real-time dialogue.* (Kyutai)
- Speech Emotion Recognition datasets: RAVDESS, CREMA-D, IEMOCAP.
- Background: RLHF / RLAIF; LLM-as-judge literature.
