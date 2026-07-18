import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', full_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    try {
      setLoading(true)
      await authService.register({ username: form.username, full_name: form.full_name, email: form.email || undefined, password: form.password })
      setOk(true)
      window.setTimeout(() => navigate('/login'), 800)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Đăng ký tài khoản thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="auth-page"><form onSubmit={submit}>
    <h1>Đăng ký tài khoản</h1>
    <p className="text-sm text-gray-500">Tạo tài khoản để sử dụng hệ thống.</p>
    <input required placeholder="Tên đăng nhập" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
    <input required placeholder="Họ và tên" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
    <input type="email" placeholder="Email (không bắt buộc)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
    <input required type="password" placeholder="Mật khẩu" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
    <input required type="password" placeholder="Xác nhận mật khẩu" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
    {error && <p className="error" role="alert">{error}</p>}
    {ok && <p role="status">Đăng ký tài khoản thành công, đang chuyển tới đăng nhập…</p>}
    <button disabled={loading}>{loading ? 'Đang đăng ký…' : 'Đăng ký'}</button>
    <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
  </form></div>
}
