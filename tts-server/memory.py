"""Agent memory — the Generative Agents memory stream (Park et al., 2023).

WHAT MAKES THIS DIFFERENT FROM PLAIN RAG. A normal RAG corpus is loaded once from documents
someone already wrote. This corpus writes itself: every observation is produced by using the
system, so retrieval quality compounds with usage instead of being fixed at ingest.

Retrieval is the paper's three-factor score, not similarity alone:

    score = w_rel · relevance + w_rec · recency + w_imp · importance

- relevance — hybrid retrieval (BM25 + dense → RRF → cross-encoder rerank)
- recency   — exponential decay over hours since the memory was last RETRIEVED, not created.
              Accessing a memory refreshes it, so things the agent keeps returning to stay
              available and things it never needs fade. That feedback loop is the paper's.
- importance — an LLM's 1-10 rating of how significant the observation is, scored once at
              write time. "Ate breakfast" vs "broke up with their partner", in the paper's framing.

NOTE ON THE FORMULA. `DRY_RUN.md` §5A writes this as relevance × recency × importance. The
paper actually uses a weighted SUM of min-max normalized components (§4.1, all weights 1).
Implemented as the paper specifies. The difference matters: with a product, any single factor
near zero annihilates the score, so one old memory can never surface no matter how relevant.

Components are min-max normalized per query, because raw cross-encoder logits, a decay in
[0,1], and a 1-10 rating share no scale.
"""

import math
import sqlite3
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

from retrieval.bm25 import BM25
from retrieval.fusion import reciprocal_rank_fusion
from retrieval.rerank import rerank
from retrieval.text import tokenize
from retrieval.vectors import VectorIndex, embed

DB_PATH = Path(__file__).parent / "storage" / "memory.db"

# Paper's decay: 0.995 per hour. A memory is at ~0.70 after a day, ~0.03 after a week.
RECENCY_DECAY = 0.995
# The paper uses equal weights (§4.1). WE DELIBERATELY DO NOT — because our retrieval
# question is not the paper's.
#
# Generative Agents asks "what should this agent have in mind right now?", browsing a huge
# stream where recency genuinely competes with relevance. Dry Run asks pointed questions:
# "what do I know about their hash-table knowledge?" That is QA retrieval, and an answer
# that is not about the question is worthless however recent or important it is.
#
# With equal weights that fails concretely. Measured: for "what does he work on?" the
# correct memory won relevance outright (cross-encoder -4.35 vs -9.77, and the only BM25
# hit) yet finished outside the top 3, because being the oldest and least important zeroed
# its other two factors — 1.0 total against 2.2 for a recent, important, irrelevant memory.
#
# So relevance is weighted to outrank the other two COMBINED. 3.0 is a floor derived from
# that constraint, not a tuned value; the eval's first job is to sweep these and replace
# the guess with a number.
W_RELEVANCE, W_RECENCY, W_IMPORTANCE = 3.0, 1.0, 1.0


@dataclass
class Memory:
    id: str
    user_id: str
    session_id: str | None
    kind: str  # "observation" | "reflection"
    text: str
    importance: int  # 1-10
    created_at: float
    last_accessed_at: float


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS memories (
                id               TEXT PRIMARY KEY,
                user_id          TEXT NOT NULL,
                session_id       TEXT,
                kind             TEXT NOT NULL DEFAULT 'observation',
                text             TEXT NOT NULL,
                importance       INTEGER NOT NULL DEFAULT 5,
                created_at       REAL NOT NULL,
                last_accessed_at REAL NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_user ON memories(user_id)")


def add(user_id: str, text: str, importance: int, kind: str = "observation",
        session_id: str | None = None) -> str:
    now = time.time()
    memory_id = str(uuid.uuid4())
    with _connect() as conn:
        conn.execute(
            "INSERT INTO memories VALUES (?,?,?,?,?,?,?,?)",
            (memory_id, user_id, session_id, kind, text,
             max(1, min(10, int(importance))), now, now),
        )
    _INDEX_CACHE.pop(user_id, None)  # corpus changed — rebuild on next search
    return memory_id


def all_for_user(user_id: str) -> list[Memory]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM memories WHERE user_id = ? ORDER BY created_at", (user_id,)
        ).fetchall()
    return [Memory(**dict(r)) for r in rows]


