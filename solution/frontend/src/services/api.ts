import { normalizeRole } from '../domain'
import type { AuditLog, Conversation, Document, Message, Role, SourceGroup, TextChunk, User } from '../domain'

const API_ROOT = import.meta.env.VITE_API_URL
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api/v1'
    : 'https://vaic2026.onrender.com/api/v1')

const ACCESS_KEY = 'shb-rag-access-token'
const REFRESH_KEY = 'shb-rag-refresh-token'

type JsonObject = Record<string, unknown>

function token() {
  return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY)
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const accessToken = token()
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  let response: Response
  try {
    response = await fetch(`${API_ROOT}${path}`, { ...init, headers })
  } catch {
    const error = new Error(`Không thể kết nối Backend tại ${API_ROOT.replace('/api/v1', '')}. Hãy kiểm tra dịch vụ đang chạy.`)
    window.dispatchEvent(new CustomEvent('shb-api-error', { detail: error.message }))
    throw error
  }
  if (!response.ok) {
    let message = `API error ${response.status}`
    try {
      const body = await response.json() as { detail?: string | Array<{ msg?: string }> }
      message = typeof body.detail === 'string' ? body.detail : body.detail?.map(item => item.msg).filter(Boolean).join(', ') || message
    } catch { /* response is not JSON */ }
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(ACCESS_KEY); sessionStorage.removeItem(REFRESH_KEY)
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    window.dispatchEvent(new CustomEvent('shb-api-error', { detail: message }))
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

interface ApiUser { id: string; username: string; email?: string | null; full_name: string; status: string; role: string; must_change_password?: boolean }
interface ApiToken { access_token: string; refresh_token: string; user: ApiUser }

function mapUser(value: ApiUser): User {
  const role = normalizeRole(value.role) || 'ROLE_CUSTOMER'
  return {
    id: value.id,
    username: value.username,
    password: '',
    name: value.full_name,
    email: value.email || '',
    role,
    status: value.status === 'LOCKED' ? 'locked' : 'active',
    createdAt: '',
    mustChangePassword: value.must_change_password === true,
  }
}

export interface LoginResult { user: Omit<User, 'password'>; accessToken: string; refreshToken: string }

export const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    const value = await api<ApiToken>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
    const { password: _password, ...user } = mapUser(value.user)
    return { user, accessToken: value.access_token, refreshToken: value.refresh_token }
  },
  async register(input: { username: string; password: string; email?: string; full_name: string }) {
    const value = await api<ApiUser>('/auth/sign-up', { method: 'POST', body: JSON.stringify(input) })
    return mapUser(value)
  },
  async updateProfile(input: { full_name?: string; email?: string }) {
    return mapUser(await api<ApiUser>('/auth/me', { method: 'PATCH', body: JSON.stringify(input) }))
  },
  async changePassword(current_password: string, new_password: string) {
    return api('/auth/me/password', { method: 'PUT', body: JSON.stringify({ current_password, new_password }) })
  },
  async logoutAll() { await api('/auth/logout-all', { method: 'POST' }); localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); sessionStorage.removeItem(ACCESS_KEY); sessionStorage.removeItem(REFRESH_KEY) },
  persist(result: LoginResult, remember: boolean) {
    localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(ACCESS_KEY); sessionStorage.removeItem(REFRESH_KEY)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(ACCESS_KEY, result.accessToken)
    storage.setItem(REFRESH_KEY, result.refreshToken)
  },
  async logout() {
    const refreshToken = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
    try {
      if (refreshToken && token()) await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) })
    } finally {
      localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(ACCESS_KEY); sessionStorage.removeItem(REFRESH_KEY)
    }
  },
}

