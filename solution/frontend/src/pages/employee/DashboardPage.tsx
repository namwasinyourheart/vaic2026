import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { StatCard, Card, Badge } from '../../components/shared'

const RECENT_TASKS = [
  { type: 'Metadata', doc: 'QĐ-SHB-2024/01 - Quy định lãi suất huy động', status: 'pending' as const, user: 'Nguyễn Văn An', date: '17/01 09:30' },
  { type: 'Điều khoản', doc: 'QC-CVTD-2023 - Quy chế cho vay tiêu dùng', status: 'pending' as const, user: 'Trần Thị Bình', date: '17/01 08:15' },
  { type: 'Mâu thuẫn', doc: 'TT-NHNN-2023/06 vs QĐ-SHB-2022/15', status: 'detected' as const, user: 'AI System', date: '16/01 22:00' },
  { type: 'Quan hệ', doc: 'TT-NHNN-2024/01 - Thông tư tín dụng mới', status: 'pending' as const, user: 'Lê Minh Cường', date: '16/01 16:45' },
  { type: 'Metadata', doc: 'NQ-HĐQT-2024/03 - Nghị quyết hội đồng quản trị', status: 'approved' as const, user: 'Phạm Thu Hà', date: '16/01 14:20' },
]

const RECENT_DOCS = [
  { name: 'Quyết định biểu lãi suất huy động Q1/2024', type: 'Quyết định', date: '17/01/2024', status: 'pending' as const, user: 'Nguyễn Văn An' },
  { name: 'Quy chế cho vay tiêu dùng (sửa đổi lần 3)', type: 'Quy chế', date: '16/01/2024', status: 'processing' as const, user: 'Trần Thị Bình' },
  { name: 'Thông tư NHNN 01/2024 - Quy định tín dụng', type: 'Thông tư', date: '15/01/2024', status: 'completed' as const, user: 'Lê Minh Cường' },
  { name: 'Nghị quyết HĐQT 03/2024', type: 'Nghị quyết', date: '14/01/2024', status: 'approved' as const, user: 'Phạm Thu Hà' },
]

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  return (
    <AppLayout role="employee" pageTitle="Tổng quan">
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Tổng tài liệu" value="2,847" sub="↑ 23 tháng này" color="blue" />
        <StatCard label="Đang xử lý" value="12" sub="5 đang parse" color="purple" />
        <StatCard label="Chờ duyệt" value="47" sub="↑ 8 hôm nay" color="amber" />
        <StatCard label="Xử lý lỗi" value="3" sub="Cần xem xét" color="red" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => navigate('/employee/review/metadata')}
          className="bg-white border border-[#DDE1E9] rounded p-4 cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all group"
        >
          <div className="text-2xl font-bold font-mono text-amber-600">18</div>
          <div className="text-xs text-gray-500 mt-0.5 group-hover:text-amber-600 transition-colors">Metadata chờ duyệt</div>
        </div>
        <div
          onClick={() => navigate('/employee/review/clauses')}
          className="bg-white border border-[#DDE1E9] rounded p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="text-2xl font-bold font-mono text-blue-600">156</div>
          <div className="text-xs text-gray-500 mt-0.5 group-hover:text-blue-600 transition-colors">Điều khoản chờ duyệt</div>
        </div>
        <div
          onClick={() => navigate('/employee/review/relations')}
          className="bg-white border border-[#DDE1E9] rounded p-4 cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all group"
        >
          <div className="text-2xl font-bold font-mono text-purple-600">43</div>
          <div className="text-xs text-gray-500 mt-0.5 group-hover:text-purple-600 transition-colors">Quan hệ chờ duyệt</div>
        </div>
        <div
          onClick={() => navigate('/employee/review/conflicts')}
          className="bg-white border border-[#DDE1E9] rounded p-4 cursor-pointer hover:border-red-300 hover:shadow-sm transition-all group"
        >
          <div className="text-2xl font-bold font-mono text-red-600">7</div>
          <div className="text-xs text-gray-500 mt-0.5 group-hover:text-red-600 transition-colors">Mâu thuẫn chờ duyệt</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <div className="px-4 py-3 border-b border-[#DDE1E9] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Công việc gần đây</h2>
            <button onClick={() => navigate('/employee/review/metadata')} className="text-xs text-[#C8102E] hover:underline cursor-pointer">Xem tất cả</button>
          </div>
          <div className="divide-y divide-[#DDE1E9]">
            {RECENT_TASKS.map((t, i) => (
              <div key={i} className="px-4 py-3 hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t.type}</span>
                      <Badge variant={t.status} />
                    </div>
                    <div className="text-xs text-gray-700 truncate">{t.doc}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{t.user} · {t.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-[#DDE1E9] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Tài liệu gần đây</h2>
            <button onClick={() => navigate('/employee/documents')} className="text-xs text-[#C8102E] hover:underline cursor-pointer">Xem tất cả</button>
          </div>
          <div className="divide-y divide-[#DDE1E9]">
            {RECENT_DOCS.map((d, i) => (
              <div key={i} className="px-4 py-3 hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{d.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-mono">{d.type}</span>
                      <span className="text-gray-300">·</span>
                      <Badge variant={d.status} />
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{d.user} · {d.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
