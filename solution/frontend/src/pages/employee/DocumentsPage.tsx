import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { Card, Badge, Btn, SearchBox, Table, PageHeader } from '../../components/shared'

const DOCS = [
  { id: '1', name: 'Quyết định biểu lãi suất huy động Q1/2024', code: 'QĐ-SHB-2024/01', type: 'Quyết định', unit: 'Ban Nguồn vốn', user: 'Nguyễn Văn An', date: '17/01/2024', procStatus: 'pending', approveStatus: 'draft' },
  { id: '2', name: 'Quy chế cho vay tiêu dùng (sửa đổi lần 3)', code: 'QC-CVTD-2023', type: 'Quy chế', unit: 'Ban Tín dụng', user: 'Trần Thị Bình', date: '16/01/2024', procStatus: 'processing', approveStatus: 'draft' },
  { id: '3', name: 'Thông tư NHNN 01/2024 về tín dụng', code: 'TT-NHNN-01/2024', type: 'Thông tư', unit: 'NHNN', user: 'Lê Minh Cường', date: '15/01/2024', procStatus: 'completed', approveStatus: 'approved' },
  { id: '4', name: 'Nghị quyết HĐQT 03/2024', code: 'NQ-HĐQT-03/2024', type: 'Nghị quyết', unit: 'Hội đồng quản trị', user: 'Phạm Thu Hà', date: '14/01/2024', procStatus: 'completed', approveStatus: 'approved' },
  { id: '5', name: 'Quy định phát hành thẻ tín dụng SHB 2023', code: 'QC-SHB-TD/2023', type: 'Quy định', unit: 'Ban Thẻ', user: 'Đỗ Quang Minh', date: '10/01/2024', procStatus: 'failed', approveStatus: 'rejected' },
  { id: '6', name: 'Thông báo điều chỉnh biểu phí dịch vụ', code: 'TB-SHB-2024/003', type: 'Thông báo', unit: 'Ban Dịch vụ', user: 'Vũ Thị Lan', date: '08/01/2024', procStatus: 'queued', approveStatus: 'draft' },
  { id: '7', name: 'Hướng dẫn mở tài khoản doanh nghiệp online', code: 'HD-SHB-2024/02', type: 'Hướng dẫn', unit: 'Ban KH Doanh nghiệp', user: 'Nguyễn Văn An', date: '05/01/2024', procStatus: 'completed', approveStatus: 'approved' },
]

const PROC_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái xử lý' },
  { value: 'queued', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'failed', label: 'Xử lý lỗi' },
]

type ProcStatus = 'queued' | 'processing' | 'pending' | 'completed' | 'failed'
type ApproveStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [procFilter, setProcFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = DOCS.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
    const matchProc = !procFilter || d.procStatus === procFilter
    return matchSearch && matchProc
  })

  return (
    <AppLayout role="employee" pageTitle="Tài liệu">
      <PageHeader
        title="Danh sách tài liệu"
        subtitle={`${filtered.length} tài liệu`}
        actions={
          <>
            <Btn variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Bộ lọc
            </Btn>
            <Btn variant="primary" size="sm" onClick={() => navigate('/employee/documents/upload')}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload tài liệu
            </Btn>
          </>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc mã số..." />
        <select
          value={procFilter}
          onChange={e => setProcFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none cursor-pointer"
        >
          {PROC_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {showFilters && (
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Loại tài liệu', opts: ['Tất cả', 'Quyết định', 'Thông tư', 'Quy chế', 'Nghị quyết'] },
              { label: 'Đơn vị ban hành', opts: ['Tất cả', 'NHNN', 'Ban Tín dụng', 'Ban Nguồn vốn'] },
              { label: 'Trạng thái duyệt', opts: ['Tất cả', 'Bản nháp', 'Chờ duyệt', 'Đã duyệt', 'Từ chối'] },
              { label: 'Ngày upload', opts: ['Tất cả', 'Hôm nay', '7 ngày', '30 ngày'] },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <select className="w-full px-2 py-1.5 text-xs border border-[#DDE1E9] rounded bg-white focus:outline-none cursor-pointer">
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <Table
          columns={[
            { key: 'name', label: 'Tên tài liệu' },
            { key: 'code', label: 'Số hiệu', width: '120px' },
            { key: 'type', label: 'Loại', width: '100px' },
            { key: 'unit', label: 'Đơn vị ban hành', width: '160px' },
            { key: 'user', label: 'Người upload', width: '120px' },
            { key: 'date', label: 'Ngày upload', width: '100px' },
            { key: 'procStatus', label: 'Xử lý', width: '120px' },
            { key: 'approveStatus', label: 'Duyệt', width: '100px' },
            { key: 'actions', label: '', width: '80px' },
          ]}
          rows={filtered.map(d => ({
            name: (
              <button
                onClick={() => navigate(`/employee/documents/${d.id}`)}
                className="text-left font-medium text-gray-800 hover:text-[#C8102E] transition-colors cursor-pointer max-w-xs truncate block"
              >
                {d.name}
              </button>
            ),
            code: <span className="font-mono text-xs text-gray-500">{d.code}</span>,
            type: <span className="text-xs text-gray-600">{d.type}</span>,
            unit: <span className="text-xs text-gray-600 truncate block max-w-[140px]">{d.unit}</span>,
            user: <span className="text-xs text-gray-600">{d.user}</span>,
            date: <span className="text-xs font-mono text-gray-500">{d.date}</span>,
            procStatus: <Badge variant={d.procStatus as ProcStatus} />,
            approveStatus: <Badge variant={d.approveStatus as ApproveStatus} />,
            actions: (
              <div className="flex gap-1">
                <button
                  onClick={() => navigate(`/employee/documents/${d.id}`)}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  title="Xem chi tiết"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            ),
          }))}
        />
      </Card>
    </AppLayout>
  )
}
