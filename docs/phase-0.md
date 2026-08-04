# Phase 0 — Make it run (clean skeleton)

**Status:** ✅ Done · **Dates:** 2026-08-04 → 2026-08-05

## Goal
Strip the legacy MimiChat codebase (Windows/GPU/Audio2Face-locked, dead for our setup) down to a clean,
Mac-native Next.js skeleton that builds and runs — the foundation for Dry Run.

## What we did
1. **Audited** all 257 tracked files → keep / gut / rebuild map (`/PHASE0_AUDIT.md`).
2. **Checked the existing GLBs** (`avatar.glb`, `avatar1.glb`) for reusability → both had **0 morph targets**,
   so unusable for viseme lip-sync. (Learning: browser lip-sync drives morph-target *blendshapes*; a mesh
   without them can't lip-sync. RPM avatars ship with the ARKit/Oculus viseme set — we'll use those in Phase 1.)
3. **Gutted ~232 files (~95 MB):** USD viewer + Audio2Face pipeline (incl. 5× duplicate 15 MB WASM blob),
   Python TTS/A2F/USD services, Express API + presence/email servers, all legacy `pages/api` routes, Mongo +
   payments, Firebase, Telegram, legacy chat UI, all `.fbx/.obj/.usd/.glb` avatars + media + old nginx config.
4. **Rewrote 4 files** to a lean baseline: `layout.tsx` (Dry Run metadata, no trackers), `page.tsx`
   (dependency-free placeholder), `package.json` (pruned to `next`+`react`+`react-dom` — add deps per phase),
   `next.config.ts` (emptied). Fixed a `globals.css` import-alias bug (`@/globals.css` → `@/app/globals.css`).
5. **Verified:** `npm run build` passes (7 static routes, no env vars needed); dev server renders the landing.

## Outcome
- 26 tracked files: clean Next.js 15 App Router skeleton + `DRY_RUN.md` + docs.
- Old code preserved in git history **and** in Harsh's separate GitHub repo.
- All work on `main` (the pivot branch was deleted per Harsh's preference).

## Key learnings
- Morph targets / blendshapes are the prerequisite for browser lip-sync.
- The `@/` path alias maps to `src/*` (see `tsconfig.json`), so `@/app/...` for anything under `src/app`.
- Dependency hygiene: keep `package.json` reflecting *actual* imports; add libs when a phase needs them.

## Artifacts
- `/PHASE0_AUDIT.md` — the file-by-file decision map.
- Commit: legacy purge + skeleton bootstrap on `main`.
