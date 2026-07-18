import asyncio
import uuid
from dataclasses import dataclass
from typing import Protocol


@dataclass
class IngestionResult:
    ai_document_id: str
    ai_job_id: str
    status: str = "COMPLETED"


@dataclass
class RAGResult:
    answer: str
    ai_request_id: str
    source_group_id: str
    chunks: list[dict]
    graph_id: str


class AIServiceAdapter(Protocol):
    async def ingest_document(
        self, *, document_id: str, file_key: str, metadata: dict
    ) -> IngestionResult: ...
    async def query(
        self, *, user_id: str, scope: str, question: str, conversation_id: str
    ) -> RAGResult: ...
    async def get_source_chunk(self, ai_chunk_id: str) -> dict: ...
    async def get_retrieval_graph(self, ai_graph_id: str) -> dict: ...
    async def reindex(self, document_id: str, reason: str) -> IngestionResult: ...
    async def get_document_outline(self, ai_document_id: str) -> dict: ...
    async def list_clauses(self, ai_document_id: str) -> list[dict]: ...
    async def get_clause(self, ai_clause_id: str) -> dict: ...
    async def list_chunks(self, ai_document_id: str) -> list[dict]: ...
    async def get_document_graph(self, ai_document_id: str, graph_type: str) -> dict: ...
    async def detect_relations(self, ai_document_id: str) -> list[dict]: ...
    async def detect_conflicts(self, ai_document_id: str) -> list[dict]: ...
    async def analyze_impact(
        self, source_ai_document_id: str, target_ai_document_id: str
    ) -> dict: ...


class MockAIServiceAdapter:
    async def ingest_document(
        self, *, document_id: str, file_key: str, metadata: dict
    ) -> IngestionResult:
        await asyncio.sleep(0.01)
        return IngestionResult(f"rag_{document_id}", f"job_{uuid.uuid4().hex}")

    async def query(
        self, *, user_id: str, scope: str, question: str, conversation_id: str
    ) -> RAGResult:
        await asyncio.sleep(0.01)
        chunk_id = f"chunk_{uuid.uuid4().hex[:12]}"
        group_id = f"source_group_{uuid.uuid4().hex[:12]}"
        graph_id = f"graph_{uuid.uuid4().hex[:12]}"
        return RAGResult(
            "Đây là câu trả lời mock từ AI/RAG Service. Nội dung source chỉ được truy xuất bằng ID.",
            f"request_{uuid.uuid4().hex[:12]}",
            group_id,
            [{"ai_chunk_id": chunk_id, "rank": 1, "relevance_score": 0.96}],
            graph_id,
        )

    async def get_source_chunk(self, ai_chunk_id: str) -> dict:
        await asyncio.sleep(0.01)
        return {
            "ai_chunk_id": ai_chunk_id,
            "document_name": "Mock document",
            "path": "Điều 1 → Khoản 1",
            "content": "Nội dung mock do AI Service sở hữu.",
            "access_status": "AVAILABLE",
        }

    async def get_retrieval_graph(self, ai_graph_id: str) -> dict:
        await asyncio.sleep(0.01)
        return {"ai_graph_id": ai_graph_id, "nodes": [], "edges": []}

    async def reindex(self, document_id: str, reason: str) -> IngestionResult:
        await asyncio.sleep(0.01)
        return IngestionResult(f"rag_{document_id}", f"job_{uuid.uuid4().hex}", "QUEUED")

    async def get_document_outline(self, ai_document_id: str) -> dict:
        return {
            "ai_document_id": ai_document_id,
            "items": [
                {
                    "id": f"clause_{ai_document_id}_1",
                    "type": "CLAUSE",
                    "label": "Điều 1",
                    "children": [],
                }
            ],
        }

    async def list_clauses(self, ai_document_id: str) -> list[dict]:
        return [
            {
                "ai_clause_id": f"clause_{ai_document_id}_1",
                "ai_document_id": ai_document_id,
                "path": "Điều 1 → Khoản 1",
                "title": "Phạm vi áp dụng",
                "effective_status": "EFFECTIVE",
                "access_scope": "INTERNAL",
            }
        ]

    async def get_clause(self, ai_clause_id: str) -> dict:
        return {
            "ai_clause_id": ai_clause_id,
            "path": "Điều 1 → Khoản 1",
            "content": "Nội dung điều khoản mock thuộc AI Service.",
            "effective_status": "EFFECTIVE",
            "access_scope": "INTERNAL",
        }

    async def list_chunks(self, ai_document_id: str) -> list[dict]:
        return [
            {
                "ai_chunk_id": f"chunk_{ai_document_id}_1",
                "ai_document_id": ai_document_id,
                "ai_clause_id": f"clause_{ai_document_id}_1",
                "path": "Điều 1 → Khoản 1",
                "content_type": "CLAUSE",
                "effective_status": "EFFECTIVE",
                "access_scope": "INTERNAL",
            }
        ]

    async def get_document_graph(self, ai_document_id: str, graph_type: str) -> dict:
        return {
            "ai_graph_id": f"{graph_type}_{ai_document_id}",
            "graph_type": graph_type,
            "nodes": [{"id": ai_document_id, "type": "document", "label": "Văn bản chính"}],
            "edges": [],
        }

    async def detect_relations(self, ai_document_id: str) -> list[dict]:
        return [
            {
                "ai_relation_id": f"relation_{uuid.uuid4().hex[:12]}",
                "source_ai_document_id": ai_document_id,
                "target_ai_document_id": ai_document_id,
                "relation_type": "REFERENCES",
                "confidence": 0.91,
                "review_status": "PENDING_REVIEW",
                "source_clause_ids": [f"clause_{ai_document_id}_1"],
                "target_clause_ids": [f"clause_{ai_document_id}_1"],
            }
        ]

    async def detect_conflicts(self, ai_document_id: str) -> list[dict]:
        return [
            {
                "ai_conflict_id": f"conflict_{uuid.uuid4().hex[:12]}",
                "left_ai_document_id": ai_document_id,
                "right_ai_document_id": ai_document_id,
                "conflict_type": "VERSION_AMBIGUITY",
                "severity": "MEDIUM",
                "review_status": "PENDING_REVIEW",
                "resolution_status": "UNRESOLVED",
                "confidence": 0.82,
            }
        ]

    async def analyze_impact(self, source_ai_document_id: str, target_ai_document_id: str) -> dict:
        return {
            "ai_analysis_id": f"impact_{uuid.uuid4().hex[:12]}",
            "status": "PENDING_REVIEW",
            "effects": [
                {
                    "effect_type": "AMENDS",
                    "source_clause_id": f"clause_{source_ai_document_id}_1",
                    "target_clause_id": f"clause_{target_ai_document_id}_1",
                    "confidence": 0.9,
                }
            ],
        }


def get_ai_adapter() -> AIServiceAdapter:
    return MockAIServiceAdapter()
