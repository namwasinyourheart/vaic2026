# Các luồng nghiệp vụ kỹ thuật

## Hỏi đáp account

```text
FE tạo conversation
 → POST /conversations/{id}/messages
 → BE kiểm tra owner + scope
 → lưu user message
 → AI query(scope)
 → lưu assistant message (answer + ai_request_id)
 → lưu source group/ref IDs và retrieval graph ID
 → FE lấy source/graph detail khi người dùng mở panel
```

## Hỏi đáp Guest

```text
FE tạo guest_session_id
 → POST /public/chat
 → BE ép PUBLIC, không ghi conversation DB
 → AI trả answer + IDs
 → BE ký guest token
 → FE lưu local history
 → source/graph click gọi endpoint public kèm guest token
```

## Upload và ingestion

```text
KM multipart upload
 → permission document.upload
 → validate extension/MIME/size
 → checksum + StorageService.upload
 → document + version + file + processing_job
 → BackgroundTasks gọi AI.ingest_document
 → cập nhật ai_ref/job/document processing/index status
```

Failure: job `FAILED`, lưu `error_code/error_message`, document processing status `FAILED`; file gốc vẫn là dữ liệu cần xử lý theo retry policy.

## Replace file/version

File mới tạo version tăng dần, file cũ `is_current=false`, document trỏ `current_version_id` mới, tạo ingestion job mới.

## Re-index

- Đơn: tạo `workflow_processing_jobs`, đặt `index_status=INDEXING`, gọi adapter.
- Batch: tạo `workflow_reindex_jobs` và item theo document; cập nhật completed/failed counts.

## Document lifecycle

Metadata manager có thể cập nhật effective dates, expire document; customer bị lọc PUBLIC ở list/detail/download.

## Admin user

Create/update role là một giá trị duy nhất. Lock revoke sessions. Không cho tự lock/delete; hệ thống cần bảo vệ system admin cuối cùng trước khi triển khai production.
