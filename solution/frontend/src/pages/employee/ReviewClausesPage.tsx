import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { Badge, Btn, Card } from '../../components/shared'

const TREE = [
  { id: 'ch1', code: 'Chương I', title: 'Quy định chung', level: 0, children: ['art1', 'art2', 'art3'] },
  { id: 'art1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', level: 1, reviewStatus: 'approved', effectStatus: 'effective' },
  { id: 'art2', code: 'Điều 2', title: 'Đối tượng áp dụng', level: 1, reviewStatus: 'pending', effectStatus: 'effective' },
  { id: 'art3', code: 'Điều 3', title: 'Giải thích từ ngữ', level: 1, reviewStatus: 'pending', effectStatus: 'effective' },
  { id: 'ch2', code: 'Chương II', title: 'Mức lãi suất', level: 0, children: ['art4', 'art5'] },
  { id: 'art4', code: 'Điều 4', title: 'Lãi suất không kỳ hạn', level: 1, reviewStatus: 'pending', effectStatus: 'effective' },
  { id: 'art5', code: 'Điều 5', title: 'Lãi suất có kỳ hạn', level: 1, reviewStatus: 'pending', effectStatus: 'effective',
    children: ['art5-k1', 'art5-k2', 'art5-k3'] },
  { id: 'art5-k1', code: 'Khoản 1', title: 'Lãi suất dưới 6 tháng', level: 2, reviewStatus: 'pending', effectStatus: 'effective' },
  { id: 'art5-k2', code: 'Khoản 2', title: 'Lãi suất 12 tháng', level: 2, reviewStatus: 'pending', effectStatus: 'effective' },
  { id: 'art5-k3', code: 'Khoản 3', title: 'Lãi suất trên 12 tháng', level: 2, reviewStatus: 'draft', effectStatus: 'future_effective' },
]

const CLAUSE_CONTENT: Record<string, string> = {
  art1: 'Quyết định này quy định về mức lãi suất huy động vốn bằng đồng Việt Nam áp dụng cho khách hàng cá nhân tại Ngân hàng TMCP Sài Gòn – Hà Nội.',
  art2: 'Quyết định này áp dụng cho tất cả khách hàng cá nhân gửi tiền bằng đồng Việt Nam tại SHB và toàn bộ các chi nhánh trong hệ thống.',
  art3: 'Trong Quyết định này, các từ ngữ dưới đây được hiểu như sau:\n1. "Tiền gửi có kỳ hạn" là khoản tiền gửi có thỏa thuận về thời hạn gửi và lãi suất.\n2. "Gửi online" là hình thức gửi tiền qua ứng dụng SHB Mobile hoặc SHB DigiBank.',
  art5: 'Lãi suất huy động có kỳ hạn bằng đồng Việt Nam được áp dụng theo từng kỳ hạn cụ thể.',
  'art5-k1': 'Lãi suất tiết kiệm kỳ hạn dưới 6 tháng áp dụng theo biểu lãi suất công bố hàng tháng, không vượt quá mức trần lãi suất do Ngân hàng Nhà nước quy định.',
  'art5-k2': 'Lãi suất tiết kiệm kỳ hạn 12 tháng: 5,80%/năm (tại quầy) và 6,00%/năm (online) áp dụng từ 01/01/2024.',
  'art5-k3': 'Lãi suất tiết kiệm kỳ hạn trên 12 tháng sẽ được quy định cụ thể theo từng sản phẩm. Điều khoản này có hiệu lực từ 01/04/2024.',
}

