import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { Badge, Btn, Card, Table, Modal } from '../../components/shared'

const CONFLICTS = [
  { id: 'CF-001', doc1: 'QĐ-SHB-2024/01', doc2: 'TT-NHNN-2023/06', clause1: 'Điều 5, Khoản 2', clause2: 'Điều 7, Khoản 1', severity: 'Trung bình', confidence: '87%', status: 'pending', found: '16/01/2024' },
  { id: 'CF-002', doc1: 'QC-CVTD-2023', doc2: 'TT-NHNN-2024/01', clause1: 'Điều 12, Khoản 3', clause2: 'Điều 4', severity: 'Cao', confidence: '92%', status: 'pending', found: '17/01/2024' },
  { id: 'CF-003', doc1: 'QĐ-SHB-2023/15', doc2: 'NQ-HĐQT-2024/01', clause1: 'Điều 8', clause2: 'Điều 3', severity: 'Thấp', confidence: '65%', status: 'confirmed', found: '14/01/2024' },
  { id: 'CF-004', doc1: 'HD-SHB-2024/02', doc2: 'QĐ-SHB-2022/11', clause1: 'Điều 6, Khoản 4', clause2: 'Điều 5', severity: 'Trung bình', confidence: '79%', status: 'rejected', found: '10/01/2024' },
]

const SEVERITY_COLORS: Record<string, string> = {
  Cao: 'text-red-700 bg-red-50',
  'Trung bình': 'text-amber-700 bg-amber-50',
  Thấp: 'text-green-700 bg-green-50',
}

type ConflictStatus = 'pending' | 'confirmed' | 'rejected' | 'resolved'

