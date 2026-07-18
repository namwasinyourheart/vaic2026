import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...config import get_settings
from ...database import SessionLocal, get_db
from ...dependencies import current_user, require_permission, user_role_codes
from ...models import (
    AIDocumentRef,
    AIRelationRef,
    Document,
    DocumentFile,
    DocumentKeyword,
    DocumentVersion,
    ProcessingJob,
    ReindexJob,
    ReindexJobDocument,
    User,
)
from ...schemas import (
    BulkReindexRequest,
    DocumentOut,
    DocumentUpdate,
    ExpireRequest,
    ReindexRequest,
)
from ...services.ai_adapter import get_ai_adapter
from ...services.storage_service import get_storage

router = APIRouter(prefix="/documents", tags=["Documents"])
ALLOWED_EXTENSIONS = {"pdf", "docx", "png", "jpg", "jpeg", "md"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "text/markdown",
    "text/plain",
    "text/x-markdown",
}


def to_out(document: Document) -> DocumentOut:
    return DocumentOut.model_validate(document)


async def run_ingestion(job_id: str, document_id: str, file_key: str, metadata: dict) -> None:
    async with SessionLocal() as db:
        job = await db.get(ProcessingJob, job_id)
        if not job:
            return
        job.status = "PROCESSING"
        job.current_step = "INGEST"
        job.progress_percent = 10
        job.started_at = datetime.now(timezone.utc)
        await db.commit()
        try:
            result = await get_ai_adapter().ingest_document(
                document_id=document_id, file_key=file_key, metadata=metadata
            )
            document = await db.get(Document, document_id)
            job.ai_job_id = result.ai_job_id
            job.status = result.status
            job.progress_percent = 100
            job.current_step = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            if document:
                document.processing_status = "COMPLETED"
                document.index_status = "INDEXED"
            reference = (
                await db.execute(
                    select(AIDocumentRef).where(AIDocumentRef.document_id == document_id)
                )
            ).scalar_one_or_none()
            if reference:
                reference.ai_document_id = result.ai_document_id
                reference.sync_status = "SYNCED"
                reference.last_sync_error = None
                reference.last_synced_at = datetime.now(timezone.utc)
            else:
                db.add(
                    AIDocumentRef(
                        id=str(uuid.uuid4()),
                        document_id=document_id,
                        ai_document_id=result.ai_document_id,
                        sync_status="SYNCED",
                        last_synced_at=datetime.now(timezone.utc),
                    )
                )
        except Exception as exc:
            job.status = "FAILED"
            job.error_message = str(exc)
            job.current_step = "FAILED"
            job.completed_at = datetime.now(timezone.utc)
            document = await db.get(Document, document_id)
            if document:
                document.processing_status = "FAILED"
        await db.commit()


