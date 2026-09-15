import { maybeReflect } from "@/lib/reflection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Run a reflection cycle if the memory stream has accumulated enough to warrant one.
 *
 * SEPARATE ROUTE, ON PURPOSE. Reflection is 1 + N LLM calls. Everything in /api/turn is
 * either on the voice critical path or deliberately arranged around it, and bolting a
 * multi-call agent onto the end of that route would either delay the SSE close (the client
 * treats `done` as end-of-turn) or contend with the interviewer for the single local model
 * slot mid-sentence.
 *
 * Instead the client fires this after the agent has finished speaking — the window where the
 * candidate is thinking or answering and the machine is otherwise idle. That's the only
 * moment in a voice app when a slow background agent is genuinely free, and it's the same
 * reasoning as the analyst's deferral (decisions.md #7), applied one level up.
 *
 * Cheap when it does nothing: the trigger check is a single indexed SQLite query, so calling
 * this every turn costs a round-trip and no inference on the turns that don't reflect.
 */
export async function POST(request: Request) {
  const { userId } = (await request.json()) as { userId?: string };
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  try {
    const result = await maybeReflect(userId);
    return Response.json(result);
  } catch (error) {
    console.error("reflect failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "reflection failed" },
      { status: 500 },
    );
  }
}
