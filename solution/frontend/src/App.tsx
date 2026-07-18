import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ChatbotPage from './pages/customer/ChatbotPage'
import ConversationHistoryPage from './pages/ConversationHistoryPage'
import AccountPage from './pages/AccountPage'
import { ForbiddenPage, NotFoundPage } from './pages/SystemPages'
import { RouteGuard } from './auth/Guards'
import { AdminAudit, AdminDashboard, AdminRoles, AdminUsers } from './pages/admin/AdminPages'
import { ClauseSearchPage, ComparePage, DocumentDetailPageNew, DocumentSearchPage, RelatedPage, TimelinePage } from './pages/bank/BankPages'
import { EffectivenessPage, KnowledgeDashboard, KnowledgeDocuments, KnowledgeHistoryPage, KnowledgeRelationsPage, MetadataPage, ReindexPage, UploadDocumentPage } from './pages/knowledge/KnowledgePages'
import type { Role } from './domain'

function Guard({ roles, children }: { roles: Parameters<typeof RouteGuard>[0]['roles']; children: React.ReactNode }) { return <RouteGuard roles={roles}>{children}</RouteGuard> }
const customer: Role[] = ['customer']; const bank: Role[] = ['bank_employee']; const knowledge: Role[] = ['knowledge_manager']; const admin: Role[] = ['system_admin']

export default function App() { return <BrowserRouter><Routes>
  <Route path="/" element={<Navigate to="/login" replace />} /><Route path="/login" element={<LoginPage />} /><Route path="/403" element={<ForbiddenPage />} />
  <Route path="/customer/chat" element={<Guard roles={customer}><ChatbotPage /></Guard>} /><Route path="/customer/history" element={<Guard roles={customer}><ConversationHistoryPage /></Guard>} /><Route path="/customer/account" element={<Guard roles={customer}><AccountPage /></Guard>} />
  <Route path="/bank-employee/chat" element={<Guard roles={bank}><ChatbotPage /></Guard>} /><Route path="/bank-employee/documents" element={<Guard roles={bank}><DocumentSearchPage /></Guard>} /><Route path="/bank-employee/documents/:id" element={<Guard roles={bank}><DocumentDetailPageNew /></Guard>} /><Route path="/bank-employee/clauses" element={<Guard roles={bank}><ClauseSearchPage /></Guard>} /><Route path="/bank-employee/compare" element={<Guard roles={bank}><ComparePage /></Guard>} /><Route path="/bank-employee/timeline" element={<Guard roles={bank}><TimelinePage /></Guard>} /><Route path="/bank-employee/relations" element={<Guard roles={bank}><RelatedPage /></Guard>} /><Route path="/bank-employee/history" element={<Guard roles={bank}><ConversationHistoryPage /></Guard>} /><Route path="/bank-employee/account" element={<Guard roles={bank}><AccountPage /></Guard>} />
  <Route path="/knowledge-manager/dashboard" element={<Guard roles={knowledge}><KnowledgeDashboard /></Guard>} /><Route path="/knowledge-manager/documents" element={<Guard roles={knowledge}><KnowledgeDocuments /></Guard>} /><Route path="/knowledge-manager/upload" element={<Guard roles={knowledge}><UploadDocumentPage /></Guard>} /><Route path="/knowledge-manager/metadata" element={<Guard roles={knowledge}><MetadataPage /></Guard>} /><Route path="/knowledge-manager/effectiveness" element={<Guard roles={knowledge}><EffectivenessPage /></Guard>} /><Route path="/knowledge-manager/relations" element={<Guard roles={knowledge}><KnowledgeRelationsPage /></Guard>} /><Route path="/knowledge-manager/reindex" element={<Guard roles={knowledge}><ReindexPage /></Guard>} /><Route path="/knowledge-manager/history" element={<Guard roles={knowledge}><KnowledgeHistoryPage /></Guard>} /><Route path="/knowledge-manager/account" element={<Guard roles={knowledge}><AccountPage /></Guard>} />
  <Route path="/admin/dashboard" element={<Guard roles={admin}><AdminDashboard /></Guard>} /><Route path="/admin/users" element={<Guard roles={admin}><AdminUsers /></Guard>} /><Route path="/admin/roles" element={<Guard roles={admin}><AdminRoles /></Guard>} /><Route path="/admin/logs" element={<Guard roles={admin}><AdminAudit /></Guard>} /><Route path="/admin/account" element={<Guard roles={admin}><AccountPage /></Guard>} />
  {/* Legacy aliases are intentionally redirected into the separated workspaces. */}
  <Route path="/employee/dashboard" element={<Navigate to="/bank-employee/chat" replace />} /><Route path="/employee/chatbot" element={<Navigate to="/bank-employee/chat" replace />} /><Route path="/employee/documents/*" element={<Navigate to="/knowledge-manager/documents" replace />} /><Route path="/employee/review/*" element={<Navigate to="/knowledge-manager/metadata" replace />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes></BrowserRouter> }
