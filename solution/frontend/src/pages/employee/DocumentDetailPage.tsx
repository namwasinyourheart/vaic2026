import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { Card, Badge, Btn, Tabs } from '../../components/shared'

const TOC = [
  { id: 'ch1', label: 'Chương I. Quy định chung', level: 0 },
  { id: 'art1', label: 'Điều 1. Phạm vi điều chỉnh', level: 1 },
  { id: 'art2', label: 'Điều 2. Đối tượng áp dụng', level: 1 },
  { id: 'art3', label: 'Điều 3. Giải thích từ ngữ', level: 1 },
  { id: 'ch2', label: 'Chương II. Mức lãi suất', level: 0 },
  { id: 'art4', label: 'Điều 4. Lãi suất không kỳ hạn', level: 1 },
  { id: 'art5', label: 'Điều 5. Lãi suất có kỳ hạn', level: 1 },
  { id: 'ch3', label: 'Chương III. Điều khoản thi hành', level: 0 },
  { id: 'art6', label: 'Điều 6. Hiệu lực thi hành', level: 1 },
]

const CLAUSES = [
  {
    id: 'art1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', level: 'Điều',
    content: 'Quyết định này quy định về mức lãi suất huy động vốn bằng đồng Việt Nam áp dụng cho khách hàng cá nhân tại Ngân hàng TMCP Sài Gòn – Hà Nội.',
    status: 'effective', reviewStatus: 'approved',
  },
  {
    id: 'art5-k1', code: 'Điều 5 – Khoản 1', title: 'Lãi suất kỳ hạn dưới 6 tháng', level: 'Khoản',
    content: 'Lãi suất tiết kiệm kỳ hạn dưới 6 tháng áp dụng theo biểu lãi suất công bố hàng tháng, không vượt quá mức trần lãi suất do Ngân hàng Nhà nước quy định.',
    status: 'effective', reviewStatus: 'pending',
  },
  {
    id: 'art5-k2', code: 'Điều 5 – Khoản 2', title: 'Lãi suất kỳ hạn 12 tháng', level: 'Khoản',
    content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng áp dụng mức 5,8%/năm đối với gửi tại quầy và 6,0%/năm đối với gửi qua kênh số kể từ ngày 01/01/2024.',
    status: 'effective', reviewStatus: 'approved',
  },
]

const RELATIONS = [
  { type: 'Sửa đổi', docName: 'QĐ-SHB-2023/18 - Biểu lãi suất Q4/2023', clause: 'Điều 5', direction: 'amends' },
  { type: 'Tham chiếu', docName: 'TT-NHNN-2023/06 - Trần lãi suất huy động', clause: 'Điều 3', direction: 'references' },
  { type: 'Thay thế', docName: 'QĐ-SHB-2023/12 - Biểu lãi suất Q3/2023', clause: 'Toàn bộ', direction: 'supersedes' },
]

const CONFLICTS = [
  { id: 'CF-001', doc2: 'TT-NHNN-2023/06', clause1: 'Điều 5 Khoản 2', clause2: 'Điều 7', severity: 'Trung bình', status: 'pending', confidence: '87%' },
]

const HISTORY = [
  { time: '17/01/2024 09:30', action: 'Upload file', actor: 'Nguyễn Văn An', type: 'upload' },
  { time: '17/01/2024 09:30', action: 'AI bắt đầu xử lý', actor: 'Hệ thống', type: 'system' },
  { time: '17/01/2024 09:35', action: 'Trích xuất metadata hoàn tất', actor: 'AI', type: 'system' },
  { time: '17/01/2024 09:40', action: 'Trích xuất điều khoản hoàn tất (12 điều)', actor: 'AI', type: 'system' },
  { time: '17/01/2024 10:15', action: 'Duyệt metadata', actor: 'Trần Thị Bình', type: 'review' },
  { time: '17/01/2024 14:20', action: 'Duyệt điều khoản – Điều 1, 2, 3, 6', actor: 'Trần Thị Bình', type: 'review' },
]

