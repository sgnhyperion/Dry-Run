/**
 * Does reflection actually make anything retrievable that wasn't?
 *
 * Reflection is easy to justify on paper and easy to fake: any LLM asked to "summarize these
 * notes" produces plausible sentences. The question that matters is narrower — do the
 * generated insights answer queries the raw observations DEMONSTRABLY could not?
 *
 * So this runs a controlled comparison. Two users get the identical six observations. One
 * reflects; the other doesn't. Then the same trait-level queries hit both through the same
 * retriever with the same thresholds. The only variable is the reflection layer.
 *
 * Why trait-level queries specifically: observations are episodic ("went quiet for twelve
 * seconds") and the cross-encoder scores surface overlap, so a question about NERVOUSNESS
 * shares almost nothing with the sentence that is evidence of it. That inference has to
 * happen somewhere. This measures whether reflection is where.
 *
 * Usage:  node scripts/reflect-demo.mjs [appUrl] [mlUrl]
 *         (needs `pnpm dev` and the ML service running)
 */

const APP = process.argv[2] || "http://localhost:3000";
const ML = process.argv[3] || "http://127.0.0.1:8000";

// Suffixed per run so a re-run never reflects on a corpus that already has reflections in it —
// the trigger is "importance accumulated since the last reflection", so a reused id silently
// produces a no-op second run and an apples-to-oranges comparison.
const STAMP = Date.now().toString(36);
const WITH = `reflect-demo-${STAMP}`;
const WITHOUT = `reflect-control-${STAMP}`;

/**
 * A deliberately mixed session: strong on practical/applied work, weak on theory, with
 * separate behavioural signals (pauses, repeat requests, self-correction) that are only
 * interpretable in aggregate. Sums to 38 importance — past the reflection threshold of 30.
 */
const OBSERVATIONS = [
  ["Went quiet for twelve seconds before answering the hash collision question, then gave an incomplete answer.", 6],
  ["Struggled with hash collisions: suggested overwriting the existing entry, unaware of chaining or open addressing.", 7],
  ["Asked to repeat the question twice during the big-O discussion before attempting an answer.", 5],
  ["Explained their distributed systems work clearly and unprompted, including a Redis LRU eviction design they shipped.", 8],
  ["Answered the two-sum problem confidently and immediately, naming the hash map approach and its O(n) complexity.", 6],
  ["Backtracked mid-answer on database indexing and said 'actually I'm not sure' before recovering with a correct explanation.", 6],
];

// None of these name a word that appears in any observation. That's the point: each asks about
// a TRAIT, and the evidence for it is episodic.
const QUERIES = [
  "is the candidate nervous under pressure?",
  "how does the candidate handle being unsure?",
  "is the candidate stronger at practical or theoretical work?",
];

const post = async (url, body) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status} ${await res.text()}`);
  return res.json();
};

const seed = async (userId) => {
  for (const [text, importance] of OBSERVATIONS) {
    await post(`${ML}/memory/add`, { user_id: userId, text, importance });
  }
};

// touch: false — scoring must not mutate the corpus it is scoring. Retrieval normally
// refreshes recency, which would make the second arm's queries run against a corpus the
// first arm already reordered.
const search = (userId, query) =>
  post(`${ML}/memory/search`, { user_id: userId, query, k: 2, touch: false });

const main = async () => {
  console.log(`seeding ${OBSERVATIONS.length} identical observations into both arms…`);
  await seed(WITH);
  await seed(WITHOUT);

  const state = await (await fetch(`${ML}/memory/reflection-state?user_id=${WITH}`)).json();
  console.log(
    `trigger: ${state.accumulated_importance}/${state.threshold} importance → ${state.should_reflect ? "FIRES" : "does not fire"}`,
  );

  console.log("\nreflecting (1 question-generation call + 1 synthesis call per question)…");
  const started = Date.now();
  const result = await post(`${APP}/api/reflect`, { userId: WITH });
  console.log(`  ${Date.now() - started}ms · ${result.insights.length} insights written\n`);

  for (const q of result.questions) console.log(`  Q  ${q}`);
  console.log();
  for (const i of result.insights) {
    console.log(`  [${i.importance}] ${i.text}`);
    console.log(`        ← ${i.evidence.length} observation(s)`);
  }

  console.log("\n" + "─".repeat(100));
  console.log("RETRIEVAL — same queries, same retriever, same thresholds, same observations\n");

  let rescued = 0;
  for (const query of QUERIES) {
    console.log(`  "${query}"`);
    for (const [label, userId] of [["observations only", WITHOUT], ["+ reflections    ", WITH]]) {
      const { results } = await search(userId, query);
      if (results.length === 0) {
        console.log(`    ${label}  ∅ nothing cleared the relevance floor`);
      } else {
        results.forEach((m, i) => {
          const tag = m.kind === "reflection" ? "R" : "O";
          console.log(
            `    ${i === 0 ? label : " ".repeat(label.length)}  ${tag} ${m.score.toFixed(2)}  ${m.text}`,
          );
        });
        if (userId === WITH) rescued++;
      }
    }
    console.log();
  }

  console.log(`${rescued}/${QUERIES.length} trait queries answerable with reflection.`);
  console.log(`users: ${WITH} (reflected) · ${WITHOUT} (control) — delete when done.`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
