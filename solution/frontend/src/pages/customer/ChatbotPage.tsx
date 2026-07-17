import { useState, useRef, useEffect } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { Badge, Btn } from '../../components/shared'

interface Citation {
  id: string
  docName: string
  docCode: string
  clause: string
  date: string
  status: 'effective' | 'superseded' | 'expired'
}

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  time: string
  citations?: Citation[]
  warning?: string
}

const DEMO_MESSAGES: Message[] = [
  {
    id: '1', role: 'user',
    content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng hiện tại là bao nhiêu?',
    time: '09:32',
  },
  {
    id: '2', role: 'ai',
    content: 'Lãi suất tiết kiệm kỳ hạn 12 tháng của SHB hiện tại là **5,8%/năm** đối với hình thức gửi tại quầy và **6,0%/năm** đối với gửi online.\n\nMức lãi suất này được áp dụng từ ngày 01/01/2024 theo Quyết định số 01/QĐ-SHB/2024 về biểu lãi suất huy động vốn cá nhân.',
    time: '09:32',
    citations: [
      { id: 'c1', docName: 'Quyết định biểu lãi suất huy động vốn cá nhân', docCode: 'QĐ-01/2024', clause: 'Điều 3, Khoản 2', date: '01/01/2024', status: 'effective' },
      { id: 'c2', docName: 'Thông báo điều chỉnh lãi suất tháng 01/2024', docCode: 'TB-SHB-2024/001', clause: 'Phần II', date: '15/01/2024', status: 'effective' },
    ],
  },
  {
    id: '3', role: 'user',
    content: 'Điều kiện để mở thẻ tín dụng SHB là gì?',
    time: '09:35',
  },
  {
    id: '4', role: 'ai',
    content: 'Để mở thẻ tín dụng SHB, khách hàng cần đáp ứng các điều kiện sau:\n\n**1. Về độ tuổi:** Từ 18 tuổi trở lên đối với chủ thẻ chính; từ 15 tuổi đối với chủ thẻ phụ.\n\n**2. Về thu nhập:** Thu nhập tối thiểu 5 triệu đồng/tháng (có xác nhận của đơn vị công tác hoặc sao kê lương).\n\n**3. Về hồ sơ:** CCCD/CMND còn hiệu lực; hợp đồng lao động hoặc giấy tờ xác nhận thu nhập.\n\n**4. Về lịch sử tín dụng:** Không có nợ xấu trong vòng 12 tháng gần nhất.',
    time: '09:35',
    citations: [
      { id: 'c3', docName: 'Quy định phát hành và sử dụng thẻ tín dụng SHB', docCode: 'QC-SHB-TD/2023', clause: 'Điều 5', date: '01/06/2023', status: 'effective' },
    ],
    warning: 'Một số điều khoản trong văn bản này đang trong quá trình sửa đổi. Kết quả có thể thay đổi sau khi cập nhật.',
  },
]

const CONVERSATIONS = [
  { id: '1', title: 'Lãi suất tiết kiệm 2024', time: '09:32', active: true },
  { id: '2', title: 'Điều kiện vay mua nhà', time: 'Hôm qua' },
  { id: '3', title: 'Phí chuyển khoản quốc tế', time: '14/01' },
  { id: '4', title: 'Thủ tục mở tài khoản doanh nghiệp', time: '12/01' },
  { id: '5', title: 'Quy định giao dịch ngoại tệ', time: '10/01' },
]