export default function DocumentDetailPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedClause, setSelectedClause] = useState<string | null>(null)

  return (
    <AppLayout role="employee" pageTitle="Chi tiết tài liệu">
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <button onClick={() => navigate('/employee/documents')} className="hover:text-gray-800 cursor-pointer">Tài liệu</button>
        <span>/</span>
        <span className="text-gray-800 font-medium">QĐ-SHB-2024/01</span>
      </div>

      {/* Doc header */}
      <div className="bg-white border border-[#DDE1E9] rounded-lg px-5 py-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 mb-1">
              Quyết định biểu lãi suất huy động vốn cá nhân Q1/2024
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
              <span>QĐ-SHB-2024/01</span>
              <span>·</span>
              <span>Quyết định</span>
              <span>·</span>
              <span>Ban Nguồn vốn</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="completed" />
              <Badge variant="effective" />
              <Badge variant="approved" />
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm">Chỉnh sửa</Btn>
            <Btn variant="ghost" size="sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Xử lý lại
            </Btn>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <div className="px-4">
          <Tabs
            tabs={[
              { key: 'overview', label: 'Tổng quan' },
              { key: 'content', label: 'Nội dung' },
              { key: 'clauses', label: 'Điều khoản', count: 12 },
              { key: 'relations', label: 'Quan hệ', count: RELATIONS.length },
              { key: 'conflicts', label: 'Mâu thuẫn', count: CONFLICTS.length },
              { key: 'history', label: 'Lịch sử' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === 'overview' && (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: 'Tên tài liệu', value: 'Quyết định biểu lãi suất huy động vốn cá nhân Q1/2024' },
                { label: 'Số hiệu', value: 'QĐ-SHB-2024/01' },
                { label: 'Loại tài liệu', value: 'Quyết định' },
                { label: 'Đơn vị ban hành', value: 'Ban Nguồn vốn – SHB' },
                { label: 'Ngày ban hành', value: '28/12/2023' },
                { label: 'Ngày hiệu lực', value: '01/01/2024' },
                { label: 'Ngày hết hiệu lực', value: '31/03/2024' },
                { label: 'Lĩnh vực nghiệp vụ', value: 'Huy động vốn' },
                { label: 'Phạm vi truy cập', value: 'Công khai' },
                { label: 'Người upload', value: 'Nguyễn Văn An' },
                { label: 'Ngày upload', value: '17/01/2024 09:30' },
              ].map(row => (
                <div key={row.label}>
                  <div className="text-xs text-gray-500 mb-0.5">{row.label}</div>
                  <div className="text-sm font-medium text-gray-800">{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="flex" style={{ height: '500px' }}>
            {/* TOC */}
            <div className="w-56 flex-shrink-0 border-r border-[#DDE1E9] overflow-y-auto p-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">Mục lục</div>
              {TOC.map(item => (
                <button
                  key={item.id}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors cursor-pointer ${
                    item.level === 0 ? 'font-semibold text-gray-700' : 'text-gray-500 pl-4 hover:text-gray-700'
                  } hover:bg-gray-50`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-base font-bold text-gray-900 mb-4">QUYẾT ĐỊNH<br />Về biểu lãi suất huy động vốn cá nhân Quý I/2024</h2>
              <p className="mb-4 font-medium">TỔNG GIÁM ĐỐC NGÂN HÀNG TMCP SÀI GÒN – HÀ NỘI</p>
              <p className="mb-4 italic text-gray-500">Căn cứ Luật các Tổ chức tín dụng số 47/2010/QH12 ngày 16/6/2010 và Luật sửa đổi, bổ sung một số điều của Luật các Tổ chức tín dụng số 17/2017/QH14 ngày 20/11/2017;</p>
              <h3 className="font-bold text-gray-800 mt-5 mb-2">CHƯƠNG I. QUY ĐỊNH CHUNG</h3>
              <p className="mb-2"><strong>Điều 1. Phạm vi điều chỉnh</strong></p>
              <p className="mb-4">Quyết định này quy định về mức lãi suất huy động vốn bằng đồng Việt Nam áp dụng cho khách hàng cá nhân tại Ngân hàng TMCP Sài Gòn – Hà Nội (SHB) kể từ ngày 01 tháng 01 năm 2024.</p>
              <p className="mb-2"><strong>Điều 2. Đối tượng áp dụng</strong></p>
              <p className="mb-4">Quyết định này áp dụng cho tất cả khách hàng cá nhân gửi tiền bằng đồng Việt Nam tại SHB và toàn bộ các chi nhánh, phòng giao dịch trong hệ thống SHB trên toàn quốc.</p>
              <h3 className="font-bold text-gray-800 mt-5 mb-2">CHƯƠNG II. MỨC LÃI SUẤT</h3>
              <p className="mb-2"><strong>Điều 5. Lãi suất có kỳ hạn</strong></p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full border border-gray-200 text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left">Kỳ hạn</th>
                      <th className="border border-gray-200 px-3 py-2 text-right">Tại quầy (%/năm)</th>
                      <th className="border border-gray-200 px-3 py-2 text-right">Online (%/năm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['1 tháng', '2,50', '2,70'],
                      ['3 tháng', '3,00', '3,20'],
                      ['6 tháng', '4,50', '4,70'],
                      ['9 tháng', '5,00', '5,20'],
                      ['12 tháng', '5,80', '6,00'],
                      ['18 tháng', '5,50', '5,70'],
                    ].map(row => (
                      <tr key={row[0]} className="hover:bg-blue-50">
                        <td className="border border-gray-200 px-3 py-1.5">{row[0]}</td>
                        <td className="border border-gray-200 px-3 py-1.5 text-right font-mono">{row[1]}</td>
                        <td className="border border-gray-200 px-3 py-1.5 text-right font-mono">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clauses' && (
          <div className="flex" style={{ height: '480px' }}>
            {/* Tree */}
            <div className="w-56 flex-shrink-0 border-r border-[#DDE1E9] overflow-y-auto p-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">Cấu trúc</div>
              {CLAUSES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClause(c.id)}
                  className={`w-full text-left px-2 py-2 rounded text-xs transition-colors cursor-pointer mb-0.5 ${
                    selectedClause === c.id ? 'bg-[#FFF1F3] text-[#C8102E]' : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="font-medium">{c.code}</div>
                  <div className="text-[10px] truncate opacity-70">{c.title}</div>
                </button>
              ))}
            </div>
            {/* Clause detail */}
            <div className="flex-1 overflow-y-auto p-5">
              {selectedClause ? (() => {
                const clause = CLAUSES.find(c => c.id === selectedClause)!
                return (
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{clause.level}</span>
                          <Badge variant={clause.reviewStatus as 'approved' | 'pending'} />
                          <Badge variant="effective" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">{clause.code}. {clause.title}</h3>
                      </div>
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#DDE1E9] rounded p-4 text-sm text-gray-700 leading-relaxed mb-4">
                      {clause.content}
                    </div>
                    <div className="flex gap-2">
                      <Btn variant="primary" size="sm">Duyệt</Btn>
                      <Btn variant="outline" size="sm">Từ chối</Btn>
                      <Btn variant="ghost" size="sm">Chỉnh sửa</Btn>
                    </div>
                  </div>
                )
              })() : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Chọn một điều khoản để xem chi tiết
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'relations' && (
          <div className="p-5">
            <div className="space-y-3">
              {RELATIONS.map((r, i) => (
                <div key={i} className="border border-[#DDE1E9] rounded p-4 flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${
                    r.direction === 'amends' ? 'bg-orange-100 text-orange-700'
                    : r.direction === 'references' ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                  }`}>{r.type}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{r.docName}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{r.clause}</div>
                  </div>
                  <Btn variant="ghost" size="sm">Xem</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'conflicts' && (
          <div className="p-5">
            {CONFLICTS.map(c => (
              <div key={c.id} className="border border-orange-200 bg-orange-50 rounded p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-orange-700">{c.id}</span>
                    <Badge variant="detected" />
                  </div>
                  <span className="text-xs font-mono text-gray-500">Độ tin cậy: {c.confidence}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500 mb-0.5">Điều khoản 1:</div>
                    <div className="font-medium text-gray-800">QĐ-SHB-2024/01 – {c.clause1}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">Điều khoản 2:</div>
                    <div className="font-medium text-gray-800">{c.doc2} – {c.clause2}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Btn variant="primary" size="sm">Xem chi tiết</Btn>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-5">
            <div className="space-y-0">
              {HISTORY.map((h, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${
                      h.type === 'upload' ? 'bg-blue-500' : h.type === 'review' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {i < HISTORY.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className={`pb-4 ${i < HISTORY.length - 1 ? '' : ''}`}>
                    <div className="text-sm text-gray-800">{h.action}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{h.actor} · {h.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
