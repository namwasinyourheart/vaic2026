import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar } from '../components/shared'

type Role = 'customer' | 'employee' | 'admin'

interface NavItem {
  key: string
  label: string
  icon: ReactNode
  path: string
  badge?: number
  children?: { key: string; label: string; path: string }[]
}

const ICON = {
  chat: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  history: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  dashboard: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 11a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" /></svg>,
  doc: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  review: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  users: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  shield: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  log: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  account: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  bell: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  logout: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
}

const NAV_CONFIG: Record<Role, NavItem[]> = {
  customer: [
    { key: 'chatbot', label: 'Chatbot', icon: ICON.chat, path: '/customer/chatbot' },
    { key: 'history', label: 'Lịch sử hội thoại', icon: ICON.history, path: '/customer/history' },
    { key: 'account', label: 'Tài khoản', icon: ICON.account, path: '/customer/account' },
  ],
  employee: [
    { key: 'dashboard', label: 'Tổng quan', icon: ICON.dashboard, path: '/employee/dashboard' },
    { key: 'chatbot', label: 'Chatbot nội bộ', icon: ICON.chat, path: '/employee/chatbot' },
    {
      key: 'documents', label: 'Tài liệu', icon: ICON.doc, path: '/employee/documents',
      children: [
        { key: 'doc-list', label: 'Danh sách tài liệu', path: '/employee/documents' },
        { key: 'doc-upload', label: 'Upload tài liệu', path: '/employee/documents/upload' },
      ],
    },
    {
      key: 'review', label: 'Công việc cần duyệt', icon: ICON.review, path: '/employee/review/metadata', badge: 12,
      children: [
        { key: 'review-metadata', label: 'Metadata', path: '/employee/review/metadata' },
        { key: 'review-clauses', label: 'Điều khoản', path: '/employee/review/clauses' },
        { key: 'review-relations', label: 'Quan hệ tài liệu', path: '/employee/review/relations' },
        { key: 'review-conflicts', label: 'Mâu thuẫn', path: '/employee/review/conflicts' },
      ],
    },
    { key: 'history', label: 'Lịch sử hội thoại', icon: ICON.history, path: '/employee/history' },
    { key: 'account', label: 'Tài khoản', icon: ICON.account, path: '/employee/account' },
  ],
  admin: [
    { key: 'dashboard', label: 'Tổng quan', icon: ICON.dashboard, path: '/admin/dashboard' },
    { key: 'users', label: 'Người dùng', icon: ICON.users, path: '/admin/users' },
    { key: 'roles', label: 'Vai trò & Quyền', icon: ICON.shield, path: '/admin/roles' },
    { key: 'logs', label: 'Nhật ký hệ thống', icon: ICON.log, path: '/admin/logs' },
    { key: 'account', label: 'Tài khoản', icon: ICON.account, path: '/admin/account' },
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  customer: 'Khách hàng',
  employee: 'Nhân viên ngân hàng',
  admin: 'Quản trị viên',
}

const ROLE_COLORS: Record<Role, string> = {
  customer: 'bg-blue-100 text-blue-700',
  employee: 'bg-amber-100 text-amber-700',
  admin: 'bg-purple-100 text-purple-700',
}

export default function AppLayout({
  children,
  role,
  pageTitle,
}: {
  children: ReactNode
  role: Role
  pageTitle: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['documents', 'review']))
  const [notifOpen, setNotifOpen] = useState(false)

  const navItems = NAV_CONFIG[role]
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/')

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const userName = role === 'customer' ? 'Nguyễn Thị Mai' : role === 'employee' ? 'Trần Văn Hùng' : 'Admin Hệ thống'

  return (
    <div className="flex h-screen bg-[#F4F6F9] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#1A2B4A] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#C8102E] rounded flex items-center justify-center">
              <span className="text-white text-xs font-black">SHB</span>
            </div>
            <div>
              <div className="text-white text-sm font-bold leading-tight">SHB RAG</div>
              <div className="text-white/40 text-[10px]">Knowledge Base</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-2.5 border-b border-white/10">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${ROLE_COLORS[role]}`}>
            {ROLE_LABELS[role]}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(item => {
            const hasChildren = item.children && item.children.length > 0
            const expanded = expandedGroups.has(item.key)
            const active = isActive(item.path)

            return (
              <div key={item.key} className="mb-0.5">
                <button
                  onClick={() => {
                    if (hasChildren) toggleGroup(item.key)
                    else navigate(item.path)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left text-xs font-medium transition-colors cursor-pointer ${
                    active && !hasChildren
                      ? 'bg-[#C8102E] text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <span className="opacity-80">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-[#C8102E] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <svg className={`w-3 h-3 transition-transform opacity-50 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {hasChildren && expanded && (
                  <div className="ml-4 mt-0.5 border-l border-white/10 pl-2">
                    {item.children!.map(child => (
                      <button
                        key={child.key}
                        onClick={() => navigate(child.path)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors cursor-pointer ${
                          currentPath === child.path
                            ? 'text-white bg-white/12 font-medium'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/6'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/8 cursor-pointer">
            <Avatar name={userName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{userName}</div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              {ICON.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-13 bg-white border-b border-[#DDE1E9] flex items-center px-5 gap-4 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-gray-900">{pageTitle}</h2>
          </div>

          {/* Notif */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer text-gray-500"
            >
              {ICON.bell}
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#C8102E] rounded-full" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white border border-[#DDE1E9] rounded-lg shadow-xl z-40">
                <div className="px-4 py-3 border-b border-[#DDE1E9] text-xs font-semibold text-gray-700">Thông báo</div>
                {[
                  { text: '3 tài liệu mới chờ duyệt metadata', time: '5 phút trước' },
                  { text: 'Phát hiện 2 mâu thuẫn điều khoản mới', time: '1 giờ trước' },
                  { text: 'Upload tài liệu QĐ-2024/001 thành công', time: '2 giờ trước' },
                ].map((n, i) => (
                  <div key={i} className="px-4 py-3 border-b border-[#DDE1E9] hover:bg-gray-50 cursor-pointer">
                    <div className="text-xs text-gray-700">{n.text}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{n.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar name={role === 'admin' ? 'Admin Hệ thống' : role === 'employee' ? 'Trần Văn Hùng' : 'Nguyễn Thị Mai'} size="sm" />
            <span className="text-xs text-gray-600 font-medium">
              {role === 'admin' ? 'Admin' : role === 'employee' ? 'Trần V. Hùng' : 'Nguyễn T. Mai'}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
