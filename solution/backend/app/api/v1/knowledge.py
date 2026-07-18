import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...dependencies import require_permission
from ...models import (
    AIConflictRef,
    AIDocumentRef,
    AIRelationRef,
    Document,
    ImpactAnalysis,
    ProcessingJob,
    ReindexJob,
    RelationReview,
    User,
)
from ...services.ai_adapter import get_ai_adapter
from .documents import router as document_router

# Compatibility router: the same document operations are mounted under
# /api/v1/knowledge/documents for Compliance Officer clients.
router = APIRouter(prefix="/knowledge", tags=["Compliance Officer"])
router.include_router(document_router)


class RelationCreate(BaseModel):
    source_document_id: str
    target_document_id: str
    relation_type: str
    source_ai_clause_ids: list[str] = Field(default_factory=list)
    target_ai_clause_ids: list[str] = Field(default_factory=list)
    effective_from: datetime | None = None
    note: str | None = None


class ReviewRequest(BaseModel):
    decision: str
    reason: str | None = None


class ImpactCreate(BaseModel):
    source_document_id: str
    target_document_id: str


class ConflictResolution(BaseModel):
    status: str
    preferred_ai_clause_id: str | None = None
    reason: str | None = None


async def _document(document_id: str, db: AsyncSession) -> Document:
    item = await db.get(Document, document_id)
    if not item or item.deleted_at:
        raise HTTPException(404, "Document not found")
    return item


