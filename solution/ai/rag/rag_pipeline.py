from __future__ import annotations
from dataclasses import dataclass, field
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from rag.retriever import hybrid_search
from rag.graph_expander import expand_references
from rag.version_resolver import resolve_versions
from rag.supersession_filter import filter_superseded
from rag.conflict_detector import detect_conflicts
from rag.prompt_builder import SYSTEM_PROMPT, build_prompt
from services.llm_service import generate


@dataclass
class SourceChunk:
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

    def to_dict(self) -> dict:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "document_type": self.document_type,
            "section_title": self.section_title,
            "text": self.text,
            "token_count": self.token_count,
            "domain": self.domain,
            "version": self.version,
            "effective_date": self.effective_date,
            "expiry_date": self.expiry_date,
            "status": self.status,
            "language": self.language,
            "score": self.score,
        }


@dataclass
class RAGResponse:
    answer: str
    sources: list[dict]
    conflicts: list[dict]
    reasoning_steps: list[str]
    graph: dict | None = None


def _extract_source_chunks(candidates: list[dict], active_ids: set[str]) -> list[dict]:
    sources = []
    for c in candidates:
        cid = c.get("chunk_id", "")
        if cid not in active_ids:
            continue
        payload = c.get("payload", {})
        sources.append({
            "chunk_id": cid,
            "document_id": payload.get("document_id", ""),
            "document_type": payload.get("document_type", ""),
            "section_title": payload.get("section_title", ""),
            "text": payload.get("text", "") or c.get("text", ""),
            "token_count": payload.get("token_count", 0),
            "domain": payload.get("domain", ""),
            "version": payload.get("version", ""),
            "effective_date": payload.get("effective_date", ""),
            "expiry_date": payload.get("expiry_date"),
            "status": payload.get("status", "Active"),
            "language": payload.get("language", "vi"),
            "score": c.get("rrf_score", c.get("score", 0.0)),
        })
    return sources


async def answer(query: str) -> RAGResponse:
    reasoning: list[str] = []

    reasoning.append("1. Hybrid search (vector + BM25) → top candidates")
    candidates = hybrid_search(query, top_k=15)
    candidate_ids = [c["chunk_id"] for c in candidates]

    reasoning.append(f"2. Graph expansion (REFERENCES, 2 hops)")
    expanded = expand_references(candidate_ids, hops=2)

    reasoning.append("3. Version resolution (AMENDS chain)")
    resolved = resolve_versions(list(expanded))

    reasoning.append("4. Supersession filter")
    active = filter_superseded(resolved)
    active_ids = set(active)

    reasoning.append("5. Conflict detection")
    conflicts = detect_conflicts(active)

    evidence_chunks = candidates[:10]
    evidence_chunks = [c for c in evidence_chunks if c.get("chunk_id") in active_ids]

    prompt = build_prompt(evidence_chunks, conflicts, query)
    reasoning.append("6. LLM generation")

    llm_answer = generate(SYSTEM_PROMPT, prompt)

    reasoning.append("7. Build source chunks and subgraph")
    sources = _extract_source_chunks(candidates[:10], active_ids)

    from ingestion.neo4j_client import get_subgraph
    graph = get_subgraph(list(expanded))

    return RAGResponse(
        answer=llm_answer,
        sources=sources,
        conflicts=conflicts,
        reasoning_steps=reasoning,
        graph=graph,
    )
