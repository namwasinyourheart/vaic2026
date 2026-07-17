import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn } from '../components/shared'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)

    if (username === 'admin') navigate('/admin/dashboard')
    else if (username === 'employee') navigate('/employee/dashboard')
    else if (username === 'customer') navigate('/customer/chatbot')
    else setError('Tên đăng nhập hoặc mật khẩu không đúng.')
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#1A2B4A] relative overflow-hidden flex-col justify-between p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #C8102E 0, #C8102E 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#C8102E] rounded flex items-center justify-center">
              <span className="text-white text-sm font-black">SHB</span>
            </div>
            <div>
              <div className="text-white text-lg font-bold">SHB RAG</div>
              <div className="text-white/40 text-xs">Advanced Knowledge Base</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Hệ thống tra cứu<br />tài liệu thông minh
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Nền tảng AI hỗ trợ tra cứu, phân tích và quản lý tài liệu pháp lý ngân hàng với độ chính xác cao.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[
            { label: 'Tài liệu đã xử lý', value: '2,847' },
            { label: 'Điều khoản trích xuất', value: '48,293' },
            { label: 'Quan hệ phát hiện', value: '12,401' },
            { label: 'Mâu thuẫn phân tích', value: '324' },
          ].map(s => (
            <div key={s.label} className="bg-white/6 rounded-lg p-3 border border-white/10">
              <div className="text-white font-bold font-mono text-lg">{s.value}</div>
              <div className="text-white/40 text-[11px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#C8102E] rounded flex items-center justify-center">
              <span className="text-white text-xs font-black">SHB</span>
            </div>
            <span className="text-[#1A2B4A] font-bold">SHB RAG Knowledge Base</span>
          </div>

          <div className="bg-white rounded-xl border border-[#DDE1E9] p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Đăng nhập</h2>
            <p className="text-sm text-gray-500 mb-6">Nhập thông tin tài khoản để tiếp tục</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 text-xs">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập hoặc email"
                  className="w-full px-3 py-2.5 text-sm border border-[#DDE1E9] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-3 py-2.5 text-sm border border-[#DDE1E9] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#C8102E]"
                  />
                  <span className="text-xs text-gray-600">Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" className="text-xs text-[#C8102E] hover:underline cursor-pointer">
                  Quên mật khẩu?
                </button>
              </div>
              <Btn type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang đăng nhập...
                  </span>
                ) : 'Đăng nhập'}
              </Btn>
            </form>

            <div className="mt-6 pt-5 border-t border-[#DDE1E9]">
              <p className="text-xs text-gray-400 text-center mb-3">Demo: nhập một trong các tài khoản</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { user: 'customer', label: 'Khách hàng', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { user: 'employee', label: 'Nhân viên', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { user: 'admin', label: 'Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                ].map(d => (
                  <button
                    key={d.user}
                    type="button"
                    onClick={() => { setUsername(d.user); setPassword('password') }}
                    className={`text-[11px] px-2 py-1.5 rounded border font-medium cursor-pointer transition-opacity hover:opacity-80 ${d.color}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
