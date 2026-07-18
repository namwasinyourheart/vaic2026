import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Bot, ChevronLeft, ChevronRight, CircleUserRound, Clock3, Database, FileSearch, GitCompareArrows, History, LayoutDashboard, Link2, ListTree, LogOut, Menu, Network, RefreshCw, Search, Settings, ShieldCheck, Upload, UserRoundCog, Users } from 'lucide-react'
import type { Role } from '../domain'
import { ROLE_LABELS } from '../domain'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/shared'

type NavItem = { label: string; path: string; icon: ReactNode }
const NAV: Record<Role, NavItem[]> = {
  customer: [
    { label: 'Chat với AI', path: '/customer/chat', icon: <Bot /> }, { label: 'Lịch sử hội thoại', path: '/customer/history', icon: <History /> }, { label: 'Tài khoản', path: '/customer/account', icon: <CircleUserRound /> },
  ],
  bank_employee: [
    { label: 'Chat với AI', path: '/bank-employee/chat', icon: <Bot /> }, { label: 'Tra cứu văn bản', path: '/bank-employee/documents', icon: <FileSearch /> }, { label: 'Tìm theo điều khoản', path: '/bank-employee/clauses', icon: <Search /> }, { label: 'So sánh phiên bản', path: '/bank-employee/compare', icon: <GitCompareArrows /> }, { label: 'Timeline sửa đổi', path: '/bank-employee/timeline', icon: <Clock3 /> }, { label: 'Văn bản liên quan', path: '/bank-employee/relations', icon: <Network /> }, { label: 'Lịch sử hội thoại', path: '/bank-employee/history', icon: <History /> }, { label: 'Tài khoản', path: '/bank-employee/account', icon: <CircleUserRound /> },
  ],
  knowledge_manager: [
    { label: 'Tổng quan kho tri thức', path: '/knowledge-manager/dashboard', icon: <LayoutDashboard /> }, { label: 'Danh sách tài liệu', path: '/knowledge-manager/documents', icon: <Database /> }, { label: 'Upload tài liệu', path: '/knowledge-manager/upload', icon: <Upload /> }, { label: 'Metadata', path: '/knowledge-manager/metadata', icon: <ListTree /> }, { label: 'Hiệu lực văn bản', path: '/knowledge-manager/effectiveness', icon: <ShieldCheck /> }, { label: 'Liên kết văn bản', path: '/knowledge-manager/relations', icon: <Link2 /> }, { label: 'Re-index tài liệu', path: '/knowledge-manager/reindex', icon: <RefreshCw /> }, { label: 'Lịch sử thao tác', path: '/knowledge-manager/history', icon: <History /> }, { label: 'Tài khoản', path: '/knowledge-manager/account', icon: <CircleUserRound /> },
  ],
  system_admin: [
    { label: 'Tổng quan hệ thống', path: '/admin/dashboard', icon: <LayoutDashboard /> }, { label: 'Người dùng', path: '/admin/users', icon: <Users /> }, { label: 'Vai trò và quyền', path: '/admin/roles', icon: <UserRoundCog /> }, { label: 'Nhật ký hệ thống', path: '/admin/logs', icon: <History /> }, { label: 'Tài khoản', path: '/admin/account', icon: <CircleUserRound /> },
  ],
}

