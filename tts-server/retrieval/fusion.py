"""Reciprocal Rank Fusion.

REPLACES the weighted score fusion in AI_Search_Engine, which did:

    bm25_norm = bm25_score / max(bm25_scores_this_query)
    hybrid    = 0.7 * bm25_norm + 0.3 * (1 / (1 + l2_distance))

Two problems with that, both real:

1. Dividing by the per-query maximum means the normalization constant changes on every
   query. A BM25 score of 8 becomes 1.0 on a query whose best hit is 8, and 0.4 on a query
   whose best hit is 20 — so a fixed 0.7/0.3 weighting is comparing quantities whose scale
   moves underneath it. The weights are not tunable in any principled way.
2. BM25 scores and cosine similarities are different units. Normalizing doesn't make them
   commensurate, it just makes them both land in [0,1].

RRF sidesteps both by throwing away the scores and keeping only RANKS, which are already
comparable across retrievers. A document ranked 1st by BM25 and 50th by the vector index
scores the same whether BM25 gave it 8.0 or 800.0.

    RRF(d) = Σ over retrievers  1 / (k + rank(d))

k dampens the top ranks so one retriever's confident-but-wrong first hit can't dominate a
document both retrievers liked. k=60 is the value from Cormack et al. (2009).
"""


def reciprocal_rank_fusion(
    ranked_lists: list[list[str]],
    k: int = 60,
    weights: list[float] | None = None,
) -> list[tuple[str, float]]:
    """Fuse ranked ID lists into one. Input order matters; scores do not."""
    if weights is None:
        weights = [1.0] * len(ranked_lists)

    fused: dict[str, float] = {}
    for ranked, weight in zip(ranked_lists, weights):
        for rank, doc_id in enumerate(ranked, start=1):
            fused[doc_id] = fused.get(doc_id, 0.0) + weight * (1.0 / (k + rank))

    return sorted(fused.items(), key=lambda kv: kv[1], reverse=True)
