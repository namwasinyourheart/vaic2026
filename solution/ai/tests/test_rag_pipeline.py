from unittest.mock import patch, MagicMock
import pytest

from rag.rag_pipeline import RAGResponse, answer


class TestRAGResponse:
    def test_create_response(self):
        response = RAGResponse(
            answer="Test answer",
            sources=[{"chunk_id": "CRD-C01-3.1"}],
            conflicts=[],
            reasoning_steps=["step1"],
        )
        assert response.answer == "Test answer"
        assert response.sources == [{"chunk_id": "CRD-C01-3.1"}]
        assert response.conflicts == []
        assert response.graph is None

    def test_create_response_with_graph(self):
        graph = {"nodes": [{"id": "CRD", "type": "Domain"}], "edges": []}
        response = RAGResponse(
            answer="Test",
            sources=[],
            conflicts=[],
            reasoning_steps=[],
            graph=graph,
        )
        assert response.graph == graph


class TestAnswer:
    @pytest.mark.asyncio
    async def test_answer_basic_flow(self):
        mock_candidates = [
            {"chunk_id": "CRD-C01-3.1", "document_id": "CRD-C01", "text": "Lãi suất 9%"},
            {"chunk_id": "LGP-P01-2.2", "document_id": "LGP-P01", "text": "Giới hạn 9%"},
        ]

        with patch("rag.rag_pipeline.hybrid_search", return_value=mock_candidates), \
             patch("rag.rag_pipeline.expand_references", return_value={"CRD-C01-3.1", "LGP-P01-2.2"}), \
             patch("rag.rag_pipeline.resolve_versions", return_value=["CRD-C01-3.1", "LGP-P01-2.2"]), \
             patch("rag.rag_pipeline.filter_superseded", return_value=["CRD-C01-3.1", "LGP-P01-2.2"]), \
             patch("rag.rag_pipeline.detect_conflicts", return_value=[]), \
             patch("rag.rag_pipeline.generate", return_value="Lãi suất là 9%/năm"), \
             patch("ingestion.neo4j_client.get_subgraph", return_value={"nodes": [], "edges": []}):

            response = await answer("Lãi suất vay tín chấp?")

            assert isinstance(response, RAGResponse)
            assert "9%/năm" in response.answer
            assert len(response.sources) <= 5
            assert response.conflicts == []
            assert response.graph == {"nodes": [], "edges": []}
            assert len(response.reasoning_steps) == 7

    @pytest.mark.asyncio
    async def test_answer_with_conflicts(self):
        mock_candidates = [
            {"chunk_id": "CRD-R01-v2-3.2", "document_id": "CRD-R01-v2", "text": "text1"},
            {"chunk_id": "AML-P01-3.2", "document_id": "AML-P01", "text": "text2"},
        ]
        mock_conflicts = [{"clause_a": "CRD-R01-v2-3.2", "clause_b": "AML-P01-3.2"}]

        with patch("rag.rag_pipeline.hybrid_search", return_value=mock_candidates), \
             patch("rag.rag_pipeline.expand_references", return_value=set(mock_candidates[0]["chunk_id"])), \
             patch("rag.rag_pipeline.resolve_versions", return_value=[mock_candidates[0]["chunk_id"]]), \
             patch("rag.rag_pipeline.filter_superseded", return_value=[mock_candidates[0]["chunk_id"]]), \
             patch("rag.rag_pipeline.detect_conflicts", return_value=mock_conflicts), \
             patch("rag.rag_pipeline.generate", return_value="Có mâu thuẫn"), \
             patch("ingestion.neo4j_client.get_subgraph", return_value={"nodes": [], "edges": []}):

            response = await answer("test conflict")

            assert len(response.conflicts) == 1
            assert response.conflicts[0]["clause_a"] == "CRD-R01-v2-3.2"

    @pytest.mark.asyncio
    async def test_answer_sources_limit(self):
        mock_candidates = [
            {"chunk_id": f"DOC-P01-{i}.1", "document_id": "DOC-P01", "text": f"text {i}"}
            for i in range(15)
        ]

        with patch("rag.rag_pipeline.hybrid_search", return_value=mock_candidates), \
             patch("rag.rag_pipeline.expand_references", return_value=set(c["chunk_id"] for c in mock_candidates)), \
             patch("rag.rag_pipeline.resolve_versions", return_value=[c["chunk_id"] for c in mock_candidates]), \
             patch("rag.rag_pipeline.filter_superseded", return_value=[c["chunk_id"] for c in mock_candidates]), \
             patch("rag.rag_pipeline.detect_conflicts", return_value=[]), \
             patch("rag.rag_pipeline.generate", return_value="answer"), \
             patch("ingestion.neo4j_client.get_subgraph", return_value={"nodes": [], "edges": []}):

            response = await answer("test")
            assert len(response.sources) <= 10
