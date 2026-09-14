import { completeBrain, type ChatMessage } from "@/lib/brain";

/**
 * Multi-agent orchestration.
 *
 * THE CORE IDEA: not every agent belongs on the latency-critical path.
 *
 * A voice turn has exactly one job that the user is waiting on — start talking. Anything else the
 * system wants to do (score the answer, decide difficulty, update a rubric) is valuable but nobody
 * is sitting in silence waiting for it. So the agents are split by *latency class*, not by topic:
 *
 *   INTERVIEWER  — critical path. Streamed, chunked, spoken. Every millisecond is audible.
 *   ANALYST      — off the critical path. Fired in parallel with the interviewer, its result
 *                  arrives whenever it arrives, and it steers the NEXT turn rather than this one.
 *
 * That split is what keeps the system smart without making it slow. Running the analyst
 * sequentially before the interviewer would have added its full latency to every single turn for
 * zero conversational benefit.
 *
 * The loop closes on the following turn: ANALYST → DIRECTIVE → INTERVIEWER. The analyst's verdict
 * is compiled into a short directive injected into the interviewer's context, so the conversation
 * adapts based on a judgement made while the previous answer was still being spoken.
 */

export type Analysis = {
  /** 0–10 on the answer just given. */
  score: number;
  /** What they demonstrated. One short phrase. */
  strength: string;
  /** What was missing or wrong. One short phrase. */
  gap: string;
  /** Where to take the next question. */
  nextMove: "go_deeper" | "ease_off" | "change_topic";
};

const ANALYST_PROMPT = `You evaluate a candidate's most recent answer in a technical interview.

Reply with ONLY a JSON object, no prose and no code fences:
{"score": <0-10 integer>, "strength": "<max 6 words>", "gap": "<max 6 words>", "nextMove": "go_deeper" | "ease_off" | "change_topic"}

Scoring: 0-3 wrong or empty, 4-6 partially correct, 7-8 solid, 9-10 excellent with nuance.
nextMove: "go_deeper" if they handled it well, "ease_off" if they struggled,
"change_topic" if the thread is exhausted either way.`;

/**
 * Score the latest answer. Deliberately NOT awaited on the voice path.
 *
 * Low temperature because a scorer that disagrees with itself run-to-run is not a scorer.
 */
export async function analyzeAnswer(messages: ChatMessage[]): Promise<Analysis | null> {
  // Only the tail matters for scoring one answer, and a shorter context is a faster one.
  const recent = messages.slice(-6);

  try {
    const raw = await completeBrain(recent, {
      system: ANALYST_PROMPT,
      temperature: 0.1,
      maxTokens: 120,
      // Small model on purpose — see BrainOptions.tier. Scoring one answer into four short
      // fields does not need the big model, and using it measurably slowed the voice path.
      tier: "fast",
    });
    return parseAnalysis(raw);
  } catch (error) {
    // The analyst is best-effort by design. If it fails, the conversation must not.
    console.error("analyst failed:", error);
    return null;
  }
}

/**
 * Models emit JSON wrapped in prose or fences no matter how firmly you ask them not to,
 * so extract the first balanced object rather than trusting the whole string to parse.
 */
function parseAnalysis(raw: string): Analysis | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    const score = Number(parsed.score);
    if (!Number.isFinite(score)) return null;

    const clamped = Math.max(0, Math.min(10, Math.round(score)));

    let nextMove: Analysis["nextMove"] =
      parsed.nextMove === "ease_off" || parsed.nextMove === "change_topic"
        ? parsed.nextMove
        : "go_deeper";

    // GUARDRAIL: don't trust an LLM's structured output when another field contradicts it.
    // Observed in testing: a 4/10 answer came back with nextMove "go_deeper", which compiles into
    // a directive telling the interviewer "they handled that well" about an answer that was wrong.
    // The score is the more reliable signal, so it wins. "change_topic" is left alone — it's a
    // judgement about the thread being exhausted, which is orthogonal to how well they did.
    if (nextMove === "go_deeper" && clamped <= 5) nextMove = "ease_off";
    if (nextMove === "ease_off" && clamped >= 8) nextMove = "go_deeper";

    return {
      score: clamped,
      strength: String(parsed.strength ?? "").slice(0, 60),
      gap: String(parsed.gap ?? "").slice(0, 60),
      nextMove,
    };
  } catch {
    return null;
  }
}

/**
 * Compile the analyst's verdict into a directive for the interviewer's next turn.
 *
 * This is the context-engineering surface: the interviewer never sees the raw analysis, only a
 * compact instruction derived from it. Keeping it short matters — it rides in the context window
 * of every subsequent turn, and tokens spent here are tokens not spent on the transcript.
 */
export function buildDirective(analysis: Analysis | null): string | null {
  if (!analysis) return null;

  const move = {
    go_deeper: "They handled that well. Push harder — go deeper or raise the difficulty.",
    ease_off: "They struggled. Ease off: simplify, or offer a small hint before asking again.",
    change_topic: "That thread is exhausted. Move to a different topic.",
  }[analysis.nextMove];

  return `[Coaching note on their last answer — scored ${analysis.score}/10. Strength: ${analysis.strength}. Gap: ${analysis.gap}. ${move} Do NOT mention this note or the score out loud.]`;
}
