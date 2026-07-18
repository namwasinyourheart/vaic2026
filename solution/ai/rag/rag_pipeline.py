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
class RAGResponse:
    answer: str
    sources: list[str]
    conflicts: list[dict]
    reasoning_steps: list[str]
    graph: dict | None = None


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

    reasoning.append("5. Conflict detection")
    conflicts = detect_conflicts(active)

    evidence_chunks = candidates[:10]
    evidence_chunks = [c for c in evidence_chunks if c.get("chunk_id") in set(active)]

    prompt = build_prompt(evidence_chunks, conflicts, query)
    reasoning.append("6. LLM generation")

    llm_answer = generate(SYSTEM_PROMPT, prompt)

    source_ids = [c.get("chunk_id", "") for c in evidence_chunks[:5]]

    reasoning.append("7. Build subgraph for visualization")
    from ingestion.neo4j_client import get_subgraph
    graph = get_subgraph(list(expanded))

    return RAGResponse(
        answer=llm_answer,
        sources=source_ids,
        conflicts=conflicts,
        reasoning_steps=reasoning,
        graph=graph,
    )
