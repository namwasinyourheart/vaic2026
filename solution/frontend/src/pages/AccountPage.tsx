import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../domain'
import { resetDemoData } from '../services/api'
import { Avatar, Btn, Card, Input } from '../components/shared'

export default function AccountPage() {
  const { user, changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  if (!user) return null

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSaved(false)
    if (next.length < 8) return setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.')
    if (next !== confirm) return setPasswordError('Mật khẩu xác nhận không khớp.')
    try {
      setSaving(true)
      await changePassword(current, next)
      setCurrent(''); setNext(''); setConfirm(''); setPasswordSaved(true)
    } catch (reason) {
      setPasswordError(reason instanceof Error ? reason.message : 'Không thể đổi mật khẩu.')
    } finally { setSaving(false) }
  }

  return <AppLayout pageTitle="Tài khoản"><div className="max-w-3xl mx-auto space-y-4">
    {user.mustChangePassword && <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Yêu cầu đổi mật khẩu:</strong> Tài khoản đang sử dụng mật khẩu mặc định. Bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.</div>}
    <Card className="p-5 flex items-center gap-4"><Avatar name={user.name} size="md" /><div><h2 className="font-semibold">{user.name}</h2><div className="text-xs text-gray-500">{ROLE_LABELS[user.role]} · {user.email || 'Chưa cập nhật email'}</div></div></Card>
    <Card className="p-5"><h3 className="font-semibold text-sm mb-4">Thông tin cá nhân</h3><div className="grid grid-cols-2 gap-4"><Input label="Họ tên" value={user.name} /><Input label="Email" value={user.email} /><Input label="Tên đăng nhập" value={user.username} /><Input label="Phòng ban" value={user.department || '—'} /></div></Card>
    <Card className="p-5"><h3 className="font-semibold text-sm mb-1">Đổi mật khẩu</h3><p className="text-xs text-gray-500 mb-4">Mật khẩu mới cần tối thiểu 8 ký tự.</p><form onSubmit={submitPassword} className="space-y-3 max-w-md"><Input label="Mật khẩu hiện tại" type="password" required value={current} onChange={setCurrent} /><Input label="Mật khẩu mới" type="password" required value={next} onChange={setNext} /><Input label="Xác nhận mật khẩu mới" type="password" required value={confirm} onChange={setConfirm} />{passwordError && <div role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{passwordError}</div>}{passwordSaved && <div className="text-xs text-green-700">Đã đổi mật khẩu thành công.</div>}<Btn disabled={saving}>{saving ? 'Đang cập nhật…' : 'Đổi mật khẩu'}</Btn></form></Card>
    <Card className="p-5"><h3 className="font-semibold text-sm">Dữ liệu trình duyệt cũ</h3><p className="text-xs text-gray-500 my-2">Xóa dữ liệu mock localStorage từ phiên bản frontend cũ. Dữ liệu Backend không bị thay đổi.</p><Btn variant="outline" onClick={() => { resetDemoData(); location.reload() }}>Xóa dữ liệu mock cũ</Btn></Card>
  </div></AppLayout>
}
