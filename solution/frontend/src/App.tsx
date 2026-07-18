import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatbotPage from './pages/customer/ChatbotPage'
import ConversationHistoryPage from './pages/ConversationHistoryPage'
import AccountPage from './pages/AccountPage'
import { ForbiddenPage, NotFoundPage } from './pages/SystemPages'
import { RouteGuard } from './auth/Guards'
import { useAuth } from './auth/AuthContext'
import { AdminAudit, AdminDashboard, AdminRoles, AdminUsers } from './pages/admin/AdminPages'
import { DocumentDetailPageNew } from './pages/DocumentDetailPage'
import DocumentListPage from './pages/DocumentListPage'
import type { Role } from './domain'

function Guard({ roles, children }: { roles: Parameters<typeof RouteGuard>[0]['roles']; children: React.ReactNode }) { return <RouteGuard roles={roles}>{children}</RouteGuard> }
const customer: Role[] = ['ROLE_CUSTOMER']; const bank: Role[] = ['ROLE_STAFF']; const knowledge: Role[] = ['ROLE_COMPLIANCE']; const admin: Role[] = ['ROLE_ADMIN']

function ApiErrorToast() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const onError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setMessage(detail || 'API không phản hồi. Vui lòng thử lại.')
      window.setTimeout(() => setMessage(''), 7000)
    }
    window.addEventListener('shb-api-error', onError)
    return () => window.removeEventListener('shb-api-error', onError)
  }, [])
  if (!message) return null
  return <div className="fixed right-5 top-5 z-[100] w-[min(420px,calc(100vw-2rem))] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg" role="alert">
    <div className="font-semibold">Không thể tải dữ liệu</div>
    <div className="mt-1">API chưa phản hồi hoặc đã trả lỗi. Màn hình hiện tại không được xem là dữ liệu rỗng.</div>
    <div className="mt-1 text-xs text-red-700">{message}</div>
    <button className="mt-2 text-xs font-semibold underline" onClick={() => setMessage('')}>Đóng</button>
  </div>
}

export default function App() { return <BrowserRouter><ApiErrorToast /><Routes>
  <Route path="/" element={<HomeRoute />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/403" element={<ForbiddenPage />} />
  <Route path="/customer/chat" element={<Guard roles={customer}><ChatbotPage /></Guard>} /><Route path="/customer/history" element={<Guard roles={customer}><ConversationHistoryPage /></Guard>} /><Route path="/customer/account" element={<Guard roles={customer}><AccountPage /></Guard>} />
  <Route path="/bank-employee/chat" element={<Guard roles={bank}><ChatbotPage /></Guard>} /><Route path="/bank-employee/documents" element={<Guard roles={bank}><DocumentSearchPage /></Guard>} /><Route path="/bank-employee/documents/:id" element={<Guard roles={bank}><DocumentDetailPageNew /></Guard>} /><Route path="/bank-employee/clauses" element={<Guard roles={bank}><ClauseSearchPage /></Guard>} /><Route path="/bank-employee/compare" element={<Guard roles={bank}><ComparePage /></Guard>} /><Route path="/bank-employee/timeline" element={<Guard roles={bank}><TimelinePage /></Guard>} /><Route path="/bank-employee/relations" element={<Guard roles={bank}><RelatedPage /></Guard>} /><Route path="/bank-employee/history" element={<Guard roles={bank}><ConversationHistoryPage /></Guard>} /><Route path="/bank-employee/account" element={<Guard roles={bank}><AccountPage /></Guard>} />
  <Route path="/knowledge-manager/dashboard" element={<Guard roles={knowledge}><KnowledgeDashboard /></Guard>} /><Route path="/knowledge-manager/documents" element={<Guard roles={knowledge}><KnowledgeDocuments /></Guard>} /><Route path="/knowledge-manager/upload" element={<Guard roles={knowledge}><UploadDocumentPage /></Guard>} /><Route path="/knowledge-manager/metadata" element={<Guard roles={knowledge}><MetadataPage /></Guard>} /><Route path="/knowledge-manager/effectiveness" element={<Guard roles={knowledge}><EffectivenessPage /></Guard>} /><Route path="/knowledge-manager/relations" element={<Guard roles={knowledge}><KnowledgeRelationsPage /></Guard>} /><Route path="/knowledge-manager/reindex" element={<Guard roles={knowledge}><ReindexPage /></Guard>} /><Route path="/knowledge-manager/history" element={<Guard roles={knowledge}><KnowledgeHistoryPage /></Guard>} /><Route path="/knowledge-manager/account" element={<Guard roles={knowledge}><AccountPage /></Guard>} />
  <Route path="/admin/dashboard" element={<Guard roles={admin}><AdminDashboard /></Guard>} /><Route path="/admin/users" element={<Guard roles={admin}><AdminUsers /></Guard>} /><Route path="/admin/roles" element={<Guard roles={admin}><AdminRoles /></Guard>} /><Route path="/admin/logs" element={<Guard roles={admin}><AdminAudit /></Guard>} /><Route path="/admin/account" element={<Guard roles={admin}><AccountPage /></Guard>} />
  {/* Legacy aliases */}
  <Route path="/employee/dashboard" element={<Navigate to="/staff/documents" replace />} /><Route path="/employee/chatbot" element={<Navigate to="/staff/chat" replace />} /><Route path="/employee/documents/*" element={<Navigate to="/compliance-officer/documents" replace />} /><Route path="/employee/review/*" element={<Navigate to="/compliance-officer/documents" replace />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes></BrowserRouter> }

function HomeRoute() {
  const { user } = useAuth()
  return user ? <Navigate to={user.role === 'ROLE_CUSTOMER' ? '/customer/chat' : user.role === 'ROLE_STAFF' ? '/bank-employee/chat' : user.role === 'ROLE_COMPLIANCE' ? '/knowledge-manager/dashboard' : '/admin/dashboard'} replace /> : <Navigate to="/login" replace />
}