export default function ReviewConflictsPage() {
  const [selected, setSelected] = useState<typeof CONFLICTS[0] | null>(null)
  const [note, setNote] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <AppLayout role="employee" pageTitle="Duyệt Mâu thuẫn">
      {!selected ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Mâu thuẫn chờ duyệt</h1>
              <p className="text-sm text-gray-500">{CONFLICTS.filter(c => c.status === 'pending').length} mâu thuẫn cần xem xét</p>
            </div>
          </div>
          <Card>
            <Table
              columns={[
                { key: 'id', label: 'Mã', width: '90px' },
                { key: 'doc1', label: 'Tài liệu thứ nhất' },
                { key: 'doc2', label: 'Tài liệu thứ hai' },
                { key: 'clauses', label: 'Điều khoản liên quan' },
                { key: 'severity', label: 'Mức độ', width: '100px' },
                { key: 'confidence', label: 'Độ tin cậy', width: '90px' },
                { key: 'status', label: 'Trạng thái', width: '100px' },
                { key: 'found', label: 'Ngày phát hiện', width: '110px' },
                { key: 'actions', label: '', width: '70px' },
              ]}
              rows={CONFLICTS.map(c => ({
                id: <span className="font-mono text-xs font-bold text-gray-700">{c.id}</span>,
                doc1: <span className="text-xs font-medium text-gray-700">{c.doc1}</span>,
                doc2: <span className="text-xs font-medium text-gray-700">{c.doc2}</span>,
                clauses: <span className="text-xs text-gray-500">{c.clause1} ↔ {c.clause2}</span>,
                severity: <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_COLORS[c.severity]}`}>{c.severity}</span>,
                confidence: <span className="text-xs font-mono text-gray-600">{c.confidence}</span>,
                status: <Badge variant={c.status as ConflictStatus} />,
                found: <span className="text-xs font-mono text-gray-500">{c.found}</span>,
                actions: (
                  <Btn variant="outline" size="sm" onClick={() => setSelected(c)}>Xem</Btn>
                ),
              }))}
            />
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <button onClick={() => setSelected(null)} className="hover:text-gray-800 cursor-pointer flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Danh sách mâu thuẫn
            </button>
            <span>/</span>
            <span className="text-gray-800 font-medium">{selected.id}</span>
          </div>

          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-gray-700 text-sm">{selected.id}</span>
              <Badge variant={selected.status as ConflictStatus} />
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_COLORS[selected.severity]}`}>{selected.severity}</span>
              <span className="text-xs font-mono text-gray-500">Độ tin cậy AI: {selected.confidence}</span>
            </div>
          </div>

          {/* Two-column clauses */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { title: 'Điều khoản thứ nhất', doc: selected.doc1, clause: selected.clause1, content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng tại SHB áp dụng mức 6,0%/năm đối với gửi qua kênh số kể từ ngày 01/01/2024. Mức lãi suất này có thể thay đổi theo từng quý.' },
              { title: 'Điều khoản thứ hai', doc: selected.doc2, clause: selected.clause2, content: 'Các tổ chức tín dụng không được áp dụng lãi suất huy động vượt mức trần 5,5%/năm đối với tiền gửi kỳ hạn từ 1 tháng đến dưới 12 tháng và 6,0%/năm đối với kỳ hạn 12 tháng trở lên.' },
            ].map((side, i) => (
              <Card key={i} className="p-4">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{side.title}</div>
                <div className="text-xs font-bold text-gray-800 mb-0.5">{side.doc}</div>
                <div className="text-xs font-mono text-gray-500 mb-3">{side.clause}</div>
                <div className="bg-[#FFFBE6] border border-amber-200 rounded p-3 text-xs text-gray-700 leading-relaxed">
                  {side.content}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="effective" />
                  <span className="text-[10px] text-gray-400 font-mono">HL từ: {i === 0 ? '01/01/2024' : '01/07/2023'}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* AI Analysis */}
          <Card className="p-4 mb-4 border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                <span className="text-orange-600 text-[9px] font-black">AI</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Phân tích AI</h3>
              <span className="text-xs font-mono text-gray-400 ml-auto">Độ tin cậy: {selected.confidence}</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Phần nội dung có khả năng mâu thuẫn:</div>
                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-gray-700">
                  <span className="font-medium text-orange-800">"6,0%/năm đối với gửi qua kênh số"</span> (QĐ-SHB-2024/01) so với <span className="font-medium text-orange-800">"không được vượt mức trần 6,0%/năm đối với kỳ hạn 12 tháng trở lên"</span> (TT-NHNN-2023/06)
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Giải thích nguyên nhân:</div>
                <p className="text-xs text-gray-700">Tài liệu nội bộ SHB áp dụng đúng mức trần lãi suất do NHNN quy định. Tuy nhiên, điều khoản trong Thông tư chỉ nói về mức trần tối đa, không phân biệt kênh tại quầy hay kênh số. Cần xác nhận liệu việc áp dụng 6,0% cho online (bằng mức trần) có vi phạm tinh thần quy định hay không.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-gray-500 mb-0.5">Loại mâu thuẫn:</div>
                  <div className="font-medium text-gray-800">Mâu thuẫn biên độ áp dụng</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-0.5">Mức độ ảnh hưởng:</div>
                  <div className="font-medium text-amber-700">{selected.severity}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Reviewer action */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Kết luận người duyệt</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded focus:outline-none focus:ring-1 focus:ring-[#C8102E]/30 resize-none mb-3"
                placeholder="Nhập ghi chú kết luận..."
              />
            </div>
            <div className="flex gap-2">
              <Btn variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>Xác nhận có mâu thuẫn</Btn>
              <Btn variant="primary" size="sm">Xác nhận không có mâu thuẫn</Btn>
              <Btn variant="outline" size="sm">Chưa đủ thông tin</Btn>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận mâu thuẫn"
        footer={
          <>
            <Btn variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>Hủy</Btn>
            <Btn variant="danger" size="sm" onClick={() => { setConfirmOpen(false); setSelected(null) }}>Lưu quyết định</Btn>
          </>
        }
      >
        <p className="text-sm text-gray-700 mb-3">Bạn xác nhận tồn tại mâu thuẫn giữa hai điều khoản này. Hệ thống sẽ ghi nhận kết luận và thông báo cho các bên liên quan.</p>
        <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
          Điều khoản ưu tiên cần được xác định bởi cấp có thẩm quyền trước khi chatbot sử dụng thông tin này.
        </div>
      </Modal>
    </AppLayout>
  )
}