async def run_bulk_reindex(batch_id: str) -> None:
    async with SessionLocal() as db:
        batch = await db.get(ReindexJob, batch_id)
        if not batch:
            return
        batch.status = "PROCESSING"
        batch.started_at = datetime.now(timezone.utc)
        await db.commit()
        items = (
            (
                await db.execute(
                    select(ReindexJobDocument).where(ReindexJobDocument.job_id == batch_id)
                )
            )
            .scalars()
            .all()
        )
        for item in items:
            try:
                item.status = "PROCESSING"
                await db.commit()
                result = await get_ai_adapter().reindex(item.document_id, batch.reason)
                item.ai_job_id = result.ai_job_id
                item.status = "COMPLETED"
                item.completed_at = datetime.now(timezone.utc)
                batch.completed_documents += 1
                document = await db.get(Document, item.document_id)
                if document:
                    document.index_status = "INDEXED"
            except Exception as exc:
                item.status = "FAILED"
                item.error_code = type(exc).__name__
                item.completed_at = datetime.now(timezone.utc)
                batch.failed_documents += 1
            await db.commit()
        batch.status = "COMPLETED" if batch.failed_documents == 0 else "PARTIAL_FAILED"
        batch.completed_at = datetime.now(timezone.utc)
        await db.commit()


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    db: AsyncSession = Depends(get_db), user: User = Depends(current_user)
) -> list[DocumentOut]:
    query = select(Document).where(Document.deleted_at.is_(None))
    if "ROLE_CUSTOMER" in await user_role_codes(user, db):
        query = query.where(Document.access_scope == "PUBLIC")
    result = await db.execute(query.order_by(Document.updated_at.desc()))
    return [to_out(item) for item in result.scalars().all()]


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
) -> DocumentOut:
    document = await db.get(Document, document_id)
    if not document or document.deleted_at:
        raise HTTPException(404, "Document not found")
    if document.access_scope != "PUBLIC" and "ROLE_CUSTOMER" in await user_role_codes(user, db):
        raise HTTPException(403, "Document access denied")
    return to_out(document)


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
) -> StreamingResponse:
    document = await db.get(Document, document_id)
    if (
        document
        and document.access_scope != "PUBLIC"
        and "ROLE_CUSTOMER" in await user_role_codes(user, db)
    ):
        raise HTTPException(403, "Document access denied")
    file = (
        await db.execute(
            select(DocumentFile).where(
                DocumentFile.document_id == document_id,
                DocumentFile.is_current.is_(True),
            )
        )
    ).scalar_one_or_none()
    if not document or not file:
        raise HTTPException(404, "File not found")
    try:
        stream = await get_storage().download(file.storage_key)
    except FileNotFoundError as exc:
        raise HTTPException(404, "Stored file not found") from exc
    return StreamingResponse(
        stream,
        media_type=file.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{file.original_file_name}"'},
    )


@router.get("/{document_id}/versions")
async def versions(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(current_user),
) -> list[dict]:
    result = await db.execute(
        select(DocumentVersion)
        .where(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_number.desc())
    )
    return [
        {
            "id": item.id,
            "version_number": item.version_number,
            "version_label": item.version_label,
            "status": item.status,
            "effective_from": item.effective_from,
            "effective_to": item.effective_to,
        }
        for item in result.scalars().all()
    ]


@router.get("/{document_id}/timeline")
async def document_timeline(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(current_user),
) -> list[dict]:
    versions_result = await db.execute(
        select(DocumentVersion)
        .where(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.created_at.desc())
    )
    jobs_result = await db.execute(
        select(ProcessingJob)
        .where(ProcessingJob.document_id == document_id)
        .order_by(ProcessingJob.created_at.desc())
    )
    events = [
        {
            "id": item.id,
            "type": "VERSION_CREATED",
            "status": item.status,
            "description": item.change_summary or item.version_label,
            "created_at": item.created_at,
        }
        for item in versions_result.scalars().all()
    ]
    events.extend(
        {
            "id": item.id,
            "type": item.job_type,
            "status": item.status,
            "description": item.current_step,
            "created_at": item.created_at,
        }
        for item in jobs_result.scalars().all()
    )
    return sorted(events, key=lambda item: item["created_at"], reverse=True)


@router.get("/{document_id}/relations")
async def document_relations(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(current_user),
) -> list[dict]:
    result = await db.execute(
        select(AIRelationRef).where(
            (AIRelationRef.source_document_id == document_id)
            | (AIRelationRef.target_document_id == document_id)
        )
    )
    return [
        {
            "id": item.id,
            "source_document_id": item.source_document_id,
            "target_document_id": item.target_document_id,
            "ai_relation_id": item.ai_relation_id,
            "relation_type": item.relation_type,
            "sync_status": item.sync_status,
        }
        for item in result.scalars().all()
    ]


