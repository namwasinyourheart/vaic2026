import type { ReactNode } from 'react'

// ─── Status Badges ────────────────────────────────────────────────────────────

type BadgeVariant =
  | 'queued' | 'processing' | 'pending' | 'completed' | 'failed' | 'reprocessing'
  | 'draft' | 'approved' | 'rejected'
  | 'effective' | 'partially_effective' | 'superseded' | 'expired' | 'future_effective'
  | 'detected' | 'confirmed' | 'resolved'
  | 'active' | 'locked' | 'info' | 'warning'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  queued: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-50 text-blue-700',
  pending: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  reprocessing: 'bg-purple-50 text-purple-700',
  draft: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  effective: 'bg-green-50 text-green-700',
  partially_effective: 'bg-amber-50 text-amber-700',
  superseded: 'bg-gray-100 text-gray-500',
  expired: 'bg-red-50 text-red-600',
  future_effective: 'bg-blue-50 text-blue-700',
  detected: 'bg-orange-50 text-orange-700',
  confirmed: 'bg-red-50 text-red-700',
  resolved: 'bg-green-50 text-green-700',
  active: 'bg-green-50 text-green-700',
  locked: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
}

const BADGE_LABELS: Record<BadgeVariant, string> = {
  queued: 'Chờ xử lý',
  processing: 'Đang xử lý',
  pending: 'Chờ duyệt',
  completed: 'Hoàn tất',
  failed: 'Xử lý lỗi',
  reprocessing: 'Xử lý lại',
  draft: 'Bản nháp',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  effective: 'Có hiệu lực',
  partially_effective: 'Hiệu lực một phần',
  superseded: 'Đã thay thế',
  expired: 'Hết hiệu lực',
  future_effective: 'Chưa hiệu lực',
  detected: 'AI phát hiện',
  confirmed: 'Đã xác nhận',
  resolved: 'Đã xử lý',
  active: 'Đang hoạt động',
  locked: 'Bị khóa',
  info: 'Thông tin',
  warning: 'Cảnh báo',
}

export function Badge({ variant, label }: { variant: BadgeVariant; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono ${BADGE_STYLES[variant]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label ?? BADGE_LABELS[variant]}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[6px] border border-[#DDE1E9] ${className}`}>
      {children}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  color = 'blue',
}: {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'red' | 'amber' | 'green' | 'gray' | 'purple'
}) {
  const accent: Record<string, string> = {
    blue: 'border-l-blue-500',
    red: 'border-l-[#C8102E]',
    amber: 'border-l-amber-500',
    green: 'border-l-green-500',
    gray: 'border-l-gray-400',
    purple: 'border-l-purple-500',
  }
  return (
    <Card className={`p-4 border-l-4 ${accent[color]}`}>
      <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 font-mono">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </Card>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── Btn ──────────────────────────────────────────────────────────────────────

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded transition-all cursor-pointer disabled:opacity-50'
  const variants: Record<string, string> = {
    primary: 'bg-[#C8102E] text-white hover:bg-[#a50d25] border border-[#C8102E]',
    secondary: 'bg-[#1A2B4A] text-white hover:bg-[#142038] border border-[#1A2B4A]',
    ghost: 'text-gray-600 hover:bg-gray-100 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
    outline: 'bg-white text-gray-700 border border-[#DDE1E9] hover:border-gray-400 hover:bg-gray-50',
  }
  const sizes: Record<string, string> = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
    lg: 'text-sm px-5 py-2.5',
  }
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  helper,
  required,
}: {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  type?: string
  helper?: string
  required?: boolean
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
      />
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
    </div>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label?: string
  value?: string
  onChange?: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors appearance-none cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table({
  columns,
  rows,
}: {
  columns: { key: string; label: string; width?: string }[]
  rows: Record<string, ReactNode>[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#DDE1E9] bg-[#F8FAFC]">
            {columns.map(col => (
              <th
                key={col.key}
                className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#DDE1E9] hover:bg-[#F8FAFC] transition-colors"
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex border-b border-[#DDE1E9] gap-0">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px cursor-pointer ${
            active === tab.key
              ? 'border-[#C8102E] text-[#C8102E]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-mono">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-lg shadow-xl w-full ${widths[size]} border border-[#DDE1E9]`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE1E9]">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[#DDE1E9] flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description }: { icon?: string; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-3 opacity-40">{icon}</div>}
      <div className="text-sm font-medium text-gray-500">{title}</div>
      {description && <div className="text-xs text-gray-400 mt-1 max-w-xs">{description}</div>}
    </div>
  )
}

// ─── Search Box ───────────────────────────────────────────────────────────────

export function SearchBox({
  placeholder = 'Tìm kiếm...',
  value,
  onChange,
}: {
  placeholder?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-8 pr-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] w-64 transition-colors"
      />
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-full bg-[#1A2B4A] text-white flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  )
}

// Reusable interaction primitives used by the role workspaces.
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return <div className="flex items-center gap-2 text-xs"><button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-2 py-1 border rounded disabled:opacity-40">Trước</button><span>Trang {page}/{Math.max(1, totalPages)}</span><button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="px-2 py-1 border rounded disabled:opacity-40">Sau</button></div>
}

export function Drawer({ open, title, children, onClose, width = 'w-96' }: { open: boolean; title: string; children: ReactNode; onClose: () => void; width?: string }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 bg-black/25"><button aria-label="Đóng drawer" onClick={onClose} className="absolute inset-0 cursor-default" /><aside className={`absolute right-0 top-0 bottom-0 ${width} max-w-full bg-white shadow-2xl flex flex-col`}><div className="p-4 border-b flex items-center justify-between"><h2 className="font-semibold text-sm">{title}</h2><button onClick={onClose} className="text-gray-500">×</button></div><div className="flex-1 overflow-y-auto">{children}</div></aside></div>
}

export function Toast({ message, tone = 'success', onClose }: { message: string; tone?: 'success' | 'error' | 'info'; onClose?: () => void }) {
  return <div role="status" className={`fixed bottom-5 right-5 z-[60] rounded-lg px-4 py-3 text-xs text-white shadow-xl ${tone === 'error' ? 'bg-red-700' : tone === 'info' ? 'bg-blue-700' : 'bg-gray-900'}`}>{message}{onClose && <button onClick={onClose} className="ml-3 opacity-70">×</button>}</div>
}

export function ConfirmationDialog({ open, title, description, confirmLabel = 'Xác nhận', onConfirm, onClose }: { open: boolean; title: string; description: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void }) {
  return <Modal open={open} onClose={onClose} title={title} footer={<><Btn variant="outline" size="sm" onClick={onClose}>Hủy</Btn><Btn variant="danger" size="sm" onClick={onConfirm}>{confirmLabel}</Btn></>}><p className="text-sm text-gray-600">{description}</p></Modal>
}
