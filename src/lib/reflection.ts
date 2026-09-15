import { completeBrain } from "@/lib/brain";
import { recall, reflectionState, remember, type ReflectionState } from "@/lib/memory";

/**
 * Reflection — the second half of the Generative Agents memory stream (Park et al., 2023, §4.2).
 *
 * WHAT IT FIXES, CONCRETELY. Observations are episodic: each one records a single moment.
 * Retrieval over episodes can only ever return episodes, and the cross-encoder matches
 * surface form, not meaning — so a later question about whether the candidate is *nervous*
 * scores near zero against "went quiet for twelve seconds before answering", because those
 * two strings share nothing. No amount of reranking fixes that; the inference from evidence
 * to trait has to happen SOMEWHERE, and if the retriever can't do it, something has to write
 * the conclusion down as its own memory. That is what reflection is.
 *
 * The paper's three steps, unchanged:
 *   1. TRIGGER   — fire when summed importance since the last reflection crosses a threshold,
 *                  not on a timer. (Owned by Python; see memory.reflection_state.)
 *   2. QUESTIONS — ask the model what the salient questions about this person even are, rather
 *                  than hardcoding a rubric. The agent decides what is worth generalizing.
 *   3. INSIGHTS  — retrieve for each question, synthesize insights, store them as memories of
 *                  kind "reflection" WITH pointers back to the evidence.
 *
 * Because reflections are stored as ordinary memories, they are retrievable, they decay, and
 * they are themselves eligible evidence for later reflections — the paper's tree.
 *
 * ON THE CRITICAL PATH: no. This is 1 + N LLM calls, which is far too expensive for a voice
 * turn. It runs from /api/reflect, which the client fires after the agent stops speaking —
 * i.e. while the candidate is thinking or talking. Latency here is genuinely free in a way
 * the analyst's was not, because nothing downstream is waiting on it within the turn.
 */

const QUESTION_PROMPT = `You are reviewing notes an interviewer took about one candidate.

Given only the statements below, what are the 3 most salient high-level questions we could
answer about this candidate? Ask about patterns across statements, not about any single one.

Reply with ONLY a JSON array of 3 strings. No prose, no code fences.`;

const INSIGHT_PROMPT = `You are an interviewer consolidating notes about one candidate.

Given the numbered statements and the question, write 1-3 high-level insights.

Rules:
- Each insight is ONE self-contained sentence about the candidate, understandable with no
  other context. Say "The candidate ..." — never "they" or "he" or "she".
- An insight must GENERALIZE across statements. Restating a single statement in different
  words is not an insight; if the evidence only supports a restatement, return fewer.
- Name the concept explicitly. Write "The candidate shows nervousness under pressure —
  long pauses before answering", not "The candidate paused a lot".
- Cite the statement numbers each insight came from.

Reply with ONLY a JSON array, no prose and no code fences:
[{"insight": "<one sentence>", "evidence": [<statement numbers>], "importance": <1-10>}]`;

export type Insight = {
  text: string;
  importance: number;
  evidence: string[];
  question: string;
};

export type ReflectionResult = {
  reflected: boolean;
  state: ReflectionState;
  questions: string[];
  insights: Insight[];
  ms: number;
};

/**
 * Run a reflection cycle if enough has accumulated. Safe to call after every turn.
 */