@router.get("/{document_id}/processing-status")
async def processing_status(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(current_user),
) -> dict:
    result = await db.execute(
        select(ProcessingJob)
        .where(ProcessingJob.document_id == document_id)
        .order_by(ProcessingJob.created_at.desc())
    )
    job = result.scalars().first()
    if not job:
        raise HTTPException(404, "Job not found")
    return {
        "id": job.id,
        "status": job.status,
        "current_step": job.current_step,
        "progress_percent": job.progress_percent,
        "error_message": job.error_message,
    }


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    document_code: str = Form(...),
    title: str = Form(...),
    document_type: str = Form(...),
    issuing_unit: str = Form(""),
    business_domain: str = Form(""),
    access_scope: str = Form("INTERNAL"),
    issued_at: str = Form(None),
    effective_from: str = Form(None),
    effective_to: str = Form(None),
    user: User = Depends(require_permission("document.upload")),
    db: AsyncSession = Depends(get_db),
) -> DocumentOut:
    extension = Path(file.filename or "").suffix.lower().lstrip(".")
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(422, "Only PDF, DOCX, Markdown (.md) and scanned image files are supported")
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(422, "File MIME type is not supported")
    content = await file.read()
    if len(content) > get_settings().max_upload_bytes:
        raise HTTPException(422, "File is too large")
    exists = (
        await db.execute(select(Document).where(Document.document_code == document_code))
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(409, "Document code already exists")
    document_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())
    key = f"documents/{document_id}/v1/original.{extension}"
    stored = await get_storage().upload(
        BytesIO(content),
        key,
        file.content_type or "application/octet-stream",
    )
    document = Document(
        id=document_id,
        document_code=document_code,
        title=title,
        document_type=document_type,
        issuing_unit=issuing_unit or None,
        business_domain=business_domain or None,
        access_scope=access_scope,
        issued_at=datetime.fromisoformat(issued_at) if issued_at else None,
        effective_from=datetime.fromisoformat(effective_from) if effective_from else None,
        effective_to=datetime.fromisoformat(effective_to) if effective_to else None,
        processing_status="QUEUED",
        index_status="NOT_INDEXED",
        created_by=user.id,
        updated_by=user.id,
    )
    version = DocumentVersion(
        id=version_id,
        document_id=document_id,
        version_number=1,
        version_label="v1.0",
        created_by=user.id,
    )
    document.current_version_id = version_id
    db.add_all(
        [
            document,
            version,
            DocumentFile(
                id=str(uuid.uuid4()),
                document_id=document_id,
                version_id=version_id,
                original_file_name=file.filename or key,
                storage_key=stored.key,
                mime_type=file.content_type or "application/octet-stream",
                file_extension=extension,
                file_size=stored.size,
                checksum_sha256=stored.checksum_sha256,
                uploaded_by=user.id,
            ),
            ProcessingJob(
                id=job_id,
                document_id=document_id,
                job_type="INGEST",
                status="QUEUED",
                requested_by=user.id,
            ),
        ]
    )
    await db.commit()
    background.add_task(
        run_ingestion,
        job_id,
        document_id,
        key,
        {"title": title, "document_code": document_code},
    )
    await db.refresh(document)
    return to_out(document)


