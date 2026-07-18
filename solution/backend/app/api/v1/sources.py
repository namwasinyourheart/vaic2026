from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...dependencies import current_user
from ...models import (
    Conversation,
    Message,
    RetrievalGraphRef,
    SourceGroup,
    SourceRef,
    User,
)
from ...services.ai_adapter import get_ai_adapter

router = APIRouter(tags=["Sources"])


@router.get("/conversations/{conversation_id}/sources")
async def conversation_sources(
    conversation_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    conversation = await db.get(Conversation, conversation_id)
    if not conversation or conversation.owner_user_id != user.id:
        raise HTTPException(404, "Conversation not found")
    groups = (
        (
            await db.execute(
                select(SourceGroup).where(SourceGroup.conversation_id == conversation_id)
            )
        )
        .scalars()
        .all()
    )
    response = []
    for group in groups:
        refs = (
            (
                await db.execute(
                    select(SourceRef)
                    .where(SourceRef.source_group_id == group.id)
                    .order_by(SourceRef.rank)
                )
            )
            .scalars()
            .all()
        )
        response.append(
            {
                "id": group.id,
                "ai_source_group_id": group.ai_source_group_id,
                "question": group.question_snapshot,
                "chunks": [
                    {
                        "id": item.id,
                        "ai_chunk_id": item.ai_chunk_id,
                        "rank": item.rank,
                        "relevance_score": item.relevance_score,
                        "access_status": item.access_status,
                    }
                    for item in refs
                ],
            }
        )
    return response


@router.get("/messages/{message_id}/sources")
async def message_sources(
    message_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    message = await db.get(Message, message_id)
    if not message:
        raise HTTPException(404, "Message not found")
    conversation = await db.get(Conversation, message.conversation_id)
    if not conversation or conversation.owner_user_id != user.id:
        raise HTTPException(404, "Message not found")
    group = (
        await db.execute(select(SourceGroup).where(SourceGroup.assistant_message_id == message_id))
    ).scalar_one_or_none()
    if not group:
        return []
    refs = (
        (
            await db.execute(
                select(SourceRef)
                .where(SourceRef.source_group_id == group.id)
                .order_by(SourceRef.rank)
            )
        )
        .scalars()
        .all()
    )
    return [
        {
            "id": group.id,
            "ai_source_group_id": group.ai_source_group_id,
            "question": group.question_snapshot,
            "chunks": [
                {
                    "id": item.id,
                    "ai_chunk_id": item.ai_chunk_id,
                    "rank": item.rank,
                    "relevance_score": item.relevance_score,
                    "access_status": item.access_status,
                }
                for item in refs
            ],
        }
    ]


@router.get("/source-chunks/{ai_chunk_id}")
async def source_chunk(
    ai_chunk_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    ref = (
        await db.execute(
            select(SourceRef)
            .join(SourceGroup, SourceGroup.id == SourceRef.source_group_id)
            .join(Conversation, Conversation.id == SourceGroup.conversation_id)
            .where(
                SourceRef.ai_chunk_id == ai_chunk_id,
                Conversation.owner_user_id == user.id,
                SourceRef.access_status != "DENIED",
            )
        )
    ).scalar_one_or_none()
    if not ref:
        raise HTTPException(404, "Source chunk not found")
    return await get_ai_adapter().get_source_chunk(ai_chunk_id)


@router.get("/messages/{message_id}/retrieval-graph")
async def retrieval_graph(
    message_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    message = await db.get(Message, message_id)
    if not message:
        raise HTTPException(404, "Message not found")
    conversation = await db.get(Conversation, message.conversation_id)
    if not conversation or conversation.owner_user_id != user.id:
        raise HTTPException(404, "Message not found")
    ref = (
        await db.execute(
            select(RetrievalGraphRef).where(RetrievalGraphRef.assistant_message_id == message_id)
        )
    ).scalar_one_or_none()
    if not ref:
        raise HTTPException(404, "Graph not found")
    return await get_ai_adapter().get_retrieval_graph(ref.ai_graph_id)
