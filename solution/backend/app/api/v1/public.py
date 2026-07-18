import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ...services.ai_adapter import get_ai_adapter
from ...services.security import create_guest_access_token, decode_guest_access_token

router = APIRouter(prefix="/public", tags=["Public Guest Chat"])


class GuestChatRequest(BaseModel):
    guest_session_id: str = Field(min_length=1, max_length=120)
    question: str = Field(min_length=1, max_length=10000)


def guest_claims(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Guest access token required")
    try:
        return decode_guest_access_token(authorization.split(" ", 1)[1])
    except Exception as exc:
        raise HTTPException(401, "Invalid or expired guest access token") from exc


@router.post("/chat")
async def guest_chat(payload: GuestChatRequest) -> dict:
    request_id = str(uuid.uuid4())
    result = await get_ai_adapter().query(user_id=f"guest:{payload.guest_session_id}", scope="PUBLIC",
                                          question=payload.question, conversation_id=request_id)
    chunk_ids = [item["ai_chunk_id"] for item in result.chunks]
    token = create_guest_access_token(request_id, result.source_group_id, result.graph_id, chunk_ids)
    return {"guest_request_id": request_id, "answer": result.answer,
            "ai_source_group_id": result.source_group_id, "source_refs": result.chunks,
            "ai_graph_id": result.graph_id, "guest_access_token": token,
            "created_at": datetime.now(timezone.utc)}


@router.get("/source-groups/{group_id}/chunks/{chunk_id}")
async def guest_source(group_id: str, chunk_id: str, authorization: str | None = Header(default=None)) -> dict:
    claims = guest_claims(authorization)
    if claims.get("source_group_id") != group_id or chunk_id not in claims.get("chunk_ids", []):
        raise HTTPException(403, "Source is not available for this guest request")
    return await get_ai_adapter().get_source_chunk(chunk_id)


@router.get("/graphs/{graph_id}")
async def guest_graph(graph_id: str, authorization: str | None = Header(default=None)) -> dict:
    claims = guest_claims(authorization)
    if claims.get("graph_id") != graph_id:
        raise HTTPException(403, "Graph is not available for this guest request")
    return await get_ai_adapter().get_retrieval_graph(graph_id)
