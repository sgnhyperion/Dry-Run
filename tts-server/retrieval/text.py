"""Tokenization for the lexical (BM25) side.

Ported from the AI_Search_Engine project, with one behavioural fix: NLTK resource
checks there caught `nltk.downloader.DownloadError`, but `nltk.data.find` actually
raises `LookupError` — so the except never fired and a machine without the corpora
crashed instead of downloading them. Resources are now ensured once at import.

Only the LEXICAL path is stemmed. Embeddings get the raw text: stemming destroys the
morphology and word order a sentence transformer was trained on, so "ran" and "running"
should collapse for BM25 and stay distinct for the encoder. Two representations of the
same document, on purpose.
"""

import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize

for _resource, _path in [
    ("stopwords", "corpora/stopwords"),
    ("punkt", "tokenizers/punkt"),
    ("punkt_tab", "tokenizers/punkt_tab"),
]:
    try:
        nltk.data.find(_path)
    except LookupError:
        nltk.download(_resource, quiet=True)

STOP_WORDS = set(stopwords.words("english"))
_stemmer = PorterStemmer()


def tokenize(text: str) -> list[str]:
    """Lowercase → tokenize → drop non-alphabetic and stopwords → stem."""
    return [
        _stemmer.stem(token)
        for token in word_tokenize(text.lower())
        if token.isalpha() and token not in STOP_WORDS
    ]
