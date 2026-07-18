import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../domain'
import { Avatar, Btn, Card, Input } from '../components/shared'

export default function AccountPage() {
  const { user, changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  if (!user) return null

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault()
    setError(''); setSuccess(false)
    if (next.length < 8) return setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
    if (next !== confirm) return setError('Mật khẩu xác nhận không khớp.')
    try {
      setSaving(true)
      await changePassword(current, next)
      setCurrent(''); setNext(''); setConfirm(''); setSuccess(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đổi mật khẩu.')
    } finally { setSaving(false) }
  }

  return <AppLayout pageTitle="Tài khoản"><div className="max-w-3xl mx-auto space-y-4">
    <Card className="p-5 flex items-center gap-4"><Avatar name={user.name} size="md" /><div><h2 className="font-semibold">{user.name}</h2><div className="text-xs text-gray-500">{ROLE_LABELS[user.role]} · {user.email || 'Chưa cập nhật email'}</div></div></Card>
    <Card className="p-5"><h3 className="font-semibold text-sm mb-4">Thông tin cá nhân</h3><div className="grid grid-cols-2 gap-4"><Input label="Họ tên" value={user.name} /><Input label="Email" value={user.email} /><Input label="Tên đăng nhập" value={user.username} /><Input label="Phòng ban" value={user.department || '—'} /></div></Card>
    <Card className="p-5"><h3 className="font-semibold text-sm mb-1">Đổi mật khẩu</h3><p className="text-xs text-gray-500 mb-4">Mật khẩu mới cần tối thiểu 8 ký tự.</p><form onSubmit={submitPassword} className="space-y-3 max-w-md"><Input label="Mật khẩu hiện tại" type="password" required value={current} onChange={setCurrent} /><Input label="Mật khẩu mới" type="password" required value={next} onChange={setNext} /><Input label="Xác nhận mật khẩu mới" type="password" required value={confirm} onChange={setConfirm} />{error && <div role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}{success && <div className="text-xs text-green-700">Đã đổi mật khẩu thành công.</div>}<Btn type="submit" disabled={saving}>{saving ? 'Đang cập nhật…' : 'Đổi mật khẩu'}</Btn></form></Card>
  </div></AppLayout>
}
