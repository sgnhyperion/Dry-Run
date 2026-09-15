# Dry Run

An **affective, self-improving AI technical interviewer** you talk to — voice, a 3D avatar face, and a brain
that remembers you, reads your composure from your voice, and scores your answers.

- **Architecture, thesis, roadmap** → [`DRY_RUN.md`](DRY_RUN.md)
- **Where we are right now** → [`docs/PROGRESS.md`](docs/PROGRESS.md)
- **Every tool choice + the evidence behind it** → [`docs/decisions.md`](docs/decisions.md)

> **Status:** streaming, pipelined voice turns with multi-agent orchestration.
> **Speak → STT → streaming LLM → sentence-chunked TTS → the avatar speaks while the model is still
> writing.** Measured **3.13× faster** time-to-first-audio than the blocking pipeline.

## How a turn works

```
mic ──► /api/stt ──► /api/turn ──► SSE ──► browser
                        │
                        ├─ interviewer  (critical path)  stream tokens
                        │      └─ sentence chunker ──► TTS per sentence ──► audio, in order
                        │
                        └─ analyst      (off critical path)  scores the answer,
                               compiles a directive that steers the NEXT turn
```

The stages **overlap**: a sentence is synthesized the moment it's complete, while the model keeps
writing the next one. Time-to-first-audio stops scaling with reply length.

| | sequential | pipelined | speedup |
|---|---|---|---|
| short ack | 3110 ms | **784 ms** | 3.97× |
| normal answer | 2055 ms | **546 ms** | 3.76× |
| long multi-part reply | 5686 ms | **3398 ms** | 1.67× |

`node scripts/bench-latency.mjs` reproduces this — it A/Bs both strategies through identical code via
a `mode` flag, so the delta is attributable to the pipelining. Full reasoning in `docs/decisions.md` #7.

---

## Running it

Dry Run needs **two processes**: the Next.js app, and the local ML service that gives the interviewer a
voice and ears. **The app degrades without the ML service** — the brain still answers in text, but `/api/tts`
and `/api/stt` fail, so the avatar stays silent and the mic button won't work.

### 1. The ML service (terminal 1)

One FastAPI process on `127.0.0.1:8000` hosting both self-hosted models:

| Endpoint | Model | Does |
|---|---|---|
| `POST /tts` | [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) | text → speech (voice out) |
| `POST /stt` | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) `small.en` | speech → text (voice in) |
| `GET /health` | — | liveness — tells "server down" from "model broke" |

Phases 2–4 add embeddings, the SER model, and the judge to this same service. Both URLs are currently
hardcoded in `src/lib/voice.ts` and `src/lib/ears.ts`.

```bash
cd tts-server
.venv/bin/uvicorn server:app --port 8000
```

Wait for `Application startup complete.` — **both** models load at **import** time (deliberately: warm
inference, no cold start on the hot path), so first boot takes ~20 s. Torch prints two harmless deprecation
warnings. Set `WHISPER_MODEL=base.en` to trade STT accuracy for speed.

Verify it independently of the app — this round-trips a sentence through TTS and back through STT, so a clean
pass means both models are healthy:

```bash
curl -s http://127.0.0.1:8000/health
curl -s -o /tmp/tts.wav http://127.0.0.1:8000/tts \
  -H 'Content-Type: application/json' -d '{"text":"What is the time complexity of your solution?"}'
curl -s -X POST http://127.0.0.1:8000/stt \
  -H 'Content-Type: audio/wav' --data-binary @/tmp/tts.wav
```

Expect the transcript to come back matching the sentence you sent, with `rtf` around 0.25–0.4.

<details>
<summary><strong>First-time setup</strong> (the <code>.venv</code> is gitignored, so a fresh clone needs this)</summary>

```bash
brew install espeak-ng          # phonemizer backend — Kokoro won't run without it
cd tts-server
uv venv --python 3.12           # 3.12 is pinned: PyTorch had no 3.14 wheels
uv pip install -r requirements.txt
```

The first call to each endpoint downloads that model's weights to `~/.cache/huggingface`; every run after
that is fully offline. `try_kokoro.py` is a standalone sanity script that writes WAVs to disk, bypassing the
server.
</details>