async function publicApi<T>(path: string, init: RequestInit = {}, guestToken?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (guestToken) headers.set('Authorization', `Bearer ${guestToken}`)
  let response: Response
  try {
    response = await fetch(`${API_ROOT}${path}`, { ...init, headers })
  } catch {
    const message = 'Không thể kết nối dịch vụ AI/Backend. Vui lòng thử lại sau.'
    window.dispatchEvent(new CustomEvent('shb-api-error', { detail: message }))
    throw new Error(message)
  }
  if (!response.ok) {
    const message = `API không phản hồi thành công (HTTP ${response.status}).`
    window.dispatchEvent(new CustomEvent('shb-api-error', { detail: message }))
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export const guestChatService = {
  send: (guest_session_id: string, question: string) => publicApi<{ guest_request_id: string; answer: string; ai_source_group_id: string; source_refs: Array<{ ai_chunk_id: string; rank: number; relevance_score: number }>; ai_graph_id: string; guest_access_token: string; created_at: string }>('/public/chat', { method: 'POST', body: JSON.stringify({ guest_session_id, question }) }),
  chunk: (group: string, chunk: string, token: string) => publicApi<JsonObject>(`/public/source-groups/${group}/chunks/${chunk}`, {}, token),
  graph: (graph: string, token: string) => publicApi<JsonObject>(`/public/graphs/${graph}`, {}, token),
}

interface ApiConversation { id: string; title: string; scope: string; status: string; created_at: string; updated_at: string }
interface ApiMessage { id: string; conversation_id: string; role: 'user' | 'assistant'; content: string; status: string; created_at: string }
interface ApiSourceRef { id: string; ai_chunk_id: string; rank: number; relevance_score: number | null; access_status: string }
interface ApiSourceGroup { id: string; ai_source_group_id: string; question: string; chunks: ApiSourceRef[] }

const time = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : ''

async function mapSource(group: ApiSourceGroup): Promise<SourceGroup> {
  const chunks = await Promise.all(group.chunks.map(async item => {
    const detail = await api<JsonObject>(`/source-chunks/${item.ai_chunk_id}`)
    const content = String(detail.content || '')
    return {
      id: item.ai_chunk_id,
      documentId: String(detail.document_id || ''),
      documentName: String(detail.document_name || 'Nguồn từ AI Service'),
      documentCode: String(detail.document_code || ''),
      path: String(detail.path || ''),
      content,
      snippet: content.slice(0, 180),
      status: 'EFFECTIVE',
      contentType: String(detail.content_type || 'Text chunk'),
      rank: item.rank,
      score: item.relevance_score || 0,
      language: String(detail.language || 'vi'),
      accessScope: String(detail.access_scope || 'public').toLowerCase() === 'internal' ? 'internal' : 'public',
      version: String(detail.version || ''),
      indexedAt: String(detail.indexed_at || ''),
      available: item.access_status !== 'UNAVAILABLE',
    } as TextChunk
  }))
  return { id: group.id, question: group.question, chunks }
}

async function getConversation(id: string): Promise<Conversation> {
  const value = await api<{ conversation: ApiConversation; messages: ApiMessage[] }>(`/conversations/${id}`)
  const groups = await api<ApiSourceGroup[]>(`/conversations/${id}/sources`)
  return {
    id: value.conversation.id,
    title: value.conversation.title,
    updatedAt: time(value.conversation.updated_at),
    scope: value.conversation.scope.toLowerCase() === 'internal' ? 'internal' : 'public',
    messages: value.messages.map(item => ({
      id: item.id,
      role: item.role === 'assistant' ? 'ai' : 'user',
      content: item.content,
      time: time(item.created_at),
    } as Message)),
    sources: await Promise.all(groups.map(mapSource)),
  }
}

export const chatService = {
  async list(_role: 'ROLE_CUSTOMER' | 'ROLE_STAFF') {
    const values = await api<ApiConversation[]>('/conversations')
    return Promise.all(values.map(item => getConversation(item.id)))
  },
  get: getConversation,
  async create(role: 'ROLE_CUSTOMER' | 'ROLE_STAFF') {
    const value = await api<ApiConversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: 'Cuộc trò chuyện mới', scope: role === 'ROLE_CUSTOMER' ? 'PUBLIC' : 'INTERNAL' }),
    })
    return getConversation(value.id)
  },
  async rename(id: string, title: string, scope: 'public' | 'internal') {
    await api(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ title, scope: scope.toUpperCase() }) })
  },
  async remove(id: string) { await api(`/conversations/${id}`, { method: 'DELETE' }) },
  async send(id: string, content: string) {
    await api(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) })
    return getConversation(id)
  },
  async save() { /* Compatibility: mutations use dedicated API methods. */ },
}

interface ApiDocument {
  id: string; document_code: string; title: string; document_type: string; issuing_unit?: string
  business_domain?: string; access_scope: string; effective_status: string; processing_status: string
  index_status: string; created_at: string; updated_at: string
}

