// Voice OUT. Mirror of ears.ts: one seam, one provider behind it.

const KOKORO_URL = process.env.KOKORO_TTS_URL || "http://127.0.0.1:8000/tts";

/**
 * Text → WAV bytes.
 *
 * THROWS on failure rather than returning a Response object. The old version returned
 * `new Response("Error…", {status:500})` from its catch, which forced every caller to
 * `instanceof Response`-sniff the result — and any caller that forgot got a Response where it
 * expected audio. A seam should have one return type and one failure channel.
 */
export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  let res: Response;

  // fetch() THROWS when the daemon is down and only returns !res.ok for HTTP errors.
  // Both have to be caught or "server isn't running" surfaces as an unhandled rejection.
  try {
    res = await fetch(KOKORO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (cause) {
    throw new Error(
      "TTS service unreachable — is the ML server running on :8000? (cd tts-server && .venv/bin/uvicorn server:app --port 8000)",
      { cause },
    );
  }

  if (!res.ok) throw new Error(`Kokoro TTS failed (${res.status}): ${await res.text()}`);

  return res.arrayBuffer();
}
