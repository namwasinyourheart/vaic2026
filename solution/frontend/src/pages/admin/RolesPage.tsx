import AppLayout from '../../layouts/AppLayout'
import { Card } from '../../components/shared'

const ROLES = [
  {
    name: 'Admin', color: 'bg-purple-100 text-purple-700', count: 3,
    desc: 'Quản trị toàn bộ hệ thống, quản lý người dùng và theo dõi nhật ký.',
    perms: ['Quản lý người dùng', 'Quản lý vai trò', 'Xem nhật ký hệ thống', 'Khóa/mở tài khoản', 'Theo dõi trạng thái hệ thống'],
  },
  {
    name: 'Nhân viên Nghiệp vụ', color: 'bg-amber-100 text-amber-700', count: 124,
    desc: 'Nhân viên ngân hàng thực hiện nghiệp vụ tra cứu và duyệt tài liệu.',
    perms: ['Sử dụng chatbot nội bộ', 'Upload tài liệu', 'Duyệt metadata', 'Duyệt điều khoản', 'Duyệt quan hệ tài liệu', 'Duyệt mâu thuẫn', 'Xem toàn bộ tài liệu nội bộ', 'Xem lịch sử phiên bản'],
  },
  {
    name: 'Customer', color: 'bg-blue-100 text-blue-700', count: 215,
    desc: 'Khách hàng sử dụng chatbot để tra cứu thông tin công khai.',
    perms: ['Sử dụng chatbot công khai', 'Xem lịch sử hội thoại', 'Xem nguồn trích dẫn công khai', 'Đánh giá câu trả lời'],
  },
]

const PERMISSION_MATRIX = [
  { feature: 'Chatbot công khai', admin: 'Theo cấu hình', employee: '✓', customer: '✓' },
  { feature: 'Chatbot nội bộ', admin: 'Không', employee: '✓', customer: '✗' },
  { feature: 'Upload tài liệu', admin: 'Không', employee: '✓', customer: '✗' },
  { feature: 'Duyệt metadata', admin: 'Không', employee: '✓', customer: '✗' },
  { feature: 'Duyệt điều khoản', admin: 'Không', employee: '✓', customer: '✗' },
  { feature: 'Duyệt quan hệ', admin: 'Không', employee: '✓', customer: '✗' },
  { feature: 'Duyệt mâu thuẫn', admin: 'Không', employee: '✓', customer: '✗' },
  { feature: 'Quản lý người dùng', admin: '✓', employee: '✗', customer: '✗' },
  { feature: 'Quản lý vai trò', admin: '✓', employee: '✗', customer: '✗' },
  { feature: 'Xem nhật ký hệ thống', admin: '✓', employee: '✗', customer: '✗' },
]

function PermCell({ value }: { value: string }) {
  if (value === '✓') return <span className="text-green-600 font-bold">✓</span>
  if (value === '✗') return <span className="text-gray-300">✗</span>
  return <span className="text-amber-600 text-xs">{value}</span>
}

export default function RolesPage() {
  return (
    <AppLayout role="ROLE_ADMIN" pageTitle="Vai trò & Quyền">
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Vai trò và quyền truy cập</h1>
      <p className="text-sm text-gray-500 mb-5">Quản lý vai trò và phân quyền trong hệ thống</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {ROLES.map(role => (
          <Card key={role.name} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded ${role.color}`}>{role.name}</span>
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{role.count} người dùng</span>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">{role.desc}</p>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Quyền</div>
              <ul className="space-y-1">
                {role.perms.map(p => (
                  <li key={p} className="flex items-center gap-1.5 text-xs text-gray-700">
                    <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-[#DDE1E9]">
          <h2 className="text-sm font-semibold text-gray-900">Ma trận phân quyền</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#DDE1E9] bg-[#F8FAFC]">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 w-52">Chức năng</th>
                {['Admin', 'Nhân viên Nghiệp vụ', 'Customer'].map(r => (
                  <th key={r} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row, i) => (
                <tr key={i} className={`border-b border-[#DDE1E9] hover:bg-[#F8FAFC] transition-colors ${i % 2 === 0 ? '' : 'bg-[#FAFBFC]'}`}>
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">{row.feature}</td>
                  <td className="px-4 py-3 text-center"><PermCell value={row.admin} /></td>
                  <td className="px-4 py-3 text-center"><PermCell value={row.employee} /></td>
                  <td className="px-4 py-3 text-center"><PermCell value={row.customer} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  )
}