function mapDocument(value: ApiDocument): Document {
  return {
    id: value.id, name: value.title, code: value.document_code, type: value.document_type,
    issuingUnit: value.issuing_unit || '', field: value.business_domain || '', issuedAt: '', effectiveAt: '',
    effectiveStatus: value.effective_status as Document['effectiveStatus'], processingStatus: value.processing_status as Document['processingStatus'],
    indexStatus: value.index_status as Document['indexStatus'], accessScope: value.access_scope.toLowerCase() === 'public' ? 'public' : 'internal',
    uploader: '', updatedAt: time(value.updated_at), description: '', keywords: [], versions: [], clauses: [], timeline: [], relations: [],
  }
}

export const documentService = {
  async list() { return (await api<ApiDocument[]>('/documents')).map(mapDocument) },
  async get(id: string) { return mapDocument(await api<ApiDocument>(`/documents/${id}`)) },
  async upload(file: File, metadata: { name: string; type: string; field: string; scope: string; doc_number?: string; agency?: string; issued_at?: string; effective_from?: string; effective_to?: string }) {
    const body = new FormData()
    body.set('file', file)
    body.set('document_code', metadata.doc_number || `SHB-${Date.now()}`)
    body.set('title', metadata.name)
    body.set('document_type', metadata.type)
    body.set('business_domain', metadata.field)
    body.set('access_scope', metadata.scope.toUpperCase())
    if (metadata.agency) body.set('issuing_unit', metadata.agency)
    if (metadata.issued_at) body.set('issued_at', metadata.issued_at)
    if (metadata.effective_from) body.set('effective_from', metadata.effective_from)
    if (metadata.effective_to) body.set('effective_to', metadata.effective_to)
    return mapDocument(await api<ApiDocument>('/knowledge/documents', { method: 'POST', body }))
  },
  async save(document: Document) {
    const value = await api<ApiDocument>(`/knowledge/documents/${document.id}`, {
      method: 'PATCH', body: JSON.stringify({
        title: document.name, document_type: document.type, issuing_unit: document.issuingUnit,
        business_domain: document.field, access_scope: document.accessScope.toUpperCase(),
        effective_status: document.effectiveStatus, effective_to: document.expiresAt || null,
      }),
    })
    return mapDocument(value)
  },
}

interface ApiAudit { id: string; request_id: string; actor_user_id?: string; actor_role?: Role; action: string; resource_type: string; resource_id?: string; result: string; before?: unknown; after?: unknown; created_at: string }

export const adminService = {
  async users() {
    return (await api<ApiUser[]>('/admin/users')).map(value => { const { password: _password, ...user } = mapUser(value); return user })
  },
  async saveUser(user: User) {
    const existing = (await api<ApiUser[]>('/admin/users')).some(item => item.id === user.id)
    const payload = existing
      ? { full_name: user.name, email: user.email.trim() || null, role: user.role, status: user.status.toUpperCase() }
      : { username: user.username, email: user.email.trim() || null, password: 'vaic@2026', full_name: user.name, role: user.role }
    const value = await api<ApiUser>(existing ? `/admin/users/${user.id}` : '/admin/users', { method: existing ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
    return mapUser(value)
  },
  async resetUserPassword(id: string) {
    const value = await api<ApiUser>(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({}) })
    return mapUser(value)
  },
  async audit(): Promise<AuditLog[]> {
    return (await api<ApiAudit[]>('/admin/audit-logs')).map(item => ({
      id: item.id, time: time(item.created_at), actor: item.actor_user_id || 'System', role: item.actor_role || 'ROLE_ADMIN',
      action: item.action, resourceType: item.resource_type, target: item.resource_id || '', result: item.result === 'SUCCESS' ? 'success' : 'failed',
      requestId: item.request_id, before: item.before ? JSON.stringify(item.before) : undefined, after: item.after ? JSON.stringify(item.after) : undefined,
    }))
  },
}

export const knowledgeService = {
  ...documentService,
  async reindex(documentIds: string[], reason: string) {
    return api<{ job_id: string; status: string }>('/knowledge/documents/bulk-reindex', {
      method: 'POST', body: JSON.stringify({ document_ids: documentIds, reason }),
    })
  },
}

export { API_ROOT }
