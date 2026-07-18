from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import EMBEDDING_MODEL
from ingestion.embedder import get_model
from ingestion.qdrant_indexer import search as qdrant_search
from rank_bm25 import BM25Okapi


_bm25_index: BM25Okapi | None = None
_bm25_corpus_ids: list[str] = []
_bm25_corpus_texts: list[str] = []


def build_bm25_index(chunks: list[dict]):
    global _bm25_index, _bm25_corpus_ids, _bm25_corpus_texts

    _bm25_corpus_texts = [c["text"] for c in chunks]
    _bm25_corpus_ids = [c["chunk_id"] for c in chunks]

    tokenized = [t.lower().split() for t in _bm25_corpus_texts]
    _bm25_index = BM25Okapi(tokenized)


def search_bm25(query: str, top_k: int = 20) -> list[dict]:
    if _bm25_index is None:
        return []
    tokenized = query.lower().split()
    scores = _bm25_index.get_scores(tokenized)
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    return [{"chunk_id": _bm25_corpus_ids[i], "score": float(scores[i]), "text": _bm25_corpus_texts[i]} for i in top_indices]


def search_vector(query: str, top_k: int = 20) -> list[dict]:
    model = get_model()
    vec = model.encode([f"query: {query}"], normalize_embeddings=True)[0].tolist()
    return qdrant_search(vec, top_k=top_k)


def reciprocal_rank_fusion(result_lists: list[list[dict]], k: int = 60) -> list[dict]:
    scores: dict[str, float] = {}
    metadata: dict[str, dict] = {}

    for results in result_lists:
        for rank, r in enumerate(results):
            cid = r.get("chunk_id") or r.get("payload", {}).get("chunk_id", "")
            if not cid:
                continue
            scores[cid] = scores.get(cid, 0) + 1.0 / (k + rank + 1)
            if "payload" in r:
                metadata[cid] = r["payload"]
            elif cid not in metadata and "text" in r:
                metadata[cid] = r

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [{"chunk_id": cid, "rrf_score": sc, **metadata.get(cid, {})} for cid, sc in ranked]


def hybrid_search(query: str, top_k: int = 10) -> list[dict]:
    vector_results = search_vector(query, top_k=20)
    bm25_results = search_bm25(query, top_k=20)
    fused = reciprocal_rank_fusion([vector_results, bm25_results])
    return fused[:top_k]