export default function ReviewClausesPage() {
  const [selected, setSelected] = useState<string>('art5-k2')
  const [editContent, setEditContent] = useState<string>('')
  const [editing, setEditing] = useState(false)

  const clause = TREE.find(c => c.id === selected)
  const content = CLAUSE_CONTENT[selected] || 'Nội dung điều khoản...'

  return (
    <AppLayout role="employee" pageTitle="Duyệt Điều khoản">
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Duyệt điều khoản</h1>
      <p className="text-sm text-gray-500 mb-4">QĐ-SHB-2024/01 – 12 điều khoản cần duyệt</p>

      <div className="flex gap-4 h-[calc(100vh-11rem)]">
        {/* Tree */}
        <div className="w-52 flex-shrink-0">
          <Card className="h-full overflow-y-auto p-2">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">Cấu trúc</div>
            {TREE.map(item => (
              <button
                key={item.id}
                onClick={() => { if (item.level > 0) setSelected(item.id) }}
                className={`w-full text-left rounded transition-colors cursor-pointer mb-0.5 ${
                  item.level === 0
                    ? 'px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 cursor-default'
                    : `pl-${(item.level) * 3 + 2} pr-2 py-1.5 text-xs ${selected === item.id ? 'bg-[#FFF1F3] text-[#C8102E] font-medium' : 'text-gray-600 hover:bg-gray-50'}`
                }`}
                style={{ paddingLeft: item.level > 0 ? `${item.level * 12 + 8}px` : undefined }}
              >
                <div className="flex items-center gap-1.5">
                  <span>{item.code}</span>
                  {item.reviewStatus && (
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      item.reviewStatus === 'approved' ? 'bg-green-500' : item.reviewStatus === 'pending' ? 'bg-amber-400' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
                {item.level > 0 && <div className="text-[10px] opacity-60 truncate">{item.title}</div>}
              </button>
            ))}
          </Card>
        </div>

        {/* Original doc */}
        <div className="flex-1 min-w-0">
          <Card className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[#DDE1E9] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nội dung tài liệu gốc</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-700 leading-relaxed bg-[#FAFAFA]">
              <h3 className="font-bold text-gray-800 mt-2 mb-3">Chương II. Mức lãi suất</h3>
              <p className="mb-3"><strong>Điều 5. Lãi suất có kỳ hạn</strong></p>
              <p className="mb-3">Lãi suất huy động có kỳ hạn bằng đồng Việt Nam được áp dụng theo từng kỳ hạn cụ thể như sau:</p>
              <p className="mb-2 pl-4"><strong>Khoản 1.</strong> Lãi suất tiết kiệm kỳ hạn dưới 6 tháng áp dụng theo biểu lãi suất công bố hàng tháng...</p>
              <p className="mb-2 pl-4 bg-yellow-50 border-l-2 border-amber-400 py-2 pr-2 rounded-r">
                <strong>Khoản 2.</strong> Lãi suất tiết kiệm kỳ hạn 12 tháng: <strong>5,80%/năm (tại quầy)</strong> và <strong>6,00%/năm (online)</strong> áp dụng từ 01/01/2024.
              </p>
              <p className="mb-2 pl-4"><strong>Khoản 3.</strong> Lãi suất tiết kiệm kỳ hạn trên 12 tháng sẽ được quy định theo từng sản phẩm. Hiệu lực từ 01/04/2024.</p>
            </div>
          </Card>
        </div>

        {/* Edit form */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[#DDE1E9]">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thông tin điều khoản</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {clause && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Mã điều khoản</div>
                      <div className="text-sm font-bold text-gray-800">{clause.code}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Cấp nội dung</div>
                      <div className="text-xs font-medium text-gray-700">{clause.level === 0 ? 'Chương' : clause.level === 1 ? 'Điều' : 'Khoản'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">Tiêu đề</div>
                    <input className="w-full px-2 py-1.5 text-xs border border-[#DDE1E9] rounded focus:outline-none focus:ring-1 focus:ring-[#C8102E]/30" defaultValue={clause.title} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-gray-500">Nội dung</div>
                      <button onClick={() => { setEditing(!editing); setEditContent(content) }} className="text-[10px] text-[#C8102E] hover:underline cursor-pointer">
                        {editing ? 'Hủy' : 'Chỉnh sửa'}
                      </button>
                    </div>
                    {editing ? (
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={5}
                        className="w-full px-2 py-1.5 text-xs border border-[#C8102E] rounded focus:outline-none resize-none"
                      />
                    ) : (
                      <div className="text-xs text-gray-700 bg-[#F8FAFC] border border-[#DDE1E9] rounded p-2.5 leading-relaxed whitespace-pre-line">
                        {content}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {clause.reviewStatus && (
                      <div>
                        <div className="text-[10px] text-gray-500 mb-1">Trạng thái duyệt</div>
                        <Badge variant={clause.reviewStatus as 'approved' | 'pending' | 'draft'} />
                      </div>
                    )}
                    {clause.effectStatus && (
                      <div>
                        <div className="text-[10px] text-gray-500 mb-1">Hiệu lực</div>
                        <Badge variant={clause.effectStatus as 'effective' | 'future_effective'} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">Ngày bắt đầu hiệu lực</div>
                    <input type="date" className="w-full px-2 py-1.5 text-xs border border-[#DDE1E9] rounded focus:outline-none focus:ring-1 focus:ring-[#C8102E]/30" defaultValue="2024-01-01" />
                  </div>
                </>
              )}
            </div>
            <div className="px-4 py-3 border-t border-[#DDE1E9] space-y-2">
              <Btn variant="primary" size="sm" className="w-full justify-center">Duyệt</Btn>
              <div className="flex gap-2">
                <Btn variant="outline" size="sm" className="flex-1 justify-center">Từ chối</Btn>
                <Btn variant="ghost" size="sm" className="flex-1 justify-center">Lưu nháp</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
