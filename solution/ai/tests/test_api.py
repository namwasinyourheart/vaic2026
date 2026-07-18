from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from api import app
    return TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestRootEndpoint:
    def test_root_returns_message(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "docs" in data


class TestRAGEndpoint:
    def test_rag_missing_query(self, client):
        response = client.post("/rag", json={})
        assert response.status_code == 422

    def test_rag_empty_query(self, client):
        response = client.post("/rag", json={"query": ""})
        assert response.status_code == 200

    @patch("api.routes._ensure_loaded")
    @patch("rag.rag_pipeline.answer")
    def test_rag_success(self, mock_rag_answer, mock_ensure_loaded, client):
        mock_response = MagicMock()
        mock_response.answer = "Lãi suất là 9%/năm"
        mock_response.sources = [
            {"chunk_id": "CRD-C01-3.1", "document_id": "CRD-C01", "document_type": "clause",
             "section_title": "Điều 3", "text": "Lãi suất 9%", "token_count": 10,
             "domain": "Tín dụng", "version": "1.0", "effective_date": "2024-01-01",
             "expiry_date": None, "status": "Active", "language": "vi", "score": 0.95}
        ]
        mock_response.conflicts = []
        mock_response.graph = {"nodes": [], "edges": []}
        mock_rag_answer.return_value = mock_response

        response = client.post("/rag", json={"query": "Lãi suất vay tín chấp?"})
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "sources" in data
        assert "conflicts" in data
        assert "graph" in data
        assert data["answer"] == "Lãi suất là 9%/năm"
        assert data["sources"][0]["chunk_id"] == "CRD-C01-3.1"

    @patch("api.routes._ensure_loaded")
    @patch("rag.rag_pipeline.answer", side_effect=Exception("LLM error"))
    def test_rag_internal_error(self, mock_rag_answer, mock_ensure_loaded, client):
        response = client.post("/rag", json={"query": "test"})
        assert response.status_code == 500
        assert "detail" in response.json()