def _touch(ids: list[str]) -> None:
    """Refresh last_accessed_at — this is what makes recency a feedback loop, not a clock."""
    if not ids:
        return
    with _connect() as conn:
        conn.executemany(
            "UPDATE memories SET last_accessed_at = ? WHERE id = ?",
            [(time.time(), i) for i in ids],
        )


# ── per-user index cache ───────────────────────────────────────────────────────
# Rebuilt whenever that user's corpus changes. Cheap at memory-stream scale (hundreds
# of rows); a shared persistent index would need incremental vector updates and locking
# for no benefit at this size.
_INDEX_CACHE: dict[str, tuple[BM25, VectorIndex, dict[str, Memory]]] = {}


def _indexes(user_id: str):
    cached = _INDEX_CACHE.get(user_id)
    if cached:
        return cached

    memories = all_for_user(user_id)
    bm25 = BM25()
    lookup = {m.id: m for m in memories}
    for m in memories:
        bm25.add(m.id, tokenize(m.text))

    vectors = VectorIndex(expected_size=len(memories))
    if memories:
        vectors.add([m.id for m in memories], embed([m.text for m in memories]))

    _INDEX_CACHE[user_id] = (bm25, vectors, lookup)
    return _INDEX_CACHE[user_id]


def _normalize(values: dict[str, float], epsilon: float = 1e-9) -> dict[str, float]:
    """Min-max to [0,1], treating a spread below `epsilon` as a tie.

    `epsilon` is not paranoia about float error — it is load-bearing. Min-max stretches
    whatever spread exists across the FULL range, so when a factor barely varies it
    amplifies noise into a decisive signal.

    Observed: five memories written milliseconds apart differ in raw recency by ~1e-7.
    Normalized, that microsecond jitter became a 0.0-to-1.0 spread and outvoted relevance —
    a query about hash tables ranked a two-sum memory first. The paper assumes a stream
    that accumulates over hours; a fresh corpus violates that silently.

    So each factor passes an epsilon on ITS OWN scale, and a factor that does not
    meaningfully vary returns all-1.0 and drops out of the ranking instead of dominating it.
    """
    if not values:
        return {}
    lo, hi = min(values.values()), max(values.values())
    if hi - lo < epsilon:
        return {k: 1.0 for k in values}
    return {k: (v - lo) / (hi - lo) for k, v in values.items()}


# Recency decays 0.995 per hour, so a spread this small means the memories are
# effectively the same age and recency should not break the tie.
RECENCY_EPSILON = 0.005
# Importance is an integer 1-10 mapped to [0,1]; anything under a tenth is sub-quantum.
IMPORTANCE_EPSILON = 0.09
# Cross-encoder logits. A spread this small across candidates means the model is saying
# "these are all equally unrelated", and normalizing it would invent a ranking from noise.
RELEVANCE_EPSILON = 1.0
# Absolute floor: if the BEST candidate is below this, nothing in memory is about the query.
# Measured on ms-marco-MiniLM: a correct hit scored -4.35, while a query with no true match
# put every candidate between -11.31 and -11.47. PROVISIONAL — the eval sets this properly.
RELEVANCE_FLOOR = -9.0