@router.patch("/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: str,
    payload: DocumentUpdate,
    user: User = Depends(require_permission("document.update")),
    db: AsyncSession = Depends(get_db),
) -> DocumentOut:
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(404, "Document not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(document, key, value)
    document.updated_by = user.id
    await db.commit()
    await db.refresh(document)
    return to_out(document)


@router.put("/{document_id}/file")
async def replace_document_file(
    document_id: str,
    background: BackgroundTasks,
    file: UploadFile = File(...),
    change_summary: str = Form("Updated source file"),
    user: User = Depends(require_permission("document.update")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(404, "Document not found")
    extension = Path(file.filename or "").suffix.lower().lstrip(".")
    if extension not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(422, "File type is not supported. Accepted: PDF, DOCX, Markdown, images")
    content = await file.read()
    if len(content) > get_settings().max_upload_bytes:
        raise HTTPException(422, "File is too large")
    current_number = (
        await db.execute(
            select(DocumentVersion.version_number)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number.desc())
            .limit(1)
        )
    ).scalar_one_or_none() or 0
    next_number = current_number + 1
    version = DocumentVersion(
        id=str(uuid.uuid4()),
        document_id=document_id,
        version_number=next_number,
        version_label=f"v{next_number}.0",
        change_summary=change_summary,
        created_by=user.id,
    )
    key = f"documents/{document_id}/v{next_number}/original.{extension}"
    stored = await get_storage().upload(
        BytesIO(content), key, file.content_type or "application/octet-stream"
    )
    current_files = (
        (
            await db.execute(
                select(DocumentFile).where(
                    DocumentFile.document_id == document_id,
                    DocumentFile.is_current.is_(True),
                )
            )
        )
        .scalars()
        .all()
    )
    for current_file in current_files:
        current_file.is_current = False
    document_file = DocumentFile(
        id=str(uuid.uuid4()),
        document_id=document_id,
        version_id=version.id,
        original_file_name=file.filename or key,
        storage_key=stored.key,
        mime_type=file.content_type or "application/octet-stream",
        file_extension=extension,
        file_size=stored.size,
        checksum_sha256=stored.checksum_sha256,
        uploaded_by=user.id,
    )
    job = ProcessingJob(
        id=str(uuid.uuid4()),
        document_id=document_id,
        document_file_id=document_file.id,
        job_type="INGEST",
        status="QUEUED",
        requested_by=user.id,
    )
    document.current_version_id = version.id
    document.processing_status = "QUEUED"
    document.index_status = "INDEXING"
    document.updated_by = user.id
    db.add_all([version, document_file, job])
    await db.commit()
    background.add_task(
        run_ingestion,
        job.id,
        document_id,
        key,
        {"title": document.title, "document_code": document.document_code},
    )
    return {"document_id": document_id, "version_id": version.id, "job_id": job.id}


@router.get("/{document_id}/metadata")
async def get_metadata(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_permission("metadata.read")),
) -> dict:
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(404, "Document not found")
    keywords = (
        (
            await db.execute(
                select(DocumentKeyword.keyword).where(DocumentKeyword.document_id == document_id)
            )
        )
        .scalars()
        .all()
    )
    return {
        "document_id": document.id,
        "document_code": document.document_code,
        "title": document.title,
        "document_type": document.document_type,
        "issuing_unit": document.issuing_unit,
        "business_domain": document.business_domain,
        "application_scope": document.application_scope,
        "access_scope": document.access_scope,
        "issued_at": document.issued_at,
        "effective_from": document.effective_from,
        "effective_to": document.effective_to,
        "keywords": keywords,
    }


@router.put("/{document_id}/metadata", response_model=DocumentOut)
async def update_metadata(
    document_id: str,
    payload: DocumentUpdate,
    user: User = Depends(require_permission("metadata.update")),
    db: AsyncSession = Depends(get_db),
) -> DocumentOut:
    return await update_document(document_id, payload, user, db)


@router.post("/{document_id}/expire", response_model=DocumentOut)
async def expire_document(
    document_id: str,
    payload: ExpireRequest,
    user: User = Depends(require_permission("document.expire")),
    db: AsyncSession = Depends(get_db),
) -> DocumentOut:
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(404, "Document not found")
    document.effective_to = payload.effective_to
    document.effective_status = "EXPIRED"
    document.updated_by = user.id
    await db.commit()
    await db.refresh(document)
    return to_out(document)


@router.post("/{document_id}/reindex")
async def reindex_document(
    document_id: str,
    payload: ReindexRequest,
    background: BackgroundTasks,
    user: User = Depends(require_permission("document.reindex")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(404, "Document not found")
    job = ProcessingJob(
        id=str(uuid.uuid4()),
        document_id=document_id,
        job_type="REINDEX",
        status="QUEUED",
        requested_by=user.id,
    )
    db.add(job)
    document.index_status = "INDEXING"
    await db.commit()
    background.add_task(run_ingestion, job.id, document_id, "", {"reason": payload.reason})
    return {"job_id": job.id, "status": job.status}


@router.post("/bulk-reindex", status_code=202)
async def bulk_reindex(
    payload: BulkReindexRequest,
    background: BackgroundTasks,
    user: User = Depends(require_permission("document.reindex")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    documents = (
        (await db.execute(select(Document).where(Document.id.in_(payload.document_ids))))
        .scalars()
        .all()
    )
    if len(documents) != len(set(payload.document_ids)):
        raise HTTPException(422, "One or more documents do not exist")
    batch = ReindexJob(
        id=str(uuid.uuid4()),
        requested_by=user.id,
        reason=payload.reason,
        total_documents=len(documents),
        status="PROCESSING",
    )
    db.add(batch)
    for document in documents:
        item = ReindexJobDocument(
            job_id=batch.id,
            document_id=document.id,
            status="QUEUED",
        )
        document.index_status = "INDEXING"
        db.add(item)
    await db.commit()
    background.add_task(run_bulk_reindex, batch.id)
    return {"job_id": batch.id, "status": batch.status, "total": len(documents)}


async def _ai_document_id(document_id: str, db: AsyncSession) -> str:
    ref = (
        await db.execute(select(AIDocumentRef).where(AIDocumentRef.document_id == document_id))
    ).scalar_one_or_none()
    return ref.ai_document_id if ref else f"rag_{document_id}"


async def _readable_document(document_id: str, user: User, db: AsyncSession) -> Document:
    document = await db.get(Document, document_id)
    if not document or document.deleted_at:
        raise HTTPException(404, "Document not found")
    if document.access_scope != "PUBLIC" and "ROLE_CUSTOMER" in await user_role_codes(user, db):
        raise HTTPException(403, "Document access denied")
    return document


@router.get("/{document_id}/outline")
async def document_outline(
    document_id: str,
    user: User = Depends(require_permission("document.read")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _readable_document(document_id, user, db)
    return await get_ai_adapter().get_document_outline(await _ai_document_id(document_id, db))


@router.get("/{document_id}/clauses")
async def document_clauses(
    document_id: str,
    user: User = Depends(require_permission("document.read")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _readable_document(document_id, user, db)
    items = await get_ai_adapter().list_clauses(await _ai_document_id(document_id, db))
    return {
        "items": items,
        "page": 1,
        "page_size": len(items),
        "total": len(items),
        "has_next": False,
    }


@router.get("/{document_id}/chunks")
async def document_chunks(
    document_id: str,
    user: User = Depends(require_permission("document.read")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _readable_document(document_id, user, db)
    items = await get_ai_adapter().list_chunks(await _ai_document_id(document_id, db))
    return {
        "items": items,
        "page": 1,
        "page_size": len(items),
        "total": len(items),
        "has_next": False,
    }


@router.get("/{document_id}/clauses/{ai_clause_id}")
async def document_clause(
    document_id: str,
    ai_clause_id: str,
    user: User = Depends(require_permission("document.read")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _readable_document(document_id, user, db)
    clauses = await get_ai_adapter().list_clauses(await _ai_document_id(document_id, db))
    if not any(item.get("ai_clause_id") == ai_clause_id for item in clauses):
        raise HTTPException(404, "Clause not found in document")
    return await get_ai_adapter().get_clause(ai_clause_id)


@router.get("/{document_id}/chunks/{ai_chunk_id}")
async def document_chunk(
    document_id: str,
    ai_chunk_id: str,
    user: User = Depends(require_permission("document.read")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _readable_document(document_id, user, db)
    chunks = await get_ai_adapter().list_chunks(await _ai_document_id(document_id, db))
    if not any(item.get("ai_chunk_id") == ai_chunk_id for item in chunks):
        raise HTTPException(404, "Chunk not found in document")
    return await get_ai_adapter().get_source_chunk(ai_chunk_id)


@router.get("/{document_id}/knowledge-graph")
async def document_knowledge_graph(
    document_id: str,
    user: User = Depends(require_permission("relation.read")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _readable_document(document_id, user, db)
    return await get_ai_adapter().get_document_graph(
        await _ai_document_id(document_id, db), "KNOWLEDGE"
    )


@router.get("/{document_id}/relation-graph")
async def document_relation_graph(
    document_id: str,
    user: User = Depends(require_permission("relation.read")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _readable_document(document_id, user, db)
    return await get_ai_adapter().get_document_graph(
        await _ai_document_id(document_id, db), "RELATION"
    )
