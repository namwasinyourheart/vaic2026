import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ROLE_HOME } from '../domain'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Vui lòng nhập đủ tên đăng nhập và mật khẩu.')
      return
    }
    try {
      setLoading(true)
      const next = await login(username, password, remember)
      const target = (location.state as { from?: string } | null)?.from
      const accountPath = next.mustChangePassword
        ? `${ROLE_HOME[next.role].replace(/\/[^/]+$/, '')}/account`
        : target || ROLE_HOME[next.role]
      navigate(accountPath, { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể kết nối hệ thống.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="min-h-screen grid lg:grid-cols-2 bg-[#F4F6F9]">
    <section className="hidden lg:flex bg-[#192B4B] text-white p-14 flex-col justify-between relative overflow-hidden">
      <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-[#C8102E]/20" />
      <div className="relative"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-[#C8102E] grid place-items-center font-black">SHB</div><div><div className="font-bold text-xl">Advanced RAG</div><div className="text-white/55 text-sm">Knowledge Base</div></div></div></div>
      <div className="relative max-w-lg"><h1 className="text-4xl font-bold leading-tight">Tri thức ngân hàng,<br />được kết nối bằng AI.</h1><p className="text-white/60 mt-5 leading-relaxed">Tra cứu văn bản, điều khoản, phiên bản và quan hệ tri thức trong một không gian an toàn theo vai trò.</p></div>
      <div className="text-xs text-white/35">SHB Internal Platform · Version 0.3</div>
    </section>
    <section className="flex items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-xl border border-[#DDE1E9] shadow-sm p-7">
      <div className="mb-6"><h2 className="text-xl font-bold">Đăng nhập hệ thống</h2><p className="text-sm text-gray-500 mt-1">Sử dụng tài khoản được cấp để tiếp tục</p></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="text-xs font-medium">Tên đăng nhập hoặc email</span><div className="relative mt-1"><UserRound className="absolute left-3 top-2.5 text-gray-400" size={17} /><input autoFocus value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded-md py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" /></div></label>
        <label className="block"><span className="text-xs font-medium">Mật khẩu</span><div className="relative mt-1"><LockKeyhole className="absolute left-3 top-2.5 text-gray-400" size={17} /><input value={password} onChange={e => setPassword(e.target.value)} type={show ? 'text' : 'password'} className="w-full border rounded-md py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" /><button type="button" aria-label="Hiện hoặc ẩn mật khẩu" onClick={() => setShow(v => !v)} className="absolute right-3 top-2.5 text-gray-400">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        <div className="flex justify-between text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Ghi nhớ đăng nhập</label><button type="button" onClick={() => setError('Vui lòng liên hệ Quản trị hệ thống để đặt lại mật khẩu.')} className="text-[#C8102E]">Quên mật khẩu?</button></div>
        {error && <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}
        <button disabled={loading} className="w-full bg-[#C8102E] text-white rounded-md py-2.5 text-sm font-semibold disabled:opacity-60">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
    </div></section>
  </div>
}