def search(user_id: str, query: str, k: int = 5, candidates: int = 30,
           use_rerank: bool = True, use_hybrid: bool = True, touch: bool = True) -> list[dict]:
    """Retrieve memories. Flags exist so the eval can ablate each stage.

    `touch=False` disables the last-accessed update, and evaluation REQUIRES it. Retrieval
    mutates recency, so scoring a query set changes the corpus as it runs: the same query
    run twice gives different answers, and any memory that loses once is never refreshed
    while the winners are — it ages, its recency drops, and it loses harder next time. A
    rich-get-richer loop that silently buries content. Fine as a product behaviour (it is
    the paper's design), fatal to a reproducible benchmark.
    """
    bm25, vectors, lookup = _indexes(user_id)
    if not lookup:
        return []

    # ── stage 1: candidate generation ──────────────────────────────────────────
    dense_ranked = [doc_id for doc_id, _ in vectors.search(embed([query]), candidates)]

    if use_hybrid:
        lexical_ranked = [doc_id for doc_id, _ in bm25.search(tokenize(query), candidates)]
        fused = reciprocal_rank_fusion([lexical_ranked, dense_ranked])
        candidate_ids = [doc_id for doc_id, _ in fused[:candidates]]
    else:
        candidate_ids = dense_ranked[:candidates]

    if not candidate_ids:
        return []

    # ── stage 2: relevance ─────────────────────────────────────────────────────
    if use_rerank:
        scored = rerank(query, [(i, lookup[i].text) for i in candidate_ids], len(candidate_ids))
        relevance = dict(scored)
    else:
        # Fall back to fused rank position, so ablating the reranker still yields an ordering.
        relevance = {doc_id: 1.0 / (rank + 1) for rank, doc_id in enumerate(candidate_ids)}

    # ── stage 2a: refuse to answer when nothing is actually relevant ───────────
    # Returning the least-bad memory is worse than returning none: it feeds the interviewer
    # a confident, irrelevant "I remember you said X". Measured on "how does he handle
    # caching?" against a corpus with no caching memory — BM25 matched nothing (the memory
    # says "Redis LRU eviction"; "caching" stems to "cach", a plain vocabulary gap), dense
    # ranked the closest memory third, and the cross-encoder put every candidate within
    # 0.16 logits of every other. Every retriever was correctly signalling "no match", and
    # min-max normalization turned that flat noise into a confident first place.
    if use_rerank and relevance and max(relevance.values()) < RELEVANCE_FLOOR:
        return []

    # ── stage 2b: gate on relevance BEFORE the three-factor score ──────────────
    # Without this the formula demonstrably fails. Measured on a 5-memory corpus: for
    # "what does he work on?" the cross-encoder scored the correct memory -4.35 against
    # -9.77 for the runner-up, and BM25 returned it as the only match — retrieval was
    # right — yet it finished outside the top 3. With equal weights, recency + importance
    # sum to 2.0 while relevance caps at 1.0, so a recent, important, IRRELEVANT memory
    # beats an old, mundane, perfectly relevant one. Content loses to freshness by
    # construction.
    #
    # The paper's factors are meant to choose among memories that are ALREADY relevant —
    # at its scale, the stream is large enough that the top candidates all pass that bar.
    # On a small corpus every memory becomes a candidate, including ones about nothing
    # related, and recency/importance stop being tiebreakers and start being the ranking.
    #
    # So relevance gates the pool and the three factors rank within it. Keeping a pool
    # larger than k leaves recency and importance real work to do.
    pool_size = max(k * 3, 10)
    top_by_relevance = sorted(relevance.items(), key=lambda kv: kv[1], reverse=True)[:pool_size]
    relevance = dict(top_by_relevance)

    # ── stage 3: the Generative Agents score ───────────────────────────────────
    now = time.time()
    recency = {
        i: RECENCY_DECAY ** ((now - lookup[i].last_accessed_at) / 3600.0)
        for i in relevance
    }
    importance = {i: lookup[i].importance / 10.0 for i in relevance}

    rel_n = _normalize(relevance, RELEVANCE_EPSILON if use_rerank else 1e-9)
    rec_n = _normalize(recency, RECENCY_EPSILON)
    imp_n = _normalize(importance, IMPORTANCE_EPSILON)

    ranked = sorted(
        (
            {
                "id": i,
                "text": lookup[i].text,
                "kind": lookup[i].kind,
                "importance": lookup[i].importance,
                "age_hours": round((now - lookup[i].created_at) / 3600.0, 2),
                "score": round(
                    W_RELEVANCE * rel_n[i] + W_RECENCY * rec_n[i] + W_IMPORTANCE * imp_n[i], 4
                ),
                "parts": {
                    "relevance": round(rel_n[i], 4),
                    "recency": round(rec_n[i], 4),
                    "importance": round(imp_n[i], 4),
                },
            }
            for i in relevance
        ),
        key=lambda m: m["score"],
        reverse=True,
    )[:k]

    if touch:
        _touch([m["id"] for m in ranked])
    return ranked
