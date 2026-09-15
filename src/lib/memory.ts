/**
 * Agent memory — client for the ML service's retrieval endpoints.
 *
 * The Python side owns storage, embeddings, and ranking; this side owns orchestration and
 * every LLM call. That split is deliberate: it keeps provider logic in one file (brain.ts)
 * instead of growing a second LLM integration inside the Python service.
 */

const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export type RetrievedMemory = {
  id: string;
  text: string;
  kind: "observation" | "reflection";
  importance: number;
  age_hours: number;
  score: number;
  parts: { relevance: number; recency: number; importance: number };
};

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ML_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new Error(`ML service unreachable at ${ML_URL} — is it running on :8000?`, { cause });
  }
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function remember(
  userId: string,
  text: string,
  importance: number,
  kind: "observation" | "reflection" = "observation",
  sessionId?: string,
  /** Ids of the memories this was derived from. Reflections only — see lib/reflection.ts. */
  evidence?: string[],
): Promise<string> {
  const { id } = await post<{ id: string }>("/memory/add", {
    user_id: userId,
    text,
    importance,
    kind,
    session_id: sessionId ?? null,
    evidence: evidence ?? null,
  });
  return id;
}

export async function recall(
  userId: string,
  query: string,
  k = 4,
  /**
   * `touch: false` leaves last_accessed_at alone. Retrieval normally refreshes recency — that
   * feedback loop is the paper's design and it is correct for the conversation. It is NOT
   * correct for retrieval the user did not ask for: reflection issues several queries in a
   * burst, and letting those refresh whatever they happen to hit would hand reflection's
   * internal search results a recency advantage in the NEXT real recall.
   */
  opts: { touch?: boolean } = {},
): Promise<{ results: RetrievedMemory[]; tookMs: number; corpusSize: number }> {
  const data = await post<{
    results: RetrievedMemory[];
    took_ms: number;
    corpus_size: number;
  }>("/memory/search", { user_id: userId, query, k, touch: opts.touch ?? true });
  return { results: data.results, tookMs: data.took_ms, corpusSize: data.corpus_size };
}

export type ReflectionState = {
  should_reflect: boolean;
  accumulated_importance: number;
  threshold: number;
  pending: { id: string; text: string; importance: number }[];
};

export async function reflectionState(userId: string): Promise<ReflectionState> {
  const res = await fetch(
    `${ML_URL}/memory/reflection-state?user_id=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) throw new Error(`reflection-state failed (${res.status})`);
  return res.json() as Promise<ReflectionState>;
}

/** Load the retrieval models. Search short-circuits on an empty corpus without touching them. */
export async function warmMemory(): Promise<void> {
  await post("/memory/warmup", {});
}

/**
 * Compile retrieved memories into context for the interviewer.
 *
 * Returns null when nothing cleared the relevance floor — the empty case must produce NO
 * context block at all, not an empty header. A "Things you remember:" heading with nothing
 * under it invites the model to invent entries to fill it.
 */
export function buildMemoryContext(memories: RetrievedMemory[]): string | null {
  if (memories.length === 0) return null;

  const lines = memories.map((m) => `- ${m.text}`).join("\n");
  return `[What you remember about this candidate from previous sessions:\n${lines}\n\nUse this to target your questions. Reference it naturally if relevant — never read it aloud as a list, and never mention that you are retrieving anything.]`;
}