export default function AppLayout({ children, pageTitle, headerActions, breadcrumbs, role: legacyRole }: { children?: ReactNode; pageTitle: string; headerActions?: ReactNode; breadcrumbs?: string[]; role?: Role | 'employee' | 'admin' }) {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const location = useLocation()
  const mappedLegacy = legacyRole === 'employee' ? 'knowledge_manager' : legacyRole === 'admin' ? 'system_admin' : legacyRole
  const role = user?.role || mappedLegacy || 'customer'
  const [collapsed, setCollapsed] = useState(false); const [notifications, setNotifications] = useState(false); const [accountOpen, setAccountOpen] = useState(false)
  const crumbs = breadcrumbs || location.pathname.split('/').filter(Boolean).slice(1).map(part => part.replace(/-/g, ' '))
  return <div className="flex h-screen bg-[#F4F6F9] overflow-hidden text-gray-900">
    <aside className={`${collapsed ? 'w-[72px]' : 'w-64'} bg-[#192B4B] text-white flex flex-col flex-shrink-0 transition-[width] duration-200`}>
      <div className="h-16 px-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#C8102E] grid place-items-center font-black text-xs flex-shrink-0">SHB</div>
        {!collapsed && <div><div className="font-bold text-sm">SHB RAG</div><div className="text-[10px] text-white/50">Advanced Knowledge Base</div></div>}
      </div>
      {!collapsed && <div className="mx-3 mt-3 rounded bg-white/8 px-3 py-2"><div className="text-[10px] text-white/45 uppercase">Vai trò hiện tại</div><div className="text-xs font-semibold mt-0.5">{ROLE_LABELS[role]}</div></div>}
      <nav className="flex-1 overflow-y-auto p-2 mt-2" aria-label="Điều hướng chính">
        {NAV[role].map(item => <NavLink key={item.path} to={item.path} title={collapsed ? item.label : undefined} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 mb-1 text-xs transition-colors ${isActive ? 'bg-[#C8102E] text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}>
          <span className="[&>svg]:w-4 [&>svg]:h-4 flex-shrink-0">{item.icon}</span>{!collapsed && <span>{item.label}</span>}
        </NavLink>)}
      </nav>
      <div className="border-t border-white/10 p-2">
        {!collapsed && <div className="px-3 pb-2 text-[10px] text-white/35">Phiên bản 0.3 · Mock service</div>}
        <button onClick={() => setCollapsed(value => !value)} className="w-full rounded px-3 py-2 flex items-center gap-3 text-white/55 hover:bg-white/8 cursor-pointer"><span>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</span>{!collapsed && <span className="text-xs">Thu gọn sidebar</span>}</button>
      </div>
    </aside>
    <div className="flex-1 min-w-0 flex flex-col">
      <header className="h-16 bg-white border-b border-[#DDE1E9] flex items-center px-5 gap-4 flex-shrink-0">
        <button onClick={() => setCollapsed(value => !value)} className="lg:hidden p-2"><Menu size={18} /></button>
        <div className="flex-1 min-w-0"><h1 className="font-semibold text-sm truncate">{pageTitle}</h1>{crumbs.length > 0 && <div className="text-[10px] text-gray-400 capitalize mt-0.5">Trang chủ / {crumbs.join(' / ')}</div>}</div>
        {headerActions}
        <div className="relative"><button aria-label="Thông báo" onClick={() => setNotifications(value => !value)} className="p-2 text-gray-500 rounded hover:bg-gray-100 cursor-pointer relative"><Bell size={17} /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C8102E]" /></button>{notifications && <div className="absolute right-0 top-11 w-80 bg-white border rounded-lg shadow-xl z-50 p-2"><div className="font-semibold text-xs px-2 py-2">Thông báo</div>{['Tài liệu QĐ-01/2024 đã index xong', 'Có 2 tài liệu cần re-index', 'Cập nhật quyền thành công'].map(text => <div key={text} className="text-xs px-2 py-2 border-t text-gray-600">{text}</div>)}</div>}</div>
        <div className="relative"><button onClick={() => setAccountOpen(value => !value)} className="flex items-center gap-2 rounded hover:bg-gray-50 px-2 py-1.5 cursor-pointer"><Avatar name={user?.name || 'Demo User'} /><div className="hidden md:block text-left"><div className="text-xs font-medium">{user?.name || 'Demo User'}</div><div className="text-[10px] text-gray-400">{ROLE_LABELS[role]}</div></div></button>{accountOpen && <div className="absolute right-0 top-12 w-52 bg-white border rounded-lg shadow-xl z-50 p-1"><button onClick={() => navigate(NAV[role].find(item => item.label === 'Tài khoản')!.path)} className="w-full flex gap-2 px-3 py-2 text-xs hover:bg-gray-50 rounded"><Settings size={15} /> Tài khoản</button><button onClick={() => { logout(); navigate('/login') }} className="w-full flex gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600 rounded"><LogOut size={15} /> Đăng xuất</button></div>}</div>
      </header>
      <main className="flex-1 overflow-y-auto p-5">{children}</main>
    </div>
  </div>
}
