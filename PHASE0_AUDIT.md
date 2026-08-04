# Phase 0 — Codebase Audit (keep / gut / rebuild)

> File-by-file decision map for converting the legacy MimiChat repo into **Dry Run**.
> Companion to `DRY_RUN.md`. Nothing here is deleted until you approve **and** the DB decision
> (Firebase vs Supabase, §Conditional) is made. Everything remains recoverable from git history.

## Snapshot
- **257 tracked files, ~110 MB.** ~95 MB is dead weight we remove in Phase 0.
- Biggest offenders: **5 duplicate copies** of the 15 MB `emHdBindings.wasm` (USD viewer) = ~75 MB, plus `.fbx/.obj/.usd` avatar source (~12 MB), `mimichat.mp4` (2.2 MB), HDRIs, and a junk file literally named `{filename}`.
- After gutting: repo drops to a few MB of actual app code.

---

## 🟥 GUT — delete (dead, incompatible, or platform-locked)

### A. USD + Audio2Face rendering engine (the whole reason for the pivot)
- `usd/` (entire dir — 33 files, incl. `src/bindings/emHdBindings.{wasm,data,js,worker.js}`, `src/hydra/*`, `create.three.js`, examples)
- `public/usd/` (duplicate copy — 33 files)
- `public/usdviewer-forapi/` (another full copy + `mimichat-usd-viewer.zip`, 8.8 MB)
- `src/usdLoader.ts`, `src/components/AvatarCanvas.tsx` (stub), `usd-typings.d.ts`
- `public/index.html`, `public/index.js` (196 KB), `public/index2.html`, `public/index2.js`, `public/index3.html`, `public/index4.html`, `public/modules/es-module-shims@1.8.0.js`
- `test_frame.html`

### B. Python services (all localhost/Windows/GPU-bound)
- `scripts/audio2faceapi.py` (NVIDIA A2F — can't run on Mac)
- `scripts/murftts.py`, `scripts/tts.py`, `scripts/tts11labs.py` (Flask TTS on `:5001`)
- `scripts/usdcomp_server.py` (USD↔GLB WebSocket on `:5000`)

### C. Standalone Node servers / cron
- `mimichat-api.js` (Express public API on `:4000`; also has a broken key-schema)
- `presencetracker.js` (socket.io presence — deferred feature)
- `sendUnreadEmails.js` (SendGrid digest cron — deferred feature)

### D. Legacy API routes (Pages Router — all tied to the dead pipeline)
- `pages/api/audio2face.ts` (A2F HTTP calls to `:8011`, `D:\` paths)
- `pages/api/generate-video.ts` + `utils/renderUtils.ts` + `utils/a2fQueue.ts` (Puppeteer/ffmpeg render, `D:\chat-avatar-app\...`)
- `pages/api/next.ts` (Flask TTS proxy), `pages/api/convert.ts` (USD→GLB WS to `192.168.31.80`)
- `pages/api/list-audios.ts` (reads `public/audio/downloaded`)
- `pages/api/telegram.ts` (Telegram bot — deferred)
- `utils/internal.js`

### E. Payments + Mongo (deferred; also carries the ₹10k-vs-₹1k bug)
- `pages/api/create-order.ts`, `pages/api/verify-payment.ts`, `pages/api/route.ts`
- `src/app/premium/page.tsx`, `src/app/docs/page.tsx`
- `src/models/ApiKey.ts`, `src/models/Payment.ts`, `src/lib/mongo.ts`

### F. Binary assets (avatars/media we won't reuse)
- `batman.fbx`, `ishowspeed.fbx`, `ishowspeed.obj`, `ishowspeed.mtl`, `ishowspeed2.obj`, `ishowspeed2.mtl`, `ishowspeedroot.fbx`, `untitledmale.fbx`, `untitledfemale2.fbx`, `jaw.usdc`
- `public/avatar.glb`, `public/avatar1.glb` (⚠️ inspect first — see §Investigate)
- `public/batman.jpeg`, `public/speed.jpeg`, `public/pinki.jpeg`, `public/raju.png`, `public/mimichat.mp4`
- `public/environments/*.hdr`, `textures/color_121212.hdr`, `.thumbs/`
- `output_audio.mp3`, `{filename}` (junk), `public/ARKit_Glyph.svg`

### G. Deploy/infra config for the old topology
- `nginxforaws.txt`, `firebase.json` (functions/mimichat-api codebases), `.firebaserc` (revisit if we keep Firebase), `middleware.ts` (no-op)

---

## 🟩 KEEP — reuse / adapt

- **Build config:** `package.json` (prune deps — see below), `tsconfig.json`, `next.config.ts` (simplify), `postcss.config.mjs`, `eslint.config.mjs`, `tailwind.config.ts`, `.gitignore`
- **App shell:** `src/app/layout.tsx`, `src/app/globals.css`, `src/app/favicon.ico`
- **Auth/onboarding flow (adapt):** `src/app/login/page.tsx`, `src/components/LoginPageClient.tsx`, `src/app/choose-username/page.tsx`, `src/components/ChooseUsernameForm.tsx` — *only if we stay on Firebase; otherwise rebuild for Supabase auth*
- **Landing:** `src/app/page.tsx` (restyle for Dry Run), static legal pages (`privacy-policy`, `terms-and-conditions`, `refund-policy`, `delivery-policy`, `contact-us`) — keep, low effort
- **Analytics:** `src/components/PageTracker.tsx` (harmless)
- **Type shims:** `src/types/*.d.ts` (keep `canvas-confetti`; drop `aframe-react`)

## 🟦 REBUILD — new for Dry Run
- **Session UI** (replaces `ChatPage.tsx`/`ChatList.tsx`/`home`/`share`/`chat/[id]`/`view`/`demo`/`search`): interviewer avatar + push-to-talk mic + code editor (Monaco) + live composure meter + debrief card.
- **Avatar renderer:** three.js GLB + browser viseme lip-sync (`@react-three/fiber`, `@react-three/drei`, a lip-sync lib).
- **API routes / services:** STT, TTS (behind an interface), agent brain (Claude via `@anthropic-ai/sdk`), memory service, judge scoring, Reflexion loop, code-execution, eval harness.
- **Python ML repo/notebooks:** SER model + judge model training (separate, runs on Colab/Kaggle).

## 🗑️ package.json deps to remove
`aframe`, `aframe-react`, `three`↔keep (needed), `puppeteer`, `razorpay`, `@stripe/*`, `stripe`, `mongoose`, `socket.io`, `socket.io-client`, `ws`, `@sendgrid/mail`, `nodemailer`, `@google-cloud/text-to-speech` (unless Google TTS chosen), `formidable`, `express`, `https`, `fs`, `util`, `p-queue`, `node-fetch`, `firebase-admin`/`firebase-functions` (unless kept), `aframe`.
**Add later:** `@anthropic-ai/sdk`, `@react-three/fiber`+`drei` (kept), a lip-sync lib, `@supabase/supabase-js` (if Supabase), `monaco-editor`/`@monaco-editor/react`, STT/TTS client libs.

## 🔍 Investigate before deleting
- `public/avatar.glb` (308 KB) / `public/avatar1.glb` — **check for ARKit/Oculus viseme morph targets.** If present, they may be reusable Dry Run avatars and save us sourcing new ones. (Quick three.js/gltf inspection.)

## 🟨 Conditional — depends on the DB decision
If we **keep Firebase**: keep `src/firebase/config.ts`, `src/firebase/auth.ts`, the login/username flow, and `firebase` dep.
If we **move to Supabase**: gut all of the above and rebuild auth on `@supabase/supabase-js`; drop `firebase*` deps.
