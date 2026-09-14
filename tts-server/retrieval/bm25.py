"""BM25 over an in-memory inverted index.

Ported from AI_Search_Engine. The scoring is unchanged — same IDF, same k1/b saturation
and length normalization — but the index is built in memory from a live corpus instead of
being loaded from JSON files written by an offline batch job.

That change is forced by the use case: memories arrive DURING a conversation. A design that
requires re-running an indexing script can't serve an agent that learns something new every
turn, so `add` updates the postings incrementally.
"""

import math
from collections import defaultdict


class BM25:
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.index: dict[str, dict[str, int]] = defaultdict(dict)  # term -> {doc_id: tf}
        self.doc_lengths: dict[str, int] = {}
        self.doc_freq: dict[str, int] = defaultdict(int)  # term -> docs containing it

    @property
    def total_docs(self) -> int:
        return len(self.doc_lengths)

    @property
    def avg_doc_length(self) -> float:
        if not self.doc_lengths:
            return 0.0
        return sum(self.doc_lengths.values()) / len(self.doc_lengths)

    def add(self, doc_id: str, tokens: list[str]) -> None:
        if doc_id in self.doc_lengths:
            self.remove(doc_id)  # re-indexing a doc must not double-count its terms

        self.doc_lengths[doc_id] = len(tokens)
        seen: set[str] = set()
        for token in tokens:
            self.index[token][doc_id] = self.index[token].get(doc_id, 0) + 1
            if token not in seen:
                self.doc_freq[token] += 1
                seen.add(token)

    def remove(self, doc_id: str) -> None:
        if doc_id not in self.doc_lengths:
            return
        for term, postings in list(self.index.items()):
            if doc_id in postings:
                del postings[doc_id]
                self.doc_freq[term] -= 1
                if not postings:
                    del self.index[term]
                    del self.doc_freq[term]
        del self.doc_lengths[doc_id]

    def compute_idf(self, term: str) -> float:
        df = self.doc_freq.get(term, 0)
        if df == 0:
            return 0.0
        # +1 inside the log keeps IDF non-negative for terms in most documents —
        # without it, a term appearing in >half the corpus scores negative and
        # actively penalizes documents that contain it.
        return math.log((self.total_docs - df + 0.5) / (df + 0.5) + 1)

    def score(self, query_tokens: list[str]) -> dict[str, float]:
        scores: dict[str, float] = defaultdict(float)
        avg_len = self.avg_doc_length or 1.0

        for term in query_tokens:
            postings = self.index.get(term)
            if not postings:
                continue
            idf = self.compute_idf(term)
            for doc_id, tf in postings.items():
                length = self.doc_lengths[doc_id]
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * (length / avg_len))
                scores[doc_id] += idf * (numerator / denominator)

        return dict(scores)

    def search(self, query_tokens: list[str], k: int) -> list[tuple[str, float]]:
        scores = self.score(query_tokens)
        return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:k]
