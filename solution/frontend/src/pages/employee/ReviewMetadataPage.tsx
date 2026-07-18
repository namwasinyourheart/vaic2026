import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { Btn, Card, Select, Modal } from '../../components/shared'

const QUEUE = [
  { id: '1', name: 'QĐ-SHB-2024/01 – Biểu lãi suất huy động Q1', code: 'QĐ-SHB-2024/01', date: '17/01/2024', user: 'Nguyễn Văn An', confidence: 94 },
  { id: '2', name: 'QC-CVTD-2023 – Quy chế cho vay tiêu dùng (sửa đổi 3)', code: 'QC-CVTD-2023', date: '16/01/2024', user: 'Trần Thị Bình', confidence: 82 },
  { id: '3', name: 'TB-SHB-2024/003 – Điều chỉnh biểu phí dịch vụ', code: 'TB-SHB-2024/003', date: '14/01/2024', user: 'Vũ Thị Lan', confidence: 71 },
]

interface MetaField {
  key: string
  label: string
  aiValue: string
  confidence: number
  editedValue: string
}

const INITIAL_META: MetaField[] = [
  { key: 'name', label: 'Tên tài liệu', aiValue: 'Quyết định biểu lãi suất huy động vốn cá nhân Q1/2024', confidence: 98, editedValue: '' },
  { key: 'code', label: 'Số hiệu', aiValue: 'QĐ-SHB-2024/01', confidence: 97, editedValue: '' },
  { key: 'type', label: 'Loại tài liệu', aiValue: 'Quyết định', confidence: 95, editedValue: '' },
  { key: 'unit', label: 'Đơn vị ban hành', aiValue: 'Ngân hàng TMCP Sài Gòn – Hà Nội', confidence: 92, editedValue: '' },
  { key: 'issuedDate', label: 'Ngày ban hành', aiValue: '28/12/2023', confidence: 96, editedValue: '' },
  { key: 'effectiveDate', label: 'Ngày hiệu lực', aiValue: '01/01/2024', confidence: 91, editedValue: '' },
  { key: 'expiryDate', label: 'Ngày hết hiệu lực', aiValue: '31/03/2024', confidence: 78, editedValue: '' },
  { key: 'field', label: 'Lĩnh vực nghiệp vụ', aiValue: 'Huy động vốn', confidence: 89, editedValue: '' },
  { key: 'scope', label: 'Phạm vi áp dụng', aiValue: 'Toàn hệ thống SHB', confidence: 85, editedValue: '' },
  { key: 'status', label: 'Trạng thái hiệu lực', aiValue: 'Đang có hiệu lực', confidence: 94, editedValue: '' },
  { key: 'access', label: 'Phạm vi truy cập', aiValue: 'Công khai', confidence: 88, editedValue: '' },
]

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-green-500' : value >= 75 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-mono text-gray-500">{value}%</span>
    </div>
  )
}

