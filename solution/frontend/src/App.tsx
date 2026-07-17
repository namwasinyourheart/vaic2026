import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ChatbotPage from './pages/customer/ChatbotPage'
import HistoryPage from './pages/customer/HistoryPage'
import EmployeeDashboard from './pages/employee/DashboardPage'
import DocumentsPage from './pages/employee/DocumentsPage'
import UploadPage from './pages/employee/UploadPage'
import DocumentDetailPage from './pages/employee/DocumentDetailPage'
import ReviewMetadataPage from './pages/employee/ReviewMetadataPage'
import ReviewClausesPage from './pages/employee/ReviewClausesPage'
import ReviewRelationsPage from './pages/employee/ReviewRelationsPage'
import ReviewConflictsPage from './pages/employee/ReviewConflictsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import UsersPage from './pages/admin/UsersPage'
import RolesPage from './pages/admin/RolesPage'
import AuditLogPage from './pages/admin/AuditLogPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Customer */}
        <Route path="/customer/chatbot" element={<ChatbotPage />} />
        <Route path="/customer/history" element={<HistoryPage />} />
        <Route path="/customer/account" element={<ChatbotPage />} />

        {/* Employee */}
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/chatbot" element={<ChatbotPage />} />
        <Route path="/employee/documents" element={<DocumentsPage />} />
        <Route path="/employee/documents/upload" element={<UploadPage />} />
        <Route path="/employee/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/employee/review/metadata" element={<ReviewMetadataPage />} />
        <Route path="/employee/review/clauses" element={<ReviewClausesPage />} />
        <Route path="/employee/review/relations" element={<ReviewRelationsPage />} />
        <Route path="/employee/review/conflicts" element={<ReviewConflictsPage />} />
        <Route path="/employee/history" element={<HistoryPage />} />
        <Route path="/employee/account" element={<EmployeeDashboard />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/roles" element={<RolesPage />} />
        <Route path="/admin/logs" element={<AuditLogPage />} />
        <Route path="/admin/account" element={<AdminDashboardPage />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
