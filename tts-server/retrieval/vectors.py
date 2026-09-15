"""Dense retrieval: sentence-transformer embeddings + FAISS.

Two fixes over the AI_Search_Engine version:

1. **IndexFlatIP, not IndexFlatL2.** That code normalized vectors and then searched with L2,
   converting distance to a score with `1/(1+d)` — an arbitrary transform. For L2-normalized
   vectors, inner product IS cosine similarity, so IP gives the similarity directly with no
   invented function and no monotonic-but-meaningless numbers.

2. **Index type chosen by corpus size.** HNSW is a graph-based approximate index: it trades
   exactness for sublinear search, which is a good trade at 100K documents and a bad one at
   500, where an exact scan is both faster (no graph to build or traverse) and correct.
   Per-user agent memory lives at the small end; the AG News eval corpus lives at the large
   end. Same code serves both rather than picking one and pretending.
"""

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# Above this many vectors, an approximate graph index beats an exact scan.
HNSW_THRESHOLD = 20_000

_model: SentenceTransformer | None = None


def model() -> SentenceTransformer:
    """Loaded lazily and once — same discipline as every other model in this service."""
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def embed(texts: list[str], show_progress: bool = False) -> np.ndarray:
    """Texts → L2-normalized float32 embeddings, so inner product == cosine."""
    vectors = model().encode(
        texts, batch_size=256, show_progress_bar=show_progress, convert_to_numpy=True
    )
    vectors = np.asarray(vectors, dtype="float32")
    faiss.normalize_L2(vectors)
    return vectors


class VectorIndex:
    """Thin FAISS wrapper that keeps ids alongside vectors."""

    def __init__(self, dim: int = 384, expected_size: int = 0):
        if expected_size >= HNSW_THRESHOLD:
            # 32 = neighbours per node. Higher recall, more memory, slower build.
            self.index = faiss.IndexHNSWFlat(dim, 32, faiss.METRIC_INNER_PRODUCT)
            self.index.hnsw.efConstruction = 200
            self.index.hnsw.efSearch = 64
            self.kind = "hnsw"
        else:
            self.index = faiss.IndexFlatIP(dim)
            self.kind = "flat"
        self.ids: list[str] = []

    def add(self, ids: list[str], vectors: np.ndarray) -> None:
        self.index.add(vectors)
        self.ids.extend(ids)

    def search(self, query: np.ndarray, k: int) -> list[tuple[str, float]]:
        if not self.ids:
            return []
        k = min(k, len(self.ids))
        scores, indices = self.index.search(query, k)
        return [
            (self.ids[i], float(s))
            for i, s in zip(indices[0], scores[0])
            if i != -1  # FAISS pads with -1 when fewer than k results exist
        ]
