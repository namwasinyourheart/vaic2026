import type { AuditLog, Conversation, Document, Role, User } from '../domain'

const DB_KEY = 'shb-rag-demo-v3'
const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms))

interface Database { version: 3; users: User[]; documents: Document[]; conversations: Record<string, Conversation[]>; audit: AuditLog[] }

const versions = [
  { id: 'v2', label: 'Phiên bản 2.0', effectiveFrom: '01/01/2024', status: 'EFFECTIVE' as const, content: 'Lãi suất kỳ hạn 12 tháng là 5,8% tại quầy và 6,0% online.', changeDocument: 'QĐ-01/2024' },
  { id: 'v1', label: 'Phiên bản 1.0', effectiveFrom: '01/10/2023', effectiveTo: '31/12/2023', status: 'SUPERSEDED' as const, content: 'Lãi suất kỳ hạn 12 tháng là 5,5% tại quầy và 5,7% online.', changeDocument: 'QĐ-18/2023' },
]

const seedDocuments: Document[] = Array.from({ length: 14 }, (_, index) => ({
  id: `doc-${index + 1}`,
  name: index === 0 ? 'Quy định biểu lãi suất huy động vốn cá nhân' : `${['Quy chế tín dụng nội bộ', 'Hướng dẫn phát hành thẻ', 'Quy định giao dịch ngoại tệ'][index % 3]} ${2024 - index % 3}`,
  code: index === 0 ? 'QĐ-SHB-2024/01' : `VB-SHB-${String(index + 1).padStart(3, '0')}/2024`,
  type: ['Quyết định', 'Quy chế', 'Hướng dẫn'][index % 3], issuingUnit: ['Ban Nguồn vốn', 'Ban Tín dụng', 'Khối Vận hành'][index % 3], field: ['Huy động vốn', 'Tín dụng', 'Thẻ'][index % 3],
  issuedAt: '28/12/2023', effectiveAt: '01/01/2024', expiresAt: index % 5 === 0 ? '31/12/2025' : undefined,
  effectiveStatus: index % 7 === 0 ? 'PARTIALLY_EFFECTIVE' : 'EFFECTIVE', processingStatus: index === 12 ? 'FAILED' : 'COMPLETED', indexStatus: index === 11 ? 'REINDEX_REQUIRED' : 'INDEXED',
  accessScope: index % 3 === 0 ? 'public' : 'internal', uploader: 'Nguyễn Văn An', updatedAt: '17/01/2024 09:30', description: 'Văn bản nghiệp vụ chính thức của SHB.', keywords: ['SHB', 'nghiệp vụ'], versions,
  clauses: [{ id: `clause-${index}-1`, documentId: `doc-${index + 1}`, path: 'Chương II → Điều 5 → Khoản 2', content: 'Ngân hàng thực hiện xác định hạn mức và áp dụng các điều kiện theo quy định hiện hành.', status: 'EFFECTIVE', effectiveFrom: '01/01/2024' }],
  timeline: [{ id: `timeline-${index}`, date: '01/01/2024', type: 'Sửa đổi', document: 'QĐ-01/2024', clause: 'Điều 5 Khoản 2', before: 'Mức cũ 5,5%/năm', after: 'Mức mới 5,8%/năm', status: 'EFFECTIVE' }],
  relations: [{ id: `rel-${index}`, sourceDocument: `VB-SHB-${index + 1}`, type: 'Tham chiếu', targetDocument: 'Thông tư 06/2023/TT-NHNN', startDate: '01/01/2024', note: 'Căn cứ áp dụng' }],
}))

