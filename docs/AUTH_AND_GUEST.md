# Auth, phân quyền và Guest Chat

## Account session

```text
Login password
  → bcrypt verify
  → access JWT + opaque refresh token
  → FE lưu access/refresh ở localStorage nếu Remember, sessionStorage nếu không
```

Refresh token chỉ lưu SHA-256 hash ở `auth_sessions`. Mỗi lần refresh:

1. Tìm hash chưa revoke và chưa hết hạn.
2. Revoke session/token cũ.
3. Tạo refresh token/hash mới.
4. Trả access token mới và refresh token mới.

Logout revoke một session; logout-all revoke toàn bộ. Lock/password change cũng revoke refresh sessions.

## Signup

Form chỉ có username, full name, email tùy chọn, password, confirm password. Confirm chỉ kiểm tra ở FE; Backend nhận password và tự gán customer. Không cho client gửi role/status.

## Permission

Route guard ở FE chỉ cải thiện UX. Backend là nơi quyết định cuối cùng qua `current_user`, `require_roles` và `require_permission`. Không coi việc ẩn menu là bảo mật.

## Guest storage

Key: `shb-rag-guest-chat-v1`.

```json
{
  "id": "local-conversation-id",
  "title": "...",
  "messages": [{"id":"...","role":"user|ai","content":"...","createdAt":"..."}],
  "sourceGroupId": "ai-source-group-id",
  "sourceRefs": [{"ai_chunk_id":"...","rank":1,"relevance_score":0.96}],
  "graphId": "ai-graph-id",
  "guestAccessToken": "...",
  "updatedAt": "..."
}
```

Không lưu account access token, refresh token hoặc password trong object này. Xóa account session không xóa Guest history.

## Guest token

Token có `type=guest`, request ID, source group ID, graph ID, chunk IDs và `exp`. Endpoint source/graph kiểm tra claim trước khi gọi AI. Guest không thể đổi URL để đọc request khác.
