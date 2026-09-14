/**
 * Streaming sentence chunker — the single biggest latency lever in the pipeline.
 *
 * THE PROBLEM. Naively, a voice turn is strictly sequential:
 *     STT → [wait for the WHOLE reply] → [synthesize the WHOLE reply] → play
 * so time-to-first-audio = full LLM time + full TTS time. On a 3-sentence reply that's dead air
 * measured in seconds, and dead air is what makes a voice agent feel broken.
 *
 * THE FIX. Cut the token stream into speakable units the instant each one is complete, and
 * synthesize it while the model is still writing the next one. Time-to-first-audio collapses to
 *     LLM time-to-first-SENTENCE + TTS of that one short sentence
 * which is near-constant no matter how long the full reply runs.
 *
 * FIRST CHUNK IS SPECIAL. It's the only one the user actually waits on — every later chunk is
 * synthesized behind already-playing audio and is effectively free. So the first chunk is cut
 * aggressively (at a clause boundary, or any word boundary past a threshold) while later chunks
 * wait for real sentence ends, which sound better. Trading prosody for latency exactly once,
 * where it's the only thing that matters.
 */

const SENTENCE_END = /[.!?]/;
const CLAUSE_END = /[,;:—–]/;

/** Periods that don't end a sentence — splitting on these would mangle the speech. */
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st",
  "e.g", "i.e", "etc", "vs", "approx", "fig", "no",
]);

/** First chunk: don't cut shorter than this — one-word audio sounds like a glitch. */
const FIRST_MIN_CHARS = 25;
/**
 * First chunk: past this, cut at the next word boundary regardless of punctuation.
 * Measured tuning — at 70 this split "…how consistency models work in distributed" / "systems.",
 * which sounds broken. Most opening sentences land under 100, so 100 keeps the safety valve for a
 * genuinely run-on preamble while almost never firing mid-phrase. Costs ~250ms of TTFA in the worst
 * case (Kokoro RTF ~0.1) and buys back intelligibility, which is the thing the user actually judges.
 */
const FIRST_MAX_CHARS = 100;
/** Later chunks: bound TTS time per chunk so one run-on sentence can't stall the queue. */
const MAX_CHARS = 220;
/**
 * Minimum length for a NON-first chunk. A stray "systems." as its own utterance sounds choppy and
 * wastes a whole TTS round-trip. The first chunk is exempt: there, short is a feature — it's the
 * only chunk the user waits on, so getting *anything* speakable out fast wins.
 */
const MIN_CHUNK_CHARS = 15;

function endsSentence(buf: string, i: number): boolean {
  if (!SENTENCE_END.test(buf[i])) return false;

  // Needs whitespace after it, or we can't know the sentence is finished yet.
  const next = buf[i + 1];
  if (next !== undefined && !/\s/.test(next)) return false;

  // "3.5" / "v1.2" — a digit on both sides means it's a decimal, not a full stop.
  if (buf[i] === "." && /\d/.test(buf[i - 1] ?? "") && /\d/.test(next ?? "")) return false;

  // "Dr." / "e.g." — check the word immediately before the period.
  const word = buf.slice(0, i).split(/\s+/).pop()?.toLowerCase() ?? "";
  if (ABBREVIATIONS.has(word)) return false;

  // A lone initial ("J. Smith") isn't a sentence end either.
  if (buf[i] === "." && word.length === 1 && /[a-z]/i.test(word)) return false;

  return true;
}

export class SentenceChunker {
  private buf = "";
  private count = 0;

  /** Feed a token delta; get back any chunks that are now complete and speakable. */
  push(delta: string): string[] {
    this.buf += delta;
    const out: string[] = [];

    for (;;) {
      const cut = this.findCut();
      if (cut < 0) break;
      const chunk = this.buf.slice(0, cut).trim();
      this.buf = this.buf.slice(cut);
      if (chunk) {
        out.push(chunk);
        this.count++;
      }
    }
    return out;
  }

  /** Call when the stream ends — emits whatever is left over. */
  flush(): string | null {
    const rest = this.buf.trim();
    this.buf = "";
    if (rest) this.count++;
    return rest || null;
  }

  /** Index to cut at (exclusive), or -1 if nothing is ready yet. */
  private findCut(): number {
    const isFirst = this.count === 0;

    for (let i = 0; i < this.buf.length; i++) {
      // Non-first chunks refuse to cut so short they'd sound clipped — keep accumulating instead.
      const longEnough = isFirst || i + 1 >= MIN_CHUNK_CHARS;

      if (endsSentence(this.buf, i) && longEnough) return i + 1;
      // Only the first chunk is allowed to break at a clause boundary.
      if (isFirst && i >= FIRST_MIN_CHARS && CLAUSE_END.test(this.buf[i])) return i + 1;
    }

    // No punctuation available — fall back to a word boundary once the buffer is long enough.
    const limit = isFirst ? FIRST_MAX_CHARS : MAX_CHARS;
    if (this.buf.length >= limit) {
      const space = this.buf.lastIndexOf(" ", limit);
      if (space > 0) return space + 1;
    }

    return -1;
  }
}
