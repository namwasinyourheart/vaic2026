import { useState, useEffect, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Bot, CircleUserRound, Database, LayoutDashboard, LogOut, Menu, Settings, UserRoundCog, Users, X } from 'lucide-react'
import type { Role } from '../domain'
import { ROLE_LABELS } from '../domain'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/shared'

type NavItem = { label: string; path: string; icon: ReactNode }
const NAV: Record<Role, NavItem[]> = {
  ROLE_CUSTOMER: [{ label: 'Chat với AI', path: '/chat', icon: <Bot /> }, { label: 'Tài khoản', path: '/account', icon: <CircleUserRound /> }],
  ROLE_STAFF: [{ label: 'Chat với AI', path: '/chat', icon: <Bot /> }, { label: 'Quản lý văn bản', path: '/documents', icon: <Database /> }, { label: 'Tài khoản', path: '/account', icon: <CircleUserRound /> }],
  ROLE_COMPLIANCE: [{ label: 'Chat với AI', path: '/chat', icon: <Bot /> }, { label: 'Quản lý văn bản', path: '/documents', icon: <Database /> }, { label: 'Tài khoản', path: '/account', icon: <CircleUserRound /> }],
  ROLE_ADMIN: [{ label: 'Tổng quan hệ thống', path: '/admin/dashboard', icon: <LayoutDashboard /> }, { label: 'Người dùng', path: '/admin/users', icon: <Users /> }, { label: 'Vai trò và quyền', path: '/admin/roles', icon: <UserRoundCog /> }, { label: 'Nhật ký hệ thống', path: '/admin/logs', icon: <Database /> }, { label: 'Tài khoản', path: '/admin/account', icon: <CircleUserRound /> }],
}

export default function AppLayout({ pageTitle, headerActions, children, breadcrumbs }: { pageTitle: string; headerActions?: ReactNode; children: ReactNode; breadcrumbs?: string[] }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, _setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const role = user?.role || 'ROLE_CUSTOMER'
  const crumbs = breadcrumbs || location.pathname.split('/').filter(Boolean).slice(1).map(part => part.replace(/-/g, ' '))

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const sidebarContent = (closeBtn?: ReactNode) => (
    <>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
        <div className="w-8 h-8 bg-[#C8102E] rounded-lg grid place-items-center font-bold text-sm shrink-0">L</div>
        {!collapsed && <span className="font-bold text-sm flex-1">Lumina</span>}
        {closeBtn}
      </div>
      <nav className="flex-1 overflow-y-auto p-2 mt-2" aria-label="Điều hướng chính">{NAV[role].map(item => <NavLink key={item.path} to={item.path} title={collapsed ? item.label : undefined} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 mb-1 text-xs transition-colors ${isActive ? 'bg-[#C8102E] text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}><span className="[&>svg]:w-4 [&>svg]:h-4 flex-shrink-0">{item.icon}</span>{!collapsed && <span>{item.label}</span>}</NavLink>)}</nav>
      <div className="p-2 border-t border-white/10">
        <button onClick={() => { logout(); navigate('/login') }} className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-xs text-white/65 hover:bg-white/8 hover:text-white">
          <span className="[&>svg]:w-4 [&>svg]:h-4 flex-shrink-0"><LogOut size={16} /></span>
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="h-screen flex bg-[#F4F6F9]">
      {/* Desktop sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-[#1A2B4A] text-white flex-col transition-all hidden lg:flex`}>
        {sidebarContent()}
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#1A2B4A] text-white flex flex-col transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent(<button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-white/10"><X size={16} /></button>)}
      </aside>
      <div className="flex-1 min-w-0 flex flex-col"><header className="h-16 bg-white border-b border-[#DDE1E9] flex items-center px-5 gap-4 flex-shrink-0"><button onClick={() => setMobileOpen(v => !v)} className="lg:hidden p-2"><Menu size={18} /></button><div className="flex-1 min-w-0"><h1 className="font-semibold text-sm truncate">{pageTitle}</h1>{crumbs.length > 0 && <div className="text-[10px] text-gray-400 capitalize mt-0.5">Trang chủ / {crumbs.join(' / ')}</div>}</div>{headerActions}<div className="relative"><button aria-label="Thông báo" onClick={() => setNotifications(value => !value)} className="p-2 text-gray-500 rounded hover:bg-gray-100 cursor-pointer relative"><Bell size={17} /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C8102E]" /></button>{notifications && <div className="absolute right-0 top-11 w-80 bg-white border rounded-lg shadow-xl z-50 p-2"><div className="font-semibold text-xs px-2 py-2">Thông báo</div>{['Tài liệu đã index xong', 'Có tài liệu cần re-index', 'Cập nhật quyền thành công'].map(text => <div key={text} className="text-xs px-2 py-2 border-t text-gray-600">{text}</div>)}</div>}</div><div className="relative"><button onClick={() => setAccountOpen(value => !value)} className="flex items-center gap-2 rounded hover:bg-gray-50 px-2 py-1.5 cursor-pointer"><Avatar name={user?.name || 'Lumina User'} /><div className="hidden md:block text-left"><div className="text-xs font-medium">{user?.name || 'Lumina User'}</div><div className="text-[10px] text-gray-400">{ROLE_LABELS[role]}</div></div></button>{accountOpen && <div className="absolute right-0 top-12 w-52 bg-white border rounded-lg shadow-xl z-50 p-1"><button onClick={() => navigate('/account')} className="w-full flex gap-2 px-3 py-2 text-xs hover:bg-gray-50 rounded"><Settings size={15} /> Tài khoản</button><button onClick={() => { logout(); navigate('/login') }} className="w-full flex gap-2 px-3 py-2 text-xs hover:bg-gray-50 rounded text-red-600"><LogOut size={15} /> Đăng xuất</button></div>}</div></header>
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  )
}
