import { useEffect, useRef, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  FileText,
  Maximize2,
  Network,
  Pause,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import AppLayout from "../../layouts/AppLayout"
import { useAuth } from "../../auth/AuthContext"
import type {
  Conversation,
  GraphNode,
  Message,
  SourceGroup,
  TextChunk,
} from "../../domain"
import { chatService } from "../../services/api"
import { ApiDataState, Badge, Btn, EmptyState, Modal } from "../../components/shared"
import { DataStateBoundary } from "../SystemPages"

const graphNodes: GraphNode[] = [
  {
    id: "chunk",
    label: "Chunk nguồn #1",
    type: "chunk",
    x: 300,
    y: 170,
    primary: true,
    detail: "Đoạn văn được truy xuất trực tiếp cho câu trả lời.",
  },
  {
    id: "clause",
    label: "Điều 5 · Khoản 2",
    type: "clause",
    x: 100,
    y: 70,
    detail: "Điều khoản quy định mức lãi suất.",
  },
  {
    id: "document",
    label: "QĐ-01/2024",
    type: "document",
    x: 500,
    y: 70,
    detail: "Quyết định biểu lãi suất huy động vốn.",
  },
  {
    id: "related",
    label: "TB-001/2024",
    type: "related",
    x: 500,
    y: 280,
    detail: "Thông báo điều chỉnh có liên quan.",
  },
]

function SafeAnswer({ text }: { text: string }) {
  return (
    <>
      {text.split("\r\n").map((line, index) => (
        <p key={`${line}-${index}`} className="mb-2 last:mb-0">
          {line}
        </p>
      ))}
    </>
  )
}

function GraphModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState(graphNodes[0])
  const [zoom, setZoom] = useState(1)
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const nodes = graphNodes.filter(
    (node) =>
      (type === "all" || node.type === type) &&
      node.label.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Retrieval Knowledge Graph"
      size="lg"
    >
      <div className="-m-5 h-[68vh] flex bg-[#F8FAFC]">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-12 border-b bg-white px-3 flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2 top-2 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm node..."
                className="border rounded pl-7 pr-2 py-1.5 text-xs"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border rounded px-2 py-1.5 text-xs"
            >
              <option value="all">Tất cả node</option>
              <option value="chunk">Text Chunk</option>
              <option value="clause">Điều khoản</option>
              <option value="document">Văn bản</option>
              <option value="related">Liên quan</option>
            </select>
            <div className="ml-auto flex">
              <button
                onClick={() => setZoom((v) => Math.min(1.5, v + 0.1))}
                className="p-2"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoom((v) => Math.max(0.6, v - 0.1))}
                className="p-2"
              >
                <ZoomOut size={16} />
              </button>
              <button onClick={() => setZoom(1)} className="p-2">
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => document.documentElement.requestFullscreen?.()}
                className="p-2"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <svg
              viewBox="0 0 650 380"
              className="w-full h-full"
              style={{ transform: `scale(${zoom})` }}
            >
              <defs>
                <marker
                  id="arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L7,3 z" fill="#94a3b8" />
                </marker>
              </defs>
              <g stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)">
                <line x1="150" y1="95" x2="300" y2="170" />
                <line x1="350" y1="170" x2="500" y2="95" />
                <line x1="350" y1="190" x2="500" y2="280" />
              </g>
              {nodes.map((node) => (
                <g
                  key={node.id}
                  onClick={() => setSelected(node)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.primary ? 39 : 34}
                    fill={
                      node.primary
                        ? "#C8102E"
                        : node.type === "document"
                          ? "#192B4B"
                          : node.type === "clause"
                            ? "#2563eb"
                            : "#7c3aed"
                    }
                    stroke={selected.id === node.id ? "#fbbf24" : "white"}
                    strokeWidth="4"
                  />
                  <text
                    x={node.x}
                    y={node.y + 55}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#334155"
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
            <div className="absolute left-3 bottom-3 bg-white/90 border rounded p-2 text-[10px] text-gray-500">
              Quan hệ: CONTAINS · BELONGS_TO · RELATED_TO
            </div>
          </div>
        </div>
        <aside className="w-72 border-l bg-white p-4 overflow-y-auto">
          <div className="text-[10px] uppercase text-gray-400 font-semibold">
            Node Details
          </div>
          <div className="mt-4 w-12 h-12 rounded-full bg-[#C8102E] text-white grid place-items-center">
            <Network size={20} />
          </div>
          <h3 className="font-semibold mt-3">{selected.label}</h3>
          <Badge
            variant={selected.type === "document" ? "info" : "effective"}
            label={selected.type}
          />
          <p className="text-xs text-gray-600 mt-4 leading-relaxed">
            {selected.detail}
          </p>
          <dl className="mt-4 text-xs space-y-2">
            <div>
              <dt className="text-gray-400">Node ID</dt>
              <dd className="font-mono">{selected.id}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Quan hệ</dt>
              <dd>2 kết nối trực tiếp</dd>
            </div>
          </dl>
        </aside>
      </div>
    </Modal>
  )
}

function SourcesPanel({
  groups,
  selected,
  onSelect,
  onClose,
}: {
  groups: SourceGroup[]
  selected: TextChunk | null
  onSelect: (chunk: TextChunk | null) => void
  onClose: () => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  if (selected)
    return (
      <aside className="w-[560px] border-l bg-white flex min-h-0">
        <div className="w-56 border-r overflow-y-auto p-3">
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-[#C8102E] mb-3"
          >
            ← Danh sách chunks
          </button>
          {groups
            .flatMap((group) => group.chunks)
            .map((chunk) => (
              <button
                key={chunk.id}
                onClick={() => onSelect(chunk)}
                className={`w-full text-left border rounded p-2 mb-2 ${
                  selected.id === chunk.id ? "border-[#C8102E] bg-red-50" : ""
                }`}
              >
                <div className="text-[10px] font-mono text-gray-400">
                  #{chunk.rank} · {Math.round(chunk.score * 100)}%
                </div>
                <div className="text-xs font-medium line-clamp-2 mt-1">
                  {chunk.documentName}
                </div>
              </button>
            ))}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="p-4 border-b flex justify-between">
            <div>
              <div className="text-[10px] text-gray-400 uppercase">
                Chi tiết text chunk
              </div>
              <h3 className="font-semibold text-sm mt-1">
                {selected.documentName}
              </h3>
            </div>
            <button onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 bg-[#F8FAFC] border-b grid grid-cols-2 gap-3 text-xs">
              {[
                ["Số hiệu", selected.documentCode],
                ["Đường dẫn", selected.path],
                ["Phiên bản", selected.version],
                ["Loại", selected.contentType],
                ["Ngôn ngữ", selected.language],
                ["Điểm liên quan", `${Math.round(selected.score * 100)}%`],
                ["Phạm vi", selected.accessScope],
                ["Index lúc", selected.indexedAt],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-gray-400">{label}</div>
                  <div className="font-medium mt-0.5">{value}</div>
                </div>
              ))}
            </div>
            <div className="p-4">
              <h4 className="text-xs font-semibold mb-2">Nội dung đầy đủ</h4>
              {selected.available === false ? (
                <div className="text-xs bg-amber-50 border border-amber-200 rounded p-3">
                  Chunk không còn khả dụng.
                </div>
              ) : selected.accessScope === "internal" && false ? (
                <div>Không có quyền</div>
              ) : (
                <p className="text-sm leading-7 text-gray-700">
                  {selected.content}
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>
    )
  return (
    <aside className="w-96 border-l bg-white flex flex-col min-h-0">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Sources</h3>
          <div className="text-[10px] text-gray-400">
            {groups.reduce((sum, group) => sum + group.chunks.length, 0)} text
            chunks
          </div>
        </div>
        <button onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {groups.length === 0 ? (
          <EmptyState
            title="Chưa có Sources"
            description="Gửi câu hỏi để hệ thống truy xuất nguồn."
          />
        ) : (
          groups.map((group) => (
            <section key={group.id} className="mb-3 border rounded">
              <button
                onClick={() => toggle(group.id)}
                title={group.question}
                className="w-full p-3 flex gap-2 text-left bg-gray-50"
              >
                {collapsed.has(group.id) ? (
                  <ChevronRight size={15} />
                ) : (
                  <ChevronDown size={15} />
                )}
                <span className="text-xs font-semibold line-clamp-2">
                  Results for “{group.question}”
                </span>
              </button>
              {!collapsed.has(group.id) && (
                <div className="p-2">
                  {group.chunks.map((chunk) => (
                    <button
                      key={chunk.id}
                      onClick={() => onSelect(chunk)}
                      className="w-full text-left border rounded p-3 mb-2 hover:border-[#C8102E]"
                    >
                      <div className="flex justify-between">
                        <span className="text-[10px] font-mono text-[#C8102E]">
                          Kết quả #{chunk.rank}
                        </span>
                        <Badge variant="effective" />
                      </div>
                      <div className="text-xs font-semibold mt-2">
                        {chunk.documentName}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-1">
                        {chunk.documentCode} · {chunk.path}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3 mt-2">
                        {chunk.snippet}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </aside>
  )
}

function MessageView({
  message,
  onGraph,
  onToast,
}: {
  message: Message
  onGraph: () => void
  onToast: (text: string) => void
}) {
  const [speaking, setSpeaking] = useState(false)
  const speak = () => {
    if (!("speechSynthesis" in window))
      return onToast("Trình duyệt không hỗ trợ phát nội dung.")
    if (speaking) {
      speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(message.content)
    utterance.lang = "vi-VN"
    utterance.onend = () => setSpeaking(false)
    speechSynthesis.speak(utterance)
    setSpeaking(true)
  }
  if (message.role === "user")
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-2xl">
          <div className="bg-[#192B4B] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm">
            {message.content}
          </div>
          <div className="text-[10px] text-gray-400 text-right mt-1">
            {message.time}
          </div>
        </div>
      </div>
    )
  return (
    <div className="flex gap-3 mb-6">
      <div className="w-8 h-8 bg-[#C8102E] rounded-full text-white text-[10px] font-bold grid place-items-center">
        AI
      </div>
      <div className="max-w-3xl flex-1">
        <div className="bg-white border rounded-xl rounded-tl-sm p-4 text-sm leading-6">
          <SafeAnswer text={message.content} />
          {message.warning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-2 text-xs mt-3">
              {message.warning}
            </div>
          )}
          <div className="border-t mt-3 pt-2 flex items-center gap-1">
            <span className="text-[10px] text-gray-400 mr-auto">
              {message.time}
            </span>
            <button
              onClick={speak}
              title="Phát nội dung"
              className="p-1.5 rounded hover:bg-gray-100"
            >
              {speaking ? <Pause size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(message.content)
                onToast("Đã sao chép câu trả lời")
              }}
              title="Sao chép"
              className="p-1.5 rounded hover:bg-gray-100"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={onGraph}
              title="Xem đồ thị"
              className="p-1.5 rounded hover:bg-gray-100"
            >
              <Network size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatbotPage() {
  const { user } = useAuth()
  const role = user?.role === "ROLE_STAFF" ? "ROLE_STAFF" : "ROLE_CUSTOMER"
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentId, setCurrentId] = useState("")
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<TextChunk | null>(null)
  const [graphOpen, setGraphOpen] = useState(false)
  const [toast, setToast] = useState("")
  const end = useRef<HTMLDivElement>(null)
  const load = async () => { setLoading(true); setLoadError(""); try { const items = await chatService.list(role); setConversations(items); setCurrentId(items[0]?.id || "") } catch (value) { setLoadError(value instanceof Error ? value.message : "API hội thoại không phản hồi.") } finally { setLoading(false) } }
  useEffect(() => { void load() }, [role])
  const current = conversations.find((item) => item.id === currentId)
  const create = async () => {
    const next = await chatService.create(role)
    setConversations((items) => [next, ...items])
    setCurrentId(next.id)
  }
  const remove = async (id: string) => {
    await chatService.remove(id)
    const next = conversations.filter((item) => item.id !== id)
    setConversations(next)
    setCurrentId(next[0]?.id || "")
  }
  const rename = async (item: Conversation) => {
    const title = prompt("Tên mới cho hội thoại", item.title)?.trim()
    if (!title) return
    await chatService.rename(item.id, title, item.scope)
    setConversations((values) =>
      values.map((value) =>
        value.id === item.id ? { ...value, title } : value,
      ),
    )
  }
  const send = async () => {
    if (!input.trim() || !current) return
    const question = input.trim()
    setInput("")
    setLoading(true)
    try {
      const updated = await chatService.send(current.id, question)
      setConversations((values) =>
        values.map((item) => (item.id === updated.id ? updated : item)),
      )
      setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 20)
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Không gửi được câu hỏi.",
      )
      setTimeout(() => setToast(""), 3000)
    } finally {
      setLoading(false)
    }
  }
  const sourceCount =
    current?.sources.reduce((sum, group) => sum + group.chunks.length, 0) || 0
  if (loadError || (loading && conversations.length === 0)) return <AppLayout pageTitle={role === "ROLE_CUSTOMER" ? "Chat với AI" : "Chat nội bộ với AI"}><ApiDataState loading={loading} error={loadError} onRetry={() => void load()}><div /></ApiDataState></AppLayout>
  const headerAction = (
    <Btn
      variant={sourcesOpen ? "primary" : "outline"}
      size="sm"
      onClick={() => setSourcesOpen((v) => !v)}
    >
      <FileText size={14} /> Sources{" "}
      <span className="rounded-full bg-black/10 px-1.5">{sourceCount}</span>
    </Btn>
  )
  return (
    <DataStateBoundary title="Chat với AI">
      <AppLayout
        pageTitle={role === "ROLE_CUSTOMER" ? "Chat với AI" : "Chat nội bộ với AI"}
        headerActions={headerAction}
      >
        <div className="h-[calc(100vh-7.5rem)] bg-white border rounded-lg flex overflow-hidden">
          <aside className="w-64 border-r flex flex-col">
            <div className="p-3 border-b">
              <Btn
                className="w-full justify-center"
                onClick={() => void create()}
              >
                <Plus size={14} /> Cuộc trò chuyện mới
              </Btn>
            </div>
            <div className="p-2 border-b relative">
              <Search
                size={14}
                className="absolute left-4 top-4 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm hội thoại..."
                className="w-full border rounded pl-8 pr-2 py-2 text-xs"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {conversations
                .filter((item) =>
                  item.title.toLowerCase().includes(search.toLowerCase()),
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className={`group rounded p-2 mb-1 flex gap-1 ${
                      item.id === currentId
                        ? "bg-red-50 text-[#C8102E]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => setCurrentId(item.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="text-xs font-medium truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {item.updatedAt}
                      </div>
                    </button>
                    <button
                      onClick={() => void rename(item)}
                      title="Đổi tên"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Clipboard size={13} />
                    </button>
                    <button
                      onClick={() => void remove(item.id)}
                      title="Xóa"
                      className="opacity-0 group-hover:opacity-100 text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
            </div>
          </aside>
          <section className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
            {current ? (
              <>
                <div className="p-4 border-b bg-white">
                  <h2 className="font-semibold text-sm">{current.title}</h2>
                  <div className="text-[10px] text-gray-400">
                    {current.messages.length} tin nhắn ·{" "}
                    {role === "ROLE_CUSTOMER"
                      ? "Dữ liệu công khai"
                      : "Dữ liệu nội bộ theo quyền"}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  {current.messages.map((message) => (
                    <MessageView
                      key={message.id}
                      message={message}
                      onGraph={() => setGraphOpen(true)}
                      onToast={(text) => {
                        setToast(text)
                        setTimeout(() => setToast(""), 1800)
                      }}
                    />
                  ))}
                  {loading && (
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-bounce" />{" "}
                      AI đang trả lời...
                    </div>
                  )}
                  <div ref={end} />
                </div>
                <div className="p-4 border-t bg-white">
                  <div className="border rounded-lg p-2 flex items-end focus-within:ring-2 ring-red-100">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          void send()
                        }
                      }}
                      rows={2}
                      maxLength={2000}
                      placeholder="Nhập câu hỏi... Enter để gửi, Shift+Enter để xuống dòng"
                      className="flex-1 resize-none outline-none text-sm p-1"
                    />
                    <button
                      disabled={!input.trim() || loading}
                      onClick={() => void send()}
                      className="p-2 bg-[#C8102E] text-white rounded disabled:opacity-40"
                    >
                      <Send size={17} />
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 text-right">
                    {input.length}/2000
                  </div>
                </div>
              </>
            ) : (
              <div className="m-auto">
                <EmptyState
                  title="Chưa có cuộc trò chuyện"
                  description="Tạo cuộc trò chuyện mới để bắt đầu."
                />
              </div>
            )}
          </section>
          {sourcesOpen && (
            <SourcesPanel
              groups={current?.sources || []}
              selected={selectedChunk}
              onSelect={setSelectedChunk}
              onClose={() => {
                setSourcesOpen(false)
                setSelectedChunk(null)
              }}
            />
          )}
        </div>
        {toast && (
          <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-xs px-4 py-3 rounded shadow-xl z-50">
            {toast}
          </div>
        )}
        <GraphModal open={graphOpen} onClose={() => setGraphOpen(false)} />
      </AppLayout>
    </DataStateBoundary>
  )
}
