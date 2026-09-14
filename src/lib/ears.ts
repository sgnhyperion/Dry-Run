// Voice IN. The mirror of voice.ts: one seam function, one provider behind it.
// Swapping faster-whisper for Deepgram/AssemblyAI later is a one-file change.

const STT_URL = "http://127.0.0.1:8000/stt";

/**
 * Raw recorded audio → transcript.
 *
 * `mimeType` is passed straight through from MediaRecorder (webm/opus on Chrome,
 * mp4 on Safari). PyAV on the server demuxes either, so we don't normalise here.
 */
export async function speechToText(audio: ArrayBuffer, mimeType: string): Promise<string> {
  let res: Response;

  // fetch() THROWS on a dead daemon rather than returning !res.ok — so an !res.ok guard
  // alone would miss "server isn't running", the single most likely failure in local dev.
  // Both cases have to be handled. (Same gap flagged in decisions.md #5 for voice.ts.)
  try {
    res = await fetch(STT_URL, {
      method: "POST",
      headers: { "Content-Type": mimeType },
      body: audio,
    });
  } catch (cause) {
    throw new Error(
      "STT service unreachable — is the ML server running on :8000? (cd tts-server && .venv/bin/uvicorn server:app --port 8000)",
      { cause },
    );
  }

  if (!res.ok) {
    throw new Error(`STT failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { text: string; rtf: number | null };
  return data.text;
}
