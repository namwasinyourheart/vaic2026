from sqlalchemy import inspect

from app.models import SourceRef


def auth(login, username: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {login(username)['access_token']}"}


def test_source_ref_schema_never_stores_source_text() -> None:
    columns = {column.name for column in inspect(SourceRef).columns}
    forbidden = {"content", "chunk_content", "full_text", "snippet_text", "parsed_content"}
    assert columns.isdisjoint(forbidden)


def test_customer_sees_only_public_documents(client, login) -> None:
    response = client.get("/api/v1/documents", headers=auth(login, "customer"))
    assert response.status_code == 200
    assert response.json()
    assert all(item["access_scope"] == "PUBLIC" for item in response.json())


def test_conversation_sources_are_ids_and_detail_is_proxied(client, login) -> None:
    headers = auth(login, "customer")
    conversations = client.get("/api/v1/conversations", headers=headers).json()
    seeded = next(item for item in conversations if item["title"] == "Hỏi đáp tiền gửi mẫu")
    groups = client.get(f"/api/v1/conversations/{seeded['id']}/sources", headers=headers).json()
    chunk = groups[0]["chunks"][0]
    assert "content" not in chunk
    detail = client.get(f"/api/v1/source-chunks/{chunk['ai_chunk_id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["ai_chunk_id"] == chunk["ai_chunk_id"]


def test_upload_and_background_ingestion(client, login) -> None:
    headers = auth(login, "knowledge")
    response = client.post(
        "/api/v1/knowledge/documents",
        headers=headers,
        data={
            "document_code": "TEST-UPLOAD-001",
            "title": "Test upload",
            "document_type": "REGULATION",
        },
        files={"file": ("test.pdf", b"%PDF-1.4 test", "application/pdf")},
    )
    assert response.status_code in {201, 409}
    if response.status_code == 201:
        status = client.get(
            f"/api/v1/documents/{response.json()['id']}/processing-status",
            headers=headers,
        )
        assert status.status_code == 200
        assert status.json()["status"] == "COMPLETED"


def test_upload_rejects_invalid_file(client, login) -> None:
    response = client.post(
        "/api/v1/knowledge/documents",
        headers=auth(login, "knowledge"),
        data={"document_code": "BAD-001", "title": "Bad", "document_type": "OTHER"},
        files={"file": ("bad.txt", b"not allowed", "text/plain")},
    )
    assert response.status_code == 422


def test_admin_lock_and_unlock(client, login) -> None:
    headers = auth(login, "admin")
    users = client.get("/api/v1/admin/users", headers=headers).json()
    employee = next(item for item in users if item["username"] == "employee")
    assert (
        client.post(f"/api/v1/admin/users/{employee['id']}/lock", headers=headers).status_code
        == 200
    )
    assert (
        client.post(f"/api/v1/admin/users/{employee['id']}/unlock", headers=headers).status_code
        == 200
    )
