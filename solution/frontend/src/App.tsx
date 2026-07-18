import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GuestChatPage from './pages/GuestChatPage'
import ChatPage from './pages/ChatPage'
import AccountPage from './pages/AccountPage'
import { ForbiddenPage, NotFoundPage } from './pages/SystemPages'
import { RouteGuard } from './auth/Guards'
import { useAuth } from './auth/AuthContext'
import { AdminAudit, AdminDashboard, AdminRoles, AdminUsers } from './pages/admin/AdminPages'
import { DocumentDetailPageNew } from './pages/DocumentDetailPage'
import DocumentListPage from './pages/DocumentListPage'
import type { Role } from './domain'

function Guard({ roles, children }: { roles: Parameters<typeof RouteGuard>[0]['roles']; children: React.ReactNode }) { return <RouteGuard roles={roles}>{children}</RouteGuard> }
const customer: Role[] = ['customer']; const staff: Role[] = ['staff']; const compliance: Role[] = ['compliance_officer']; const admin: Role[] = ['system_admin']

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
  <Route path="/" element={<HomeRoute />} /><Route path="/guest-chat" element={<GuestChatPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/403" element={<ForbiddenPage />} />
  <Route path="/customer/chat" element={<Guard roles={customer}><ChatPage mode="server" /></Guard>} /><Route path="/customer/account" element={<Guard roles={customer}><AccountPage /></Guard>} />
  <Route path="/staff/chat" element={<Guard roles={staff}><ChatPage mode="server" /></Guard>} /><Route path="/staff/documents" element={<Guard roles={staff}><DocumentListPage /></Guard>} /><Route path="/staff/documents/:id" element={<Guard roles={staff}><DocumentDetailPageNew /></Guard>} /><Route path="/staff/account" element={<Guard roles={staff}><AccountPage /></Guard>} />
  <Route path="/compliance-officer/chat" element={<Guard roles={compliance}><ChatPage mode="rag" /></Guard>} /><Route path="/compliance-officer/documents" element={<Guard roles={compliance}><DocumentListPage /></Guard>} /><Route path="/compliance-officer/documents/:id" element={<Guard roles={compliance}><DocumentDetailPageNew /></Guard>} /><Route path="/compliance-officer/account" element={<Guard roles={compliance}><AccountPage /></Guard>} />
  <Route path="/admin/dashboard" element={<Guard roles={admin}><AdminDashboard /></Guard>} /><Route path="/admin/users" element={<Guard roles={admin}><AdminUsers /></Guard>} /><Route path="/admin/roles" element={<Guard roles={admin}><AdminRoles /></Guard>} /><Route path="/admin/logs" element={<Guard roles={admin}><AdminAudit /></Guard>} /><Route path="/admin/account" element={<Guard roles={admin}><AccountPage /></Guard>} />
  {/* Legacy aliases */}
  <Route path="/employee/dashboard" element={<Navigate to="/staff/documents" replace />} /><Route path="/employee/chatbot" element={<Navigate to="/staff/chat" replace />} /><Route path="/employee/documents/*" element={<Navigate to="/compliance-officer/documents" replace />} /><Route path="/employee/review/*" element={<Navigate to="/compliance-officer/documents" replace />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes></BrowserRouter> }

function HomeRoute() {
  const { user } = useAuth()
  return user ? <Navigate to={user.role === 'customer' ? '/customer/chat' : user.role === 'staff' ? '/staff/documents' : user.role === 'compliance_officer' ? '/compliance-officer/documents' : '/admin/dashboard'} replace /> : <GuestChatPage />
}