function CitationCard({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false)
  const statusMap: Record<string, 'effective' | 'superseded' | 'expired'> = {
    effective: 'effective',
    superseded: 'superseded',
    expired: 'expired',
  }
  return (
    <div className="bg-[#F8FAFC] border border-[#DDE1E9] rounded p-2.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium text-gray-800 leading-snug">{citation.docName}</div>
          <div className="text-gray-400 font-mono mt-0.5">{citation.docCode} · {citation.clause}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={statusMap[citation.status]} />
            <span className="text-gray-400 font-mono text-[10px]">Ngày HL: {citation.date}</span>
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-[#C8102E] hover:underline text-[10px] font-medium flex-shrink-0 cursor-pointer"
        >
          Xem nguồn
        </button>
      </div>
      {open && (
        <div className="mt-2 pt-2 border-t border-[#DDE1E9] text-gray-600 leading-relaxed">
          Nội dung trích dẫn từ {citation.clause}: Lãi suất tiết kiệm kỳ hạn 12 tháng áp dụng cho khách hàng cá nhân tại SHB là 5,8%/năm (gửi tại quầy) và 6,0%/năm (gửi qua kênh số)...
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xl">
          <div className="bg-[#1A2B4A] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm">
            {msg.content}
          </div>
          <div className="text-right text-[10px] text-gray-400 font-mono mt-1 pr-1">{msg.time}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-5">
      <div className="w-7 h-7 bg-[#C8102E] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white text-[9px] font-black">AI</span>
      </div>
      <div className="flex-1 min-w-0 max-w-2xl">
        <div className="bg-white border border-[#DDE1E9] rounded-xl rounded-tl-sm px-4 py-3">
          <div
            className="text-sm text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: msg.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br />'),
            }}
          />

          {msg.warning && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-2.5 flex gap-2">
              <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs text-amber-700">{msg.warning}</span>
            </div>
          )}

          {msg.citations && msg.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#DDE1E9]">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Nguồn trích dẫn ({msg.citations.length})
              </div>
              <div className="grid grid-cols-1 gap-2">
                {msg.citations.map(c => <CitationCard key={c.id} citation={c} />)}
              </div>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-[#DDE1E9] flex items-center gap-3">
            <span className="text-[10px] text-gray-400 font-mono flex-1">{msg.time}</span>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 cursor-pointer" title="Sao chép">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-1 hover:bg-green-50 rounded transition-colors text-gray-400 hover:text-green-600 cursor-pointer" title="Hữu ích">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button className="p-1 hover:bg-red-50 rounded transition-colors text-gray-400 hover:text-red-500 cursor-pointer" title="Không hữu ích">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = {
      id: Date.now().toString(), role: 'user',
      content: input.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(), role: 'ai',
      content: 'Cảm ơn câu hỏi của bạn. Dựa trên dữ liệu tài liệu hiện có, tôi sẽ cung cấp thông tin chính xác và đầy đủ nhất. Hiện tôi đang tra cứu các quy định liên quan...',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, aiMsg])
    setLoading(false)
  }

  return (
    <AppLayout role="customer" pageTitle="Chatbot">
      <div className="flex h-[calc(100vh-8.25rem)] gap-0 bg-white rounded-lg border border-[#DDE1E9] overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-[#DDE1E9] flex flex-col">
          <div className="p-3 border-b border-[#DDE1E9]">
            <Btn variant="primary" size="sm" className="w-full justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Cuộc trò chuyện mới
            </Btn>
          </div>
          <div className="p-2 border-b border-[#DDE1E9]">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm hội thoại..."
              className="w-full px-2.5 py-1.5 text-xs border border-[#DDE1E9] rounded focus:outline-none focus:ring-1 focus:ring-[#C8102E]/30"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-2 py-1.5">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">Gần đây</div>
              {CONVERSATIONS.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).map(conv => (
                <div
                  key={conv.id}
                  className={`px-2.5 py-2 rounded cursor-pointer group flex items-start justify-between gap-1 ${
                    conv.active ? 'bg-[#FFF1F3] border border-[#C8102E]/20' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${conv.active ? 'text-[#C8102E]' : 'text-gray-700'}`}>
                      {conv.title}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{conv.time}</div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="px-5 py-3 border-b border-[#DDE1E9] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Lãi suất tiết kiệm 2024</h3>
              <div className="text-xs text-gray-400">4 tin nhắn · Hôm nay 09:35</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {loading && (
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 bg-[#C8102E] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[9px] font-black">AI</span>
                </div>
                <div className="bg-white border border-[#DDE1E9] rounded-xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">AI đang xử lý...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#DDE1E9]">
            <div className="flex gap-2 items-end bg-[#F8FAFC] rounded-lg border border-[#DDE1E9] p-2.5 focus-within:border-[#C8102E] focus-within:ring-2 focus-within:ring-[#C8102E]/20 transition-all">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Nhập câu hỏi của bạn... (Enter để gửi)"
                rows={2}
                className="flex-1 bg-transparent text-sm text-gray-800 resize-none focus:outline-none placeholder:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-2 bg-[#C8102E] text-white rounded-md disabled:opacity-40 hover:bg-[#a50d25] transition-colors cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 mt-1.5 text-center">
              Câu trả lời dựa trên tài liệu chính thức của SHB · Chỉ hiển thị thông tin công khai
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
