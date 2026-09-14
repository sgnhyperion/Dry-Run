"""Dry Run — local ML service.

Hosts the small self-hosted models the app depends on. Today: Kokoro TTS (voice out)
and faster-whisper STT (voice in). Phase 2-4 add embeddings, the SER model, and the judge
here too — same process, same pattern.

THE PATTERN: every model is loaded ONCE at module import, never per request. Cold-starting a
model on the hot path would dominate latency and make the whole thing useless for conversation.
Boot is slow (~20s) so that requests are fast.

Run:  .venv/bin/uvicorn server:app --port 8000
"""

import io
import os
import time

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException, Request
from faster_whisper import WhisperModel
from kokoro import KPipeline
from pydantic import BaseModel
from fastapi.responses import Response

app = FastAPI(title="Dry Run ML service")

# ── TTS: Kokoro-82M ──────────────────────────────────────────────────────────
SAMPLE_RATE = 24000
pipeline = KPipeline(lang_code="a")

# ── STT: faster-whisper ──────────────────────────────────────────────────────
# small.en is the accuracy/latency sweet spot on Apple silicon CPU for interview speech
# (technical jargon punishes tiny/base). Override with WHISPER_MODEL=base.en for more speed.
# int8 = quantized CPU inference; ctranslate2 has no Metal/MPS backend, so CPU is the only option.
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small.en")
whisper = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")


class TTSRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    """Cheap liveness probe — lets the Next.js side tell 'server down' from 'model broke'."""
    return {"ok": True, "tts": "kokoro-82M", "stt": WHISPER_MODEL}


@app.post("/tts")
def tts(req: TTSRequest):
    buf = io.BytesIO()
    audio_data = pipeline(req.text, voice="af_heart")

    chunks = [audio for _, _, audio in audio_data]
    if not chunks:
        raise HTTPException(status_code=500, detail="Kokoro produced no audio")

    full = np.concatenate(chunks)
    # format="WAV" is required: there's no filename here for soundfile to infer the container from.
    sf.write(buf, full, SAMPLE_RATE, format="WAV")
    buf.seek(0)
    return Response(content=buf.read(), media_type="audio/wav")


@app.post("/stt")
async def stt(request: Request):
    """Raw audio bytes in → transcript out.

    Takes the body as raw bytes rather than multipart/form-data on purpose: it skips the
    python-multipart dependency and one round of encoding, and the browser's MediaRecorder
    Blob can be POSTed directly. PyAV (bundled with faster-whisper) demuxes whatever container
    the browser chose — webm/opus on Chrome, mp4 on Safari — so we don't have to care.
    """
    raw = await request.body()
    if not raw:
        raise HTTPException(status_code=400, detail="empty audio body")

    started = time.perf_counter()
    # vad_filter drops leading/trailing silence, which push-to-talk recordings are full of —
    # it cuts latency and stops Whisper hallucinating text into dead air.
    segments, info = whisper.transcribe(
        io.BytesIO(raw),
        language="en",
        beam_size=1,          # greedy: ~2x faster than beam search, negligible WER cost here
        vad_filter=True,
    )
    # segments is a lazy generator — transcription only actually runs as it's consumed.
    text = "".join(seg.text for seg in segments).strip()
    elapsed = time.perf_counter() - started

    return {
        "text": text,
        "audio_seconds": round(info.duration, 2),
        "transcribe_seconds": round(elapsed, 3),
        "rtf": round(elapsed / info.duration, 3) if info.duration else None,
    }
