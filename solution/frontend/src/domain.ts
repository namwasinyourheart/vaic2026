export type Role = 'customer' | 'staff' | 'compliance_officer' | 'system_admin'

export type Permission =
  | 'chat:public' | 'chat:internal' | 'documents:read' | 'documents:manage'
  | 'metadata:manage' | 'relations:manage' | 'reindex:manage'
  | 'users:manage' | 'roles:manage' | 'audit:read'

export type EffectiveStatus = 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'FUTURE_EFFECTIVE' | 'EXPIRED' | 'SUPERSEDED'
export type ProcessingStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type IndexStatus = 'NOT_INDEXED' | 'INDEXING' | 'INDEXED' | 'REINDEX_REQUIRED' | 'INDEX_FAILED'

export interface User {
  id: string
  username: string
  password: string
  name: string
  email: string
  role: Role
  status: 'active' | 'locked'
  department?: string
  createdAt: string
  lastLogin?: string
  mustChangePassword?: boolean
}

export interface TextChunk {
  id: string
  documentId: string
  documentName: string
  documentCode: string
  path: string
  content: string
  snippet: string
  status: EffectiveStatus
  contentType: string
  rank: number
  score: number
  language: string
  accessScope: 'public' | 'internal'
  version: string
  indexedAt: string
  available?: boolean
}

export interface SourceGroup { id: string; question: string; chunks: TextChunk[]; collapsed?: boolean }
export interface Message { id: string; role: 'user' | 'ai'; content: string; time: string; warning?: string; sourceGroupId?: string; graph?: RAGGraph | null }
export interface Conversation { id: string; title: string; updatedAt: string; scope: 'public' | 'internal'; messages: Message[]; sources: SourceGroup[] }

export interface GraphNode { id: string; label: string; type: 'document' | 'clause' | 'chunk' | 'related'; x: number; y: number; primary?: boolean; detail: string }
export interface GraphEdge { id: string; source: string; target: string; type: 'BELONGS_TO' | 'CONTAINS' | 'REFERENCES' | 'AMENDS' | 'SUPERSEDES' | 'RELATED_TO' }

export interface Version { id: string; label: string; effectiveFrom: string; effectiveTo?: string; status: EffectiveStatus; content: string; changeDocument: string }
export interface Clause { id: string; documentId: string; path: string; content: string; status: EffectiveStatus; effectiveFrom: string; effectiveTo?: string }
export interface TimelineEvent { id: string; date: string; type: string; document: string; clause: string; before: string; after: string; status: EffectiveStatus }
export interface Relation { id: string; sourceDocument: string; sourceClause?: string; type: 'Tham chiếu' | 'Sửa đổi' | 'Thay thế' | 'Thay thế một phần' | 'Liên quan'; targetDocument: string; targetClause?: string; startDate: string; endDate?: string; note?: string }

export interface Document {
  id: string; name: string; code: string; type: string; issuingUnit: string; field: string
  issuedAt: string; effectiveAt: string; expiresAt?: string; effectiveStatus: EffectiveStatus
  processingStatus: ProcessingStatus; indexStatus: IndexStatus; accessScope: 'public' | 'internal'
  uploader: string; updatedAt: string; description: string; keywords: string[]
  versions: Version[]; clauses: Clause[]; timeline: TimelineEvent[]; relations: Relation[]
}

export interface AuditLog { id: string; time: string; actor: string; role: Role; action: string; resourceType: string; target: string; result: 'success' | 'failed'; requestId: string; before?: string; after?: string; error?: string }

export interface RAGSourceChunk {
  chunk_id: string
  document_id: string
  document_type: string
  section_title: string
  text: string
  token_count: number
  domain: string
  version: string
  effective_date: string
  expiry_date: string | null
  status: string
  language: string
  score: number
}

export interface RAGGraphNode {
  id: string
  type: string
  label: string
  [key: string]: unknown
}

export interface RAGGraphEdge {
  source: string
  target: string
  type: string
}

export interface RAGGraph {
  nodes: RAGGraphNode[]
  edges: RAGGraphEdge[]
}

export interface RAGResponse {
  answer: string
  sources: RAGSourceChunk[]
  conflicts: Array<{ clause_a: string; clause_b: string }>
  graph: RAGGraph | null
}

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Khách hàng', staff: 'Nhân viên Nghiệp vụ', compliance_officer: 'Chuyên gia Pháp chế', system_admin: 'Quản trị hệ thống',
}

export const ROLE_HOME: Record<Role, string> = {
  customer: '/customer/chat', staff: '/staff/documents', compliance_officer: '/compliance-officer/documents', system_admin: '/admin/dashboard',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  customer: ['chat:public'],
  staff: ['chat:internal', 'documents:read'],
  compliance_officer: ['chat:internal', 'documents:read', 'documents:manage', 'metadata:manage', 'relations:manage', 'reindex:manage'],
  system_admin: ['users:manage', 'roles:manage', 'audit:read'],
}
