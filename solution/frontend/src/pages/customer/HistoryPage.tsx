import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { Card, SearchBox, Btn } from '../../components/shared'

const HISTORY = [
  { id: '1', title: 'Lãi suất tiết kiệm 2024', preview: 'Lãi suất tiết kiệm kỳ hạn 12 tháng hiện tại là bao nhiêu?', created: '17/01/2024 09:32', updated: '17/01/2024 09:45', count: 4 },
  { id: '2', title: 'Điều kiện vay mua nhà', preview: 'Tôi muốn vay mua nhà, cần những điều kiện gì?', created: '16/01/2024 14:10', updated: '16/01/2024 14:38', count: 8 },
  { id: '3', title: 'Phí chuyển khoản quốc tế', preview: 'Phí chuyển khoản quốc tế SWIFT là bao nhiêu?', created: '14/01/2024 10:22', updated: '14/01/2024 10:35', count: 3 },
  { id: '4', title: 'Thủ tục mở tài khoản doanh nghiệp', preview: 'Hồ sơ cần thiết để mở tài khoản thanh toán doanh nghiệp?', created: '12/01/2024 16:04', updated: '12/01/2024 16:20', count: 6 },
  { id: '5', title: 'Quy định giao dịch ngoại tệ', preview: 'Tôi muốn mua ngoại tệ USD, quy trình như thế nào?', created: '10/01/2024 11:55', updated: '10/01/2024 12:10', count: 5 },
  { id: '6', title: 'Hạn mức thẻ tín dụng', preview: 'Hạn mức tối đa của thẻ tín dụng SHB Premium là bao nhiêu?', created: '08/01/2024 09:15', updated: '08/01/2024 09:28', count: 2 },
]

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = HISTORY.filter(h => h.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <AppLayout role="ROLE_CUSTOMER" pageTitle="Lịch sử hội thoại">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Lịch sử hội thoại</h1>
            <p className="text-sm text-gray-500 mt-0.5">{HISTORY.length} cuộc hội thoại</p>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm kiếm hội thoại..." />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
          </select>
        </div>

        <div className="space-y-2">
          {filtered.map(conv => (
            <Card key={conv.id} className="p-4 hover:border-[#C8102E]/30 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#C8102E] transition-colors">
                      {conv.title}
                    </h3>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {conv.count} tin nhắn
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.preview}</p>
                  <div className="flex gap-3 mt-2 text-[10px] text-gray-400 font-mono">
                    <span>Tạo: {conv.created}</span>
                    <span>·</span>
                    <span>Cập nhật: {conv.updated}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Btn variant="outline" size="sm">Mở lại</Btn>
                  <button className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
