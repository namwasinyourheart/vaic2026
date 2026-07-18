def test_bank_employee_can_read_document_ai_views(client, login):
    session = login("employee")
    headers = {"Authorization": f"Bearer {session['access_token']}"}
    documents = client.get("/api/v1/documents", headers=headers).json()
    document_id = documents[0]["id"]
    assert client.get(f"/api/v1/documents/{document_id}/clauses", headers=headers).status_code == 200
    assert client.get(f"/api/v1/documents/{document_id}/chunks", headers=headers).status_code == 200
    assert client.get(f"/api/v1/documents/{document_id}/knowledge-graph", headers=headers).status_code == 200


def test_knowledge_manager_can_detect_relation_conflict_and_impact(client, login):
    session = login("knowledge")
    headers = {"Authorization": f"Bearer {session['access_token']}"}
    documents = client.get("/api/v1/documents", headers=headers).json()
    document_id = documents[0]["id"]
    relation = client.post(f"/api/v1/knowledge/documents/{document_id}/relations/detect", headers=headers)
    assert relation.status_code == 200
    conflict = client.post(f"/api/v1/knowledge/documents/{document_id}/conflicts/detect", headers=headers)
    assert conflict.status_code == 200
    impact = client.post("/api/v1/knowledge/impact-analyses", headers=headers, json={"source_document_id": document_id, "target_document_id": document_id})
    assert impact.status_code == 200
