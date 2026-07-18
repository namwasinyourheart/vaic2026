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


class SourceChunkResponse(BaseModel):
    chunk_id: str
    document_id: str
    document_type: str
    section_title: str
    text: str
    token_count: int
    domain: str
    version: str
    effective_date: str
    expiry_date: str | None = None
    status: str = "Active"
    language: str = "vi"
    score: float = 0.0


class GraphNodeResponse(BaseModel):
    id: str
    type: str
    label: str
    properties: dict = {}


class GraphEdgeResponse(BaseModel):
    source: str
    target: str
    type: str


class GraphResponse(BaseModel):
    nodes: list[GraphNodeResponse]
    edges: list[GraphEdgeResponse]


class RAGResponse(BaseModel):
    answer: str
    sources: list[SourceChunkResponse]
    conflicts: list[dict]
    graph: GraphResponse | None = None


class TimelineRequest(BaseModel):
    clause_id: str


class TimelineEntry(BaseModel):
    clause_id: str
    document_id: str
    document_title: str
    text: str
    effective_date: str | None = None
    expiry_date: str | None = None
    status: str = "Active"
    position: int = 0
    is_first: bool = False
    is_current: bool = False


class TimelineResponse(BaseModel):
    clause_id: str
    timeline: list[TimelineEntry]


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/rag", response_model=RAGResponse)
def rag(request: RAGRequest):
    try:
        _ensure_loaded()
        from rag.rag_pipeline import answer as rag_answer

        result = asyncio.run(rag_answer(request.query))

        sources = [SourceChunkResponse(**s) for s in result.sources]

        graph = None
        if result.graph:
            nodes = []
            for n in result.graph.get("nodes", []):
                node_id = n.get("id", "")
                node_type = n.get("type", "")
                node_label = n.get("label", "")
                properties = {k: v for k, v in n.items() if k not in ("id", "type", "label") and v is not None}
                nodes.append(GraphNodeResponse(id=node_id, type=node_type, label=node_label, properties=properties))
            edges = [GraphEdgeResponse(**e) for e in result.graph.get("edges", [])]
            graph = GraphResponse(nodes=nodes, edges=edges)

        return RAGResponse(
            answer=result.answer,
            sources=sources,
            conflicts=result.conflicts,
            graph=graph,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clause-timeline", response_model=TimelineResponse)
def clause_timeline(request: TimelineRequest):
    try:
        from ingestion.neo4j_client import get_clause_timeline
        result = get_clause_timeline(request.clause_id)
        entries = [TimelineEntry(**e) for e in result.get("timeline", [])]
        return TimelineResponse(clause_id=request.clause_id, timeline=entries)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