const makeConversation = (internal: boolean): Conversation => {
  const chunk = { id: internal ? 'chunk-int-1' : 'chunk-pub-1', documentId: 'doc-1', documentName: seedDocuments[0].name, documentCode: seedDocuments[0].code, path: 'Chương II → Điều 5 → Khoản 2', content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng áp dụng mức 5,8%/năm đối với gửi tại quầy và 6,0%/năm đối với gửi qua kênh số kể từ ngày 01/01/2024. Nội dung được trích xuất từ bản chính thức đã được phê duyệt.', snippet: 'Lãi suất tiết kiệm kỳ hạn 12 tháng áp dụng mức 5,8%/năm...', status: 'EFFECTIVE' as const, contentType: 'Điều khoản', rank: 1, score: .96, language: 'vi', accessScope: internal ? 'internal' as const : 'public' as const, version: '2.0', indexedAt: '17/01/2024 09:35', available: true }
  return { id: internal ? 'conv-internal' : 'conv-public', title: internal ? 'Tra cứu quy định tín dụng' : 'Lãi suất tiết kiệm 2024', updatedAt: 'Hôm nay 09:35', scope: internal ? 'internal' : 'public', messages: [
    { id: 'm1', role: 'user', content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng hiện tại là bao nhiêu?', time: '09:32' },
    { id: 'm2', role: 'ai', content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng hiện tại là 5,8%/năm tại quầy và 6,0%/năm khi gửi online. Mức này áp dụng từ ngày 01/01/2024.', time: '09:32', sourceGroupId: 'sg1' },
  ], sources: [{ id: 'sg1', question: 'Lãi suất tiết kiệm kỳ hạn 12 tháng hiện tại là bao nhiêu?', chunks: [chunk, { ...chunk, id: `${chunk.id}-2`, rank: 2, documentName: 'Thông báo điều chỉnh lãi suất', documentCode: 'TB-SHB-2024/001', score: .89 }] }] }
}

const seed = (): Database => ({
  version: 3,
  users: [
    ['customer', 'Nguyễn Thị Mai', 'mai@example.com', 'customer'], ['employee', 'Trần Văn Hùng', 'hung@shb.vn', 'bank_employee'],
    ['knowledge', 'Lê Thu Hà', 'ha@shb.vn', 'knowledge_manager'], ['admin', 'Admin Hệ thống', 'admin@shb.vn', 'system_admin'],
  ].map(([username, name, email, role], i) => ({ id: `u${i + 1}`, username, password: 'password', name, email, role: role as Role, status: 'active', department: i === 1 ? 'Ban Tín dụng' : i === 2 ? 'Trung tâm Dữ liệu' : undefined, createdAt: '01/01/2024', lastLogin: '17/01/2024 08:00' })),
  documents: seedDocuments,
  conversations: { customer: [makeConversation(false)], bank_employee: [makeConversation(true)] },
  audit: [{ id: 'log-1', time: '17/01/2024 09:30', actor: 'Admin Hệ thống', role: 'system_admin', action: 'CREATE_USER', resourceType: 'USER', target: 'u5', result: 'success', requestId: 'req-9fa31', after: '{"status":"active"}' }],
})

function load(): Database {
  try { const parsed = JSON.parse(localStorage.getItem(DB_KEY) || '') as Database; if (parsed.version === 3) return parsed } catch { /* seed below */ }
  const value = seed(); localStorage.setItem(DB_KEY, JSON.stringify(value)); return value
}
function save(db: Database) { localStorage.setItem(DB_KEY, JSON.stringify(db)) }
export function resetDemoData() { localStorage.removeItem(DB_KEY); return load() }

export const authService = {
  async login(username: string, password: string) { await delay(); const user = load().users.find(item => item.username === username && item.password === password); if (!user) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.'); if (user.status === 'locked') throw new Error('Tài khoản đã bị khóa.'); return { ...user, password: '' } },
}

export const chatService = {
  async list(role: 'customer' | 'bank_employee') { await delay(); return load().conversations[role] || [] },
  async save(role: 'customer' | 'bank_employee', conversations: Conversation[]) { await delay(80); const db = load(); db.conversations[role] = conversations; save(db) },
}

export const documentService = {
  async list() { await delay(); return load().documents },
  async get(id: string) { await delay(); return load().documents.find(item => item.id === id) },
  async save(document: Document) { await delay(); const db = load(); const index = db.documents.findIndex(item => item.id === document.id); if (index >= 0) db.documents[index] = document; else db.documents.unshift(document); save(db); return document },
}

export const adminService = {
  async users() { await delay(); return load().users.map(({ password: _password, ...user }) => user) },
  async saveUser(user: User) { await delay(); const db = load(); const index = db.users.findIndex(item => item.id === user.id); if (index >= 0) db.users[index] = user; else db.users.push(user); save(db); return user },
  async audit() { await delay(); return load().audit },
}

export const knowledgeService = documentService