export async function maybeReflect(userId: string): Promise<ReflectionResult> {
  const started = performance.now();
  const state = await reflectionState(userId);

  const empty = { state, questions: [], insights: [] as Insight[] };
  if (!state.should_reflect || state.pending.length < 2) {
    return { reflected: false, ...empty, ms: Math.round(performance.now() - started) };
  }

  const questions = await generateQuestions(state.pending.map((m) => m.text));
  if (questions.length === 0) {
    return { reflected: false, ...empty, ms: Math.round(performance.now() - started) };
  }

  const insights: Insight[] = [];

  // Two things have to be tracked ACROSS questions, both found by running this for real:
  //
  //  1. The questions overlap, so they regenerate each other's insights. A 6-observation
  //     corpus produced "shows nervousness under pressure" three times — once per question.
  //     Exact repeats are caught by the store's text dedupe, but near-repeats ("struggles
  //     with theoretical concepts" vs the same sentence plus "under pressure") are not, and
  //     they occupy separate slots in a top-k retrieval. That is the same failure the
  //     observation dedupe exists to prevent (decisions.md #8), one level up.
  //
  //  2. Writing a reflection changes the corpus, so the NEXT question's retrieval returns it
  //     as a candidate — and the model then cited reflections from this same cycle as the
  //     evidence for near-identical reflections. Reflections citing reflections is the
  //     paper's tree and is wanted; a reflection citing itself thirty seconds later is
  //     circular. Later cycles can build on these; this cycle cannot.
  const writtenIds = new Set<string>();
  const writtenTokens: Set<string>[] = [];

  // SEQUENTIAL, not Promise.all. The questions are independent and firing them together is
  // the obvious optimization — but on a single local Ollama instance there is one model slot,
  // and concurrent generation there measurably contends (the same effect that pushed TTFA
  // 1463ms → 4307ms when the analyst ran alongside the interviewer, decisions.md #7). Nothing
  // is waiting on this, so the serial version costs nothing worth having.
  for (const question of questions) {
    try {
      // The evidence pool: what the retriever finds for this question, UNION the pending
      // observations. Union rather than retrieval alone because the relevance floor can
      // legitimately return nothing — and "no memory is a close lexical match for this
      // question" is exactly the situation reflection exists to resolve, so refusing to
      // reflect there would disable the feature precisely when it is needed.
      const { results } = await recall(userId, question, 6, { touch: false });
      const pool = dedupe([
        ...results.map((m) => ({ id: m.id, text: m.text })),
        ...state.pending.map((m) => ({ id: m.id, text: m.text })),
      ])
        .filter((m) => !writtenIds.has(m.id))
        .slice(0, 12);

      const raw = await completeBrain(
        [
          {
            role: "user",
            content: `Statements:\n${pool.map((m, i) => `${i + 1}. ${m.text}`).join("\n")}\n\nQuestion: ${question}`,
          },
        ],
        { system: INSIGHT_PROMPT, temperature: 0.3, maxTokens: 300, tier: "background" },
      );

      for (const parsed of parseInsights(raw)) {
        const tokens = contentTokens(parsed.text);
        if (writtenTokens.some((prior) => jaccard(prior, tokens) >= NEAR_DUPLICATE)) continue;

        // Evidence arrives as 1-based positions in the prompt; store the ids they point at,
        // so a reflection stays traceable after the pool it was built from is long gone.
        const evidence = parsed.evidence
          .map((n) => pool[n - 1]?.id)
          .filter((id): id is string => Boolean(id));

        const id = await remember(
          userId,
          parsed.text,
          parsed.importance,
          "reflection",
          undefined,
          evidence,
        );
        if (!id) continue;

        writtenIds.add(id);
        writtenTokens.push(tokens);
        insights.push({ ...parsed, evidence, question });
      }
    } catch (error) {
      // One bad question must not abandon the whole cycle — the others may still produce
      // insights, and a failed reflection leaves the trigger armed for the next turn anyway.
      console.error("reflection question failed:", question, error);
    }
  }

  return {
    reflected: insights.length > 0,
    state,
    questions,
    insights,
    ms: Math.round(performance.now() - started),
  };
}

async function generateQuestions(statements: string[]): Promise<string[]> {
  try {
    const raw = await completeBrain(
      [{ role: "user", content: statements.map((t, i) => `${i + 1}. ${t}`).join("\n") }],
      { system: QUESTION_PROMPT, temperature: 0.4, maxTokens: 160, tier: "background" },
    );
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((q): q is string => typeof q === "string" && q.length > 5)
      .slice(0, 3)
      .map((q) => q.slice(0, 200));
  } catch (error) {
    console.error("reflection questions failed:", error);
    return [];
  }
}

/** Same defensive parse as the analyst's: models wrap JSON in prose no matter how you ask. */
function parseInsights(raw: string): { text: string; importance: number; evidence: number[] }[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        const row = item as Record<string, unknown>;
        const text = String(row.insight ?? "").trim();
        if (text.length < 15) return null; // a fragment is not an insight
        return {
          text: text.slice(0, 400),
          // Reflections default HIGHER than observations when unrated: a generalization that
          // survived the "must not restate one statement" bar is by construction about a
          // pattern, and patterns outlive the moments they were drawn from.
          importance: clamp(Number(row.importance), 7),
          evidence: Array.isArray(row.evidence)
            ? row.evidence.map(Number).filter(Number.isFinite)
            : [],
        };
      })
      .filter((x): x is { text: string; importance: number; evidence: number[] } => x !== null)
      .slice(0, 3);
  } catch {
    return [];
  }
}

function clamp(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(10, Math.round(value)));
}

/**
 * Near-duplicate threshold on content-word overlap.
 *
 * 0.6 rather than something stricter because the collisions being caught are not subtle.
 * Measured on the pairs a real cycle actually produced: "...struggles with theoretical
 * concepts, often providing incomplete or incorrect answers" against the same sentence
 * ending "...under pressure" scores 0.83, while distinct insights drawn from the same six
 * observations score 0.06-0.11. The gap between a restatement and a different idea is an
 * order of magnitude here, so the threshold only has to land inside it.
 *
 * A cross-encoder would be the principled tool and is already loaded on the Python side —
 * not worth a round-trip per insight for a distinction this stark.
 */
const NEAR_DUPLICATE = 0.6;

/** Content words only: 4+ characters, so shared filler can't manufacture similarity. */
function contentTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared / (a.size + b.size - shared);
}

function dedupe<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}