### 2. The Next.js app (terminal 2)

```bash
pnpm install
pnpm dev
```

Then open:

| Route | What it is |
|---|---|
| [`/`](http://localhost:3000/) | Landing placeholder |
| [`/studio`](http://localhost:3000/studio) | The VRM avatar alone + a mic button — lip-syncs **your** voice |
| [`/interview`](http://localhost:3000/interview) | The real loop — **type or hit the mic to speak**; the avatar answers aloud |

API routes: `POST /api/interview` (the brain) · `POST /api/tts` (voice out) · `POST /api/stt` (voice in).

**Using the mic:** click it once to start recording, once again to stop — it transcribes and sends
automatically. Click the mic (or **Interrupt**) while it's talking to barge in.

### Before a live demo

1. **Start both processes** and open `/interview` **at least a minute early.** The page fires
   `/api/warmup` on mount, which preloads the model — from cold that takes ~35 s, and you want it
   spent on page load rather than on your first question.
2. **Check the model is resident:** `curl -s localhost:11434/api/ps` should list `qwen2.5:14b`.
   `keep_alive` holds it for 30 min; if you idle longer than that, reload the page to re-warm.
3. **Don't run `pnpm build` or start a second model** — either can evict it and cost you a 30-60 s
   stall mid-demo.

Warm, 6 consecutive turns measured 1031–2189 ms to first audio.

---

## Environment

```bash
cp .env.example .env.local     # then fill in GEMINI_API_KEY
```

The brain is provider-agnostic — three adapters behind one streaming seam, picked by one env var:

```bash
BRAIN_PROVIDER=openai   # OPENAI_API_KEY  (+ optional OPENAI_MODEL)
BRAIN_PROVIDER=gemini   # GEMINI_API_KEY
BRAIN_PROVIDER=ollama   # nothing — local, $0, no quota. Needs `ollama serve`.
```

`ollama` is the default for local work because this project has hit **three** free-tier walls
(`decisions.md` #3, #4, #7). `.env.example` documents every variable and the phase that reads it.

> ⚠️ **OpenAI is wired but unverified.** The key currently in the environment is rejected by the API
> (`sk-svcac…`, a service-account key). Every number on this page was measured on Ollama. Drop a working
> key into `.env.local` and set `BRAIN_PROVIDER=openai` to try it.

---

## Gotchas that will cost you time

- **Package manager is `pnpm`, never `npm`.** Mixing them produced an ERESOLVE + lockfile mess.
  `pnpm-lock.yaml` is the truth; delete any stray `package-lock.json`.
- **Env is a snapshot read at server start.** Edit `.env.local` → **restart `pnpm dev`**, or your change is
  silently ignored.
- **`reactStrictMode: false` is load-bearing**, not laziness. Strict Mode double-mounts; combined with
  Suspense that made react-three-fiber create→dispose→recreate the WebGL context and crash the tab.
  See "Accepted tradeoffs" in `docs/decisions.md`.
- **Don't add `useGLTF.preload`** for the avatar — it caches by URL *without* `VRMLoaderPlugin`, so the real
  load silently gets a pluginless glTF (`userData.vrm === undefined`).
- **`three` is pinned to `0.180.0`** to match `@pixiv/three-vrm` 3.5.5's tested version. Don't float it.
- **Swapping the avatar:** drop a VRoid Studio export over `public/avatar.vrm`. It must carry viseme morph
  targets (`aa/ih/ou/ee/oh`) or lip-sync silently does nothing.
- **The mic needs `localhost` or HTTPS.** `getUserMedia` is blocked on plain-HTTP origins, so reaching the dev
  server over your LAN IP will silently fail to record.
- **Don't run `pnpm build` while `pnpm dev` is running.** It overwrites `.next` underneath the dev server
  and every route starts 500ing with `MODULE_NOT_FOUND`. Stop dev, or `rm -rf .next` and restart.
- **Ollama holds one model at a time** unless you raise `OLLAMA_MAX_LOADED_MODELS` on the daemon. Pointing
  the analyst at a *different* model therefore forces an evict-and-reload — one turn stalled **56 seconds**
  before this was understood. That's why the analyst shares the main model locally (`decisions.md` #7).