@router.post("/relations/detect")
async def detect_relations(
    document_id: str,
    user: User = Depends(require_permission("relation.update")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    document = await _document(document_id, db)
    ref = (
        await db.execute(select(AIDocumentRef).where(AIDocumentRef.document_id == document.id))
    ).scalar_one_or_none()
    results = await get_ai_adapter().detect_relations(
        ref.ai_document_id if ref else f"rag_{document.id}"
    )
    created = []
    for item in results:
        relation = AIRelationRef(
            id=str(uuid.uuid4()),
            source_document_id=document.id,
            target_document_id=document.id,
            ai_relation_id=item["ai_relation_id"],
            relation_type=item["relation_type"],
            sync_status="SYNCED",
            created_by=user.id,
        )
        db.add(relation)
        created.append({"id": relation.id, **item})
    await db.commit()
    return {"items": created}


@router.post("/documents/{document_id}/relations/detect")
async def detect_document_relations(
    document_id: str,
    user: User = Depends(require_permission("relation.update")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await detect_relations(document_id, user, db)


@router.post("/relations")
async def create_relation(
    payload: RelationCreate,
    user: User = Depends(require_permission("relation.create")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    source = await _document(payload.source_document_id, db)
    target = await _document(payload.target_document_id, db)
    relation = AIRelationRef(
        id=str(uuid.uuid4()),
        source_document_id=source.id,
        target_document_id=target.id,
        ai_relation_id=f"manual_{uuid.uuid4().hex[:12]}",
        relation_type=payload.relation_type,
        sync_status="PENDING",
        created_by=user.id,
    )
    db.add(relation)
    await db.commit()
    await db.refresh(relation)
    return {
        "id": relation.id,
        "ai_relation_id": relation.ai_relation_id,
        "relation_type": relation.relation_type,
        "sync_status": relation.sync_status,
    }


@router.patch("/relations/{relation_id}")
async def update_relation(
    relation_id: str,
    payload: RelationCreate,
    user: User = Depends(require_permission("relation.update")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    relation = await db.get(AIRelationRef, relation_id)
    if not relation:
        raise HTTPException(404, "Relation not found")
    relation.relation_type = payload.relation_type
    relation.sync_status = "PENDING"
    await db.commit()
    return {
        "id": relation.id,
        "relation_type": relation.relation_type,
        "sync_status": relation.sync_status,
    }


@router.post("/relations/{relation_id}/review")
async def review_relation(
    relation_id: str,
    payload: ReviewRequest,
    user: User = Depends(require_permission("relation.update")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    relation = await db.get(AIRelationRef, relation_id)
    if not relation:
        raise HTTPException(404, "Relation not found")
    db.add(
        RelationReview(
            id=str(uuid.uuid4()),
            ai_relation_ref_id=relation.id,
            reviewer_id=user.id,
            decision=payload.decision,
            reason=payload.reason,
            reviewed_at=datetime.now(timezone.utc),
        )
    )
    relation.sync_status = "SYNCED" if payload.decision.upper() == "APPROVED" else "REJECTED"
    await db.commit()
    return {
        "id": relation.id,
        "review_status": payload.decision.upper(),
        "sync_status": relation.sync_status,
    }


@router.get("/documents/{document_id}/conflicts")
async def document_conflicts(
    document_id: str,
    _user: User = Depends(require_permission("document.read")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    await _document(document_id, db)
    rows = (
        (
            await db.execute(
                select(AIConflictRef).where(
                    (AIConflictRef.left_document_id == document_id)
                    | (AIConflictRef.right_document_id == document_id)
                )
            )
        )
        .scalars()
        .all()
    )
    return [
        {
            "id": x.id,
            "ai_conflict_id": x.ai_conflict_id,
            "conflict_type": x.conflict_type,
            "severity": x.severity,
            "review_status": x.review_status,
            "resolution_status": x.resolution_status,
        }
        for x in rows
    ]


@router.post("/documents/{document_id}/conflicts/detect")
async def detect_conflicts(
    document_id: str,
    user: User = Depends(require_permission("relation.update")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    document = await _document(document_id, db)
    ref = (
        await db.execute(select(AIDocumentRef).where(AIDocumentRef.document_id == document.id))
    ).scalar_one_or_none()
    results = await get_ai_adapter().detect_conflicts(
        ref.ai_document_id if ref else f"rag_{document.id}"
    )
    for item in results:
        db.add(
            AIConflictRef(
                id=str(uuid.uuid4()),
                left_document_id=document.id,
                ai_conflict_id=item["ai_conflict_id"],
                conflict_type=item["conflict_type"],
                severity=item["severity"],
                review_status=item["review_status"],
                resolution_status=item["resolution_status"],
                sync_status="SYNCED",
            )
        )
    await db.commit()
    return {"items": results}


@router.put("/conflicts/{conflict_id}/resolution")
async def resolve_conflict(
    conflict_id: str,
    payload: ConflictResolution,
    user: User = Depends(require_permission("relation.update")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    conflict = await db.get(AIConflictRef, conflict_id)
    if not conflict:
        raise HTTPException(404, "Conflict not found")
    conflict.resolution_status = payload.status
    conflict.preferred_ai_clause_id = payload.preferred_ai_clause_id
    conflict.review_status = "APPROVED"
    conflict.reviewed_by = user.id
    conflict.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    return {
        "id": conflict.id,
        "resolution_status": conflict.resolution_status,
        "preferred_ai_clause_id": conflict.preferred_ai_clause_id,
    }


@router.post("/impact-analyses")
async def impact_analysis(
    payload: ImpactCreate,
    user: User = Depends(require_permission("relation.update")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    source = await _document(payload.source_document_id, db)
    target = await _document(payload.target_document_id, db)
    sref = (
        await db.execute(select(AIDocumentRef).where(AIDocumentRef.document_id == source.id))
    ).scalar_one_or_none()
    tref = (
        await db.execute(select(AIDocumentRef).where(AIDocumentRef.document_id == target.id))
    ).scalar_one_or_none()
    result = await get_ai_adapter().analyze_impact(
        sref.ai_document_id if sref else f"rag_{source.id}",
        tref.ai_document_id if tref else f"rag_{target.id}",
    )
    analysis = ImpactAnalysis(
        id=str(uuid.uuid4()),
        source_document_id=source.id,
        target_document_id=target.id,
        ai_analysis_id=result["ai_analysis_id"],
        status=result["status"],
        effect_count=len(result["effects"]),
        requested_by=user.id,
    )
    db.add(analysis)
    await db.commit()
    return {
        "id": analysis.id,
        "ai_analysis_id": analysis.ai_analysis_id,
        "status": analysis.status,
        "effects": result["effects"],
    }


@router.get("/jobs/{job_id}")
async def job_status(
    job_id: str,
    _user: User = Depends(require_permission("document.reindex")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    processing = await db.get(ProcessingJob, job_id)
    if processing:
        return {
            "id": processing.id,
            "type": processing.job_type,
            "status": processing.status,
            "current_step": processing.current_step,
            "progress_percent": processing.progress_percent,
            "error_code": processing.error_code,
            "error_message": processing.error_message,
        }
    batch = await db.get(ReindexJob, job_id)
    if batch:
        return {
            "id": batch.id,
            "type": "BULK_REINDEX",
            "status": batch.status,
            "total_documents": batch.total_documents,
            "completed_documents": batch.completed_documents,
            "failed_documents": batch.failed_documents,
        }
    raise HTTPException(404, "Job not found")