export default function ReviewMetadataPage() {
  const [selected, setSelected] = useState<string>(QUEUE[0].id)
  const [fields, setFields] = useState<MetaField[]>(INITIAL_META)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const updateField = (key: string, val: string) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, editedValue: val } : f))
  }

  return (
    <AppLayout role="employee" pageTitle="Duyệt Metadata">
      <div className="flex gap-4 h-[calc(100vh-8.25rem)]">
        {/* Queue list */}
        <div className="w-72 flex-shrink-0">
          <Card className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[#DDE1E9]">
              <h2 className="text-sm font-semibold text-gray-900">Chờ duyệt</h2>
              <div className="text-xs text-gray-400 mt-0.5">{QUEUE.length} tài liệu</div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#DDE1E9]">
              {QUEUE.map(q => (
                <div
                  key={q.id}
                  onClick={() => setSelected(q.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${selected === q.id ? 'bg-[#FFF1F3] border-r-2 border-r-[#C8102E]' : 'hover:bg-gray-50'}`}
                >
                  <div className="text-xs font-medium text-gray-800 leading-snug mb-1">{q.name}</div>
                  <div className="text-[10px] font-mono text-gray-400">{q.user} · {q.date}</div>
                  <ConfidenceBar value={q.confidence} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Split view */}
        <div className="flex-1 flex gap-4 min-w-0 overflow-hidden">
          {/* Document preview */}
          <div className="flex-1 min-w-0">
            <Card className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-[#DDE1E9] flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tài liệu gốc</h3>
                <span className="text-xs text-gray-400 font-mono">PDF Preview</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-700 leading-relaxed bg-[#FAFAFA]">
                <div className="text-center font-bold text-base mb-1">NGÂN HÀNG TMCP SÀI GÒN – HÀ NỘI</div>
                <div className="text-center text-xs text-gray-500 mb-4 font-mono">Số: QĐ-SHB-2024/01</div>
                <div className="text-center font-bold mb-4">QUYẾT ĐỊNH<br /><span className="font-normal">Về việc ban hành biểu lãi suất huy động vốn</span><br /><span className="font-normal">cá nhân Quý I năm 2024</span></div>
                <p className="mb-3 italic text-gray-500 text-xs">Căn cứ Luật các Tổ chức tín dụng và các văn bản hướng dẫn thi hành;</p>
                <p className="mb-3 italic text-gray-500 text-xs">Căn cứ Thông tư số 06/2023/TT-NHNN ngày 28/6/2023 của Ngân hàng Nhà nước Việt Nam;</p>
                <p className="font-semibold mb-3">QUYẾT ĐỊNH:</p>
                <p className="mb-2"><strong>Điều 1.</strong> Ban hành kèm theo Quyết định này Biểu lãi suất huy động vốn cá nhân bằng đồng Việt Nam của Ngân hàng TMCP Sài Gòn – Hà Nội áp dụng từ ngày 01/01/2024.</p>
                <p className="mb-2"><strong>Điều 2.</strong> Quyết định này có hiệu lực từ ngày 01 tháng 01 năm 2024 và thay thế Quyết định số QĐ-SHB-2023/18 ngày 28/9/2023.</p>
              </div>
            </Card>
          </div>

          {/* Metadata form */}
          <div className="w-80 flex-shrink-0">
            <Card className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-[#DDE1E9]">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Metadata trích xuất</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-[#DDE1E9]">
                {fields.map(f => (
                  <div key={f.key} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-gray-600">{f.label}</div>
                      <ConfidenceBar value={f.confidence} />
                    </div>
                    {editingKey === f.key ? (
                      <input
                        autoFocus
                        value={f.editedValue || f.aiValue}
                        onChange={e => updateField(f.key, e.target.value)}
                        onBlur={() => setEditingKey(null)}
                        className="w-full px-2 py-1 text-xs border border-[#C8102E] rounded focus:outline-none"
                      />
                    ) : (
                      <div
                        className="text-xs text-gray-800 font-medium cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded group flex items-center justify-between"
                        onClick={() => setEditingKey(f.key)}
                      >
                        <span className={f.editedValue ? 'text-blue-600' : ''}>{f.editedValue || f.aiValue}</span>
                        <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-500 opacity-0 group-hover:opacity-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div className="px-4 py-3 border-t border-[#DDE1E9] space-y-2">
                <Btn variant="primary" size="sm" className="w-full justify-center" onClick={() => setConfirmOpen(true)}>
                  Duyệt
                </Btn>
                <div className="flex gap-2">
                  <Btn variant="outline" size="sm" className="flex-1 justify-center" onClick={() => setRejectOpen(true)}>Từ chối</Btn>
                  <Btn variant="ghost" size="sm" className="flex-1 justify-center">Lưu nháp</Btn>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận duyệt metadata"
        footer={
          <>
            <Btn variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>Hủy</Btn>
            <Btn variant="primary" size="sm" onClick={() => setConfirmOpen(false)}>Xác nhận duyệt</Btn>
          </>
        }
      >
        <div className="text-sm text-gray-700 mb-3">
          Bạn đang duyệt metadata cho tài liệu <strong>QĐ-SHB-2024/01</strong>.
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700 mb-3">
          3 trường đã được chỉnh sửa so với giá trị AI trích xuất.
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú (không bắt buộc)</label>
          <textarea rows={2} className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded focus:outline-none focus:ring-1 focus:ring-[#C8102E]/30 resize-none" placeholder="Ghi chú của người duyệt..." />
        </div>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Từ chối metadata"
        footer={
          <>
            <Btn variant="outline" size="sm" onClick={() => setRejectOpen(false)}>Hủy</Btn>
            <Btn variant="danger" size="sm" onClick={() => setRejectOpen(false)}>Xác nhận từ chối</Btn>
          </>
        }
      >
        <div className="text-sm text-gray-700 mb-3">
          Vui lòng nhập lý do từ chối để hệ thống ghi nhận.
        </div>
        <Select label="Lý do từ chối" value="" onChange={() => {}} options={[
          { value: 'wrong_data', label: 'Dữ liệu AI trích xuất sai nhiều' },
          { value: 'missing', label: 'Thiếu thông tin quan trọng' },
          { value: 'wrong_doc', label: 'Sai loại tài liệu' },
          { value: 'other', label: 'Lý do khác' },
        ]} placeholder="Chọn lý do" />
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Chi tiết</label>
          <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded focus:outline-none focus:ring-1 focus:ring-[#C8102E]/30 resize-none" placeholder="Mô tả cụ thể vấn đề..." />
        </div>
      </Modal>
    </AppLayout>
  )
}
