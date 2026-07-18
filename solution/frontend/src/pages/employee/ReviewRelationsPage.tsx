import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { Badge, Btn, Card, Table, Modal } from '../../components/shared'

const RELATIONS = [
  { id: 'R-001', srcDoc: 'QĐ-SHB-2024/01', srcClause: 'Điều 5, Khoản 2', relType: 'Sửa đổi', dstDoc: 'QĐ-SHB-2023/18', dstClause: 'Điều 5', confidence: '95%', status: 'pending' },
  { id: 'R-002', srcDoc: 'QĐ-SHB-2024/01', srcClause: 'Điều 2', relType: 'Tham chiếu', dstDoc: 'TT-NHNN-2023/06', dstClause: 'Điều 7', confidence: '88%', status: 'pending' },
  { id: 'R-003', srcDoc: 'QĐ-SHB-2024/01', srcClause: 'Toàn bộ', relType: 'Thay thế', dstDoc: 'QĐ-SHB-2023/12', dstClause: 'Toàn bộ', confidence: '99%', status: 'approved' },
  { id: 'R-004', srcDoc: 'QC-CVTD-2023', srcClause: 'Điều 12', relType: 'Thay thế một phần', dstDoc: 'QC-CVTD-2022', dstClause: 'Điều 11, 12, 13', confidence: '82%', status: 'pending' },
]

type RelStatus = 'pending' | 'approved' | 'rejected'

const REL_COLOR: Record<string, string> = {
  'Sửa đổi': 'bg-orange-100 text-orange-700',
  'Tham chiếu': 'bg-blue-100 text-blue-700',
  'Thay thế': 'bg-purple-100 text-purple-700',
  'Thay thế một phần': 'bg-pink-100 text-pink-700',
  'Bị sửa đổi': 'bg-gray-100 text-gray-600',
}

