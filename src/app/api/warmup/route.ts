import { completeBrain } from "@/lib/brain";
import { textToSpeech } from "@/lib/voice";
import { warmMemory } from "@/lib/memory";

export const dynamic = "force-dynamic";

/**
 * Pre-load every model on the path so the first real turn isn't the one that pays for it.
 *
 * This exists because of a measured failure, not as a nicety. On a local Ollama the first request
 * after a model is evicted pays a full reload — 11.8s in one run, 56s in another when a second
 * model forced a swap. That cost lands on whichever turn happens to be first, which during a live
 * demo is the worst possible turn. Kokoro is already warm at import, but a tiny synth here also
 * proves the ML service is actually up before anyone clicks the mic.
 *
 * The interview page fires this on mount, so the model is resident by the time anyone speaks.
 * The Ollama adapter's keep_alive then holds it there.
 */
export async function POST() {
  const started = performance.now();
  const result: Record<string, unknown> = {};

  try {
    const t = performance.now();
    await completeBrain([{ role: "user", content: "hi" }], { maxTokens: 1 });
    result.brainMs = Math.round(performance.now() - t);
  } catch (error) {
    result.brainError = error instanceof Error ? error.message : "brain warmup failed";
  }

  try {
    const t = performance.now();
    await textToSpeech("Ready.");
    result.ttsMs = Math.round(performance.now() - t);
  } catch (error) {
    result.ttsError = error instanceof Error ? error.message : "tts warmup failed";
  }

  // The retrieval models load lazily on first search — measured at 9.6s cold vs ~15ms warm.
  // Retrieval sits on the critical path, so that load has to happen here, not on turn one.
  try {
    const t = performance.now();
    await warmMemory();
    result.memoryMs = Math.round(performance.now() - t);
  } catch (error) {
    result.memoryError = error instanceof Error ? error.message : "memory warmup failed";
  }

  result.totalMs = Math.round(performance.now() - started);
  return Response.json(result);
}
