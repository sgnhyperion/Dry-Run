"""Cross-encoder reranking.

The precision stage. Bi-encoders (the embedding model) encode query and document
SEPARATELY, so they can be indexed ahead of time — fast, but the two texts never
attend to each other. A cross-encoder runs both through one transformer together,
so it can see which query term matches which document span. Far more accurate, far
too slow to run over a whole corpus.

Hence the ordering: cheap retrievers propose a few dozen candidates, the expensive
model scores only those. Reranking is where hybrid retrieval usually earns its keep,
which is exactly why it needs to be measured rather than assumed.
"""

from sentence_transformers import CrossEncoder

RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L6-v2"

_model: CrossEncoder | None = None


def model() -> CrossEncoder:
    global _model
    if _model is None:
        _model = CrossEncoder(RERANK_MODEL)
    return _model


def rerank(query: str, candidates: list[tuple[str, str]], k: int) -> list[tuple[str, float]]:
    """candidates is [(doc_id, text)]; returns the top k as [(doc_id, score)]."""
    if not candidates:
        return []

    scores = model().predict([(query, text) for _, text in candidates])
    scored = [(doc_id, float(score)) for (doc_id, _), score in zip(candidates, scores)]
    return sorted(scored, key=lambda kv: kv[1], reverse=True)[:k]