export default function ReviewRelationsPage() {
  const [selected, setSelected] = useState<typeof RELATIONS[0] | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [newRelType, setNewRelType] = useState('')

  return (
    <AppLayout role="employee" pageTitle="Duyệt Quan hệ tài liệu">
      {!selected ? (
        <>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Quan hệ tài liệu chờ duyệt</h1>
          <p className="text-sm text-gray-500 mb-4">{RELATIONS.filter(r => r.status === 'pending').length} quan hệ cần xem xét</p>
          <Card>
            <Table
              columns={[
                { key: 'id', label: 'Mã', width: '80px' },
                { key: 'src', label: 'Tài liệu nguồn' },
                { key: 'relType', label: 'Loại quan hệ', width: '140px' },
                { key: 'dst', label: 'Tài liệu đích' },
                { key: 'confidence', label: 'Độ tin cậy', width: '90px' },
                { key: 'status', label: 'Trạng thái', width: '100px' },
                { key: 'actions', label: '', width: '70px' },
              ]}
              rows={RELATIONS.map(r => ({
                id: <span className="font-mono text-xs font-bold text-gray-700">{r.id}</span>,
                src: (
                  <div>
                    <div className="text-xs font-medium text-gray-800">{r.srcDoc}</div>
                    <div className="text-[10px] font-mono text-gray-400">{r.srcClause}</div>
                  </div>
                ),
                relType: <span className={`text-xs px-2 py-0.5 rounded font-medium ${REL_COLOR[r.relType] || 'bg-gray-100 text-gray-600'}`}>{r.relType}</span>,
                dst: (
                  <div>
                    <div className="text-xs font-medium text-gray-800">{r.dstDoc}</div>
                    <div className="text-[10px] font-mono text-gray-400">{r.dstClause}</div>
                  </div>
                ),
                confidence: <span className="text-xs font-mono text-gray-600">{r.confidence}</span>,
                status: <Badge variant={r.status as RelStatus} />,
                actions: <Btn variant="outline" size="sm" onClick={() => setSelected(r)}>Xem</Btn>,
              }))}
            />
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <button onClick={() => setSelected(null)} className="hover:text-gray-800 cursor-pointer flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Danh sách quan hệ
            </button>
            <span>/</span>
            <span className="text-gray-800 font-medium">{selected.id}</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono font-bold text-gray-700 text-sm">{selected.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${REL_COLOR[selected.relType]}`}>{selected.relType}</span>
            <Badge variant={selected.status as RelStatus} />
            <span className="text-xs font-mono text-gray-500 ml-auto">Độ tin cậy AI: {selected.confidence}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { side: 'Điều khoản nguồn', doc: selected.srcDoc, clause: selected.srcClause,
                content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng tại SHB là 5,80%/năm (tại quầy) và 6,00%/năm (online) kể từ ngày 01 tháng 01 năm 2024, thay thế mức lãi suất cũ quy định tại Quyết định số QĐ-SHB-2023/18.' },
              { side: 'Điều khoản đích', doc: selected.dstDoc, clause: selected.dstClause,
                content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng tại SHB là 5,50%/năm (tại quầy) và 5,70%/năm (online) áp dụng từ ngày 01/10/2023 đến ngày 31/12/2023.' },
            ].map((side, i) => (
              <Card key={i} className="p-4">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{side.side}</div>
                <div className="text-xs font-bold text-gray-800">{side.doc}</div>
                <div className="text-xs font-mono text-gray-500 mb-3">{side.clause}</div>
                <div className="bg-[#F8FAFC] border border-[#DDE1E9] rounded p-3 text-xs text-gray-700 leading-relaxed">
                  {side.content}
                </div>
              </Card>
            ))}
          </div>

          {/* AI explanation */}
          <Card className="p-4 mb-4 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 text-[9px] font-black">AI</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Giải thích quan hệ</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed mb-3">
              Tài liệu nguồn (QĐ-SHB-2024/01) trực tiếp đề cập đến việc <strong>sửa đổi</strong> mức lãi suất so với Quyết định cũ. Cụm từ "thay thế mức lãi suất cũ quy định tại Quyết định số QĐ-SHB-2023/18" xác nhận mối quan hệ sửa đổi có định danh rõ ràng.
            </p>
            <div className="flex gap-2 text-xs">
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded p-2.5">
                <div className="font-medium text-blue-800 mb-1">Loại quan hệ AI đề xuất</div>
                <span className="font-bold">{selected.relType}</span>
              </div>
              <div className="flex-1 bg-gray-50 border border-[#DDE1E9] rounded p-2.5">
                <div className="font-medium text-gray-600 mb-1">Ngày hiệu lực liên quan</div>
                <span>01/01/2024 – 31/03/2024</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Thao tác người duyệt</h3>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Thay đổi loại quan hệ (nếu cần)</label>
              <select
                value={newRelType}
                onChange={e => setNewRelType(e.target.value)}
                className="px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none w-64 cursor-pointer"
              >
                <option value="">Giữ nguyên: {selected.relType}</option>
                <option>Sửa đổi</option>
                <option>Tham chiếu</option>
                <option>Thay thế</option>
                <option>Thay thế một phần</option>
                <option>Bị sửa đổi</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Btn variant="primary" size="sm" onClick={() => setConfirmOpen(true)}>Duyệt quan hệ</Btn>
              <Btn variant="outline" size="sm">Từ chối</Btn>
              <Btn variant="ghost" size="sm">Thêm ghi chú</Btn>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận quan hệ"
        footer={
          <>
            <Btn variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>Hủy</Btn>
            <Btn variant="primary" size="sm" onClick={() => { setConfirmOpen(false); setSelected(null) }}>Xác nhận</Btn>
          </>
        }
      >
        <p className="text-sm text-gray-700">Xác nhận quan hệ <strong>{selected?.relType}</strong> giữa <strong>{selected?.srcDoc}</strong> và <strong>{selected?.dstDoc}</strong>?</p>
      </Modal>
    </AppLayout>
  )
}
