from __future__ import annotations
import asyncio
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# State: loaded chunks and BM25 index
_chunks_loaded = False


def _ensure_loaded():
    global _chunks_loaded
    if not _chunks_loaded:
        from ingestion.ingest import _load_chunks
        from rag.retriever import build_bm25_index

        chunks = _load_chunks(None)
        build_bm25_index([{"chunk_id": c.chunk_id, "text": c.text} for c in chunks])
        _chunks_loaded = True


class RAGRequest(BaseModel):
    query: str


class RAGResponse(BaseModel):
    answer: str
    sources: list[str]
    conflicts: list[dict]
    graph: dict | None = None


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/rag", response_model=RAGResponse)
def rag(request: RAGRequest):
    try:
        _ensure_loaded()
        from rag.rag_pipeline import answer as rag_answer

        result = asyncio.run(rag_answer(request.query))
        return RAGResponse(
            answer=result.answer,
            sources=result.sources,
            conflicts=result.conflicts,
            graph=result.graph,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
