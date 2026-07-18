import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Clipboard,
  Copy,
  FileText,
  Network,
  Pause,
  Plus,
  Search,
  Send,
  Trash2,
  Volume2,
} from "lucide-react"
import AppLayout from "../layouts/AppLayout"
import { useAuth } from "../auth/AuthContext"
import type {
  Message,
  SourceGroup,
  TextChunk,
  RAGGraph,
  RAGSourceChunk,
} from "../domain"
import { chatService } from "../services/api"
import { aiService } from "../services/ai"
import { ApiDataState, Btn, EmptyState } from "../components/shared"
import { DemoStateBoundary } from "./SystemPages"
import GraphModal from "../components/GraphModal"
import SourcesPanel from "../components/SourcesPanel"
import MarkdownMessage from "../components/MarkdownMessage"
import { createId } from "../utils/id"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  time: string
  warning?: string
  sourceGroupId?: string
  graph?: RAGGraph | null
  sources?: RAGSourceChunk[]
  conflicts?: Array<{ clause_a: string; clause_b: string }>
}

interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  sources: SourceGroup[]
  updatedAt: string
}

const GUEST_KEY = "shb-rag-guest-chat-v2"

function ragSourcesToGroups(sources: RAGSourceChunk[]): SourceGroup[] {
  const map = new Map<string, TextChunk[]>()
  sources.forEach((s, i) => {
    const key = s.document_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({
      id: s.chunk_id,
      documentId: s.document_id,
      documentName: s.document_id,
      documentCode: "",
      path: "",
      content: s.text,
      snippet: s.text.slice(0, 180),
      status: "EFFECTIVE",
      contentType: s.document_type,
      rank: i,
      score: s.score,
      language: s.language,
      accessScope: "public",
      version: s.version,
      indexedAt: "",
      available: true,
    })
  })
  return Array.from(map.entries()).map(([docId, chunks]) => ({
    id: docId,
    question: "",
    chunks,
  }))
}

function toChatMsg(msg: Message): ChatMessage {
  return { ...msg }
}

function deriveTitle(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 60) || "Cuộc trò chuyện mới"
}

function MessageView({
  message,
  onGraph,
  onSources,
  onSourceClick,
  onToast,
}: {
  message: ChatMessage
  onGraph: () => void
  onSources?: () => void
  onSourceClick?: (chunkId: string) => void
  onToast: (text: string) => void
}) {
  const [speaking, setSpeaking] = useState(false)
  const speak = () => {
    if (!("speechSynthesis" in window)) return onToast("Trình duyệt không hỗ trợ phát nội dung.")
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return }
    const utterance = new SpeechSynthesisUtterance(message.content)
    utterance.lang = "vi-VN"
    utterance.onend = () => setSpeaking(false)
    speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-2xl">
          <div className="bg-[#192B4B] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap">{message.content}</div>
          <div className="text-[10px] text-gray-400 text-right mt-1">{message.time}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-6">
      <div className="w-8 h-8 bg-[#C8102E] rounded-full text-white text-[10px] font-bold grid place-items-center shrink-0">AI</div>
      <div className="max-w-3xl flex-1">
        <div className="bg-white border rounded-xl rounded-tl-sm p-4 text-sm leading-6">
          <MarkdownMessage content={message.content} onSourceClick={onSourceClick} />
          {message.warning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-2 text-xs mt-3">{message.warning}</div>
          )}
          {message.conflicts && message.conflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-2 text-xs mt-3">
              Mâu thuẫn: {message.conflicts.map((c) => `${c.clause_a} ↔ ${c.clause_b}`).join(", ")}
            </div>
          )}
          <div className="border-t mt-3 pt-2 flex items-center gap-1">
            <span className="text-[10px] text-gray-400 mr-auto">{message.time}</span>
            <button onClick={speak} title="Phát nội dung" className="p-1.5 rounded hover:bg-gray-100">
              {speaking ? <Pause size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              onClick={async () => { await navigator.clipboard.writeText(message.content); onToast("Đã sao chép") }}
              title="Sao chép"
              className="p-1.5 rounded hover:bg-gray-100"
            >
              <Copy size={15} />
            </button>
            {message.graph && message.graph.nodes.length > 0 && (
              <button onClick={onGraph} title="Xem đồ thị" className="p-1.5 rounded hover:bg-gray-100">
                <Network size={15} />
              </button>
            )}
            {onSources && message.sources && message.sources.length > 0 && (
              <button onClick={onSources} className="text-[10px] text-[#C8102E] hover:underline ml-1">
                Sources ({message.sources.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function loadGuestConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    if (!raw) return []
    const items = JSON.parse(raw) as Array<{ id: string; title: string; messages: ChatMessage[]; updatedAt: string }>
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      messages: item.messages,
      sources: [],
      updatedAt: item.updatedAt,
    }))
  } catch { return [] }
}

function saveGuestConversations(items: ChatConversation[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items.map((item) => ({
    id: item.id, title: item.title, messages: item.messages, updatedAt: item.updatedAt,
  }))))
}

export type ChatMode = "server" | "rag"

export default function ChatPage({ mode }: { mode?: ChatMode }) {
  const { user } = useAuth()
  const resolvedMode: ChatMode = mode || (user?.role === "customer" || user?.role === "staff" ? "server" : "rag")
  const role = user?.role === "staff" ? "staff" : "customer"

  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentId, setCurrentId] = useState("")
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<TextChunk | null>(null)
  const [activeSourceGroups, setActiveSourceGroups] = useState<SourceGroup[]>([])
  const [graphOpen, setGraphOpen] = useState(false)
  const [toast, setToast] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      if (resolvedMode === "server") {
        const items = await chatService.list(role)
        setConversations(items.map((c) => ({
          id: c.id, title: c.title, messages: c.messages.map(toChatMsg),
          sources: c.sources, updatedAt: c.updatedAt,
        })))
      } else {
        setConversations(loadGuestConversations())
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không thể tải hội thoại.")
    } finally { setLoading(false) }
  }, [resolvedMode, role])

  useEffect(() => { void load() }, [load])

  const current = useMemo(() => conversations.find((c) => c.id === currentId), [conversations, currentId])

  const persistGuest = (items: ChatConversation[]) => {
    setConversations(items)
    saveGuestConversations(items)
  }

  const create = async () => {
    if (resolvedMode === "server") {
      const next = await chatService.create(role)
      const mapped: ChatConversation = { id: next.id, title: next.title, messages: next.messages.map(toChatMsg), sources: next.sources, updatedAt: next.updatedAt }
      setConversations((prev) => [mapped, ...prev])
      setCurrentId(mapped.id)
    } else {
      const id = createId()
      const item: ChatConversation = { id, title: "Cuộc trò chuyện mới", messages: [], sources: [], updatedAt: new Date().toISOString() }
      persistGuest([item, ...conversations])
      setCurrentId(id)
    }
  }

  const remove = async (id: string) => {
    if (resolvedMode === "server") {
      await chatService.remove(id)
    }
    const next = conversations.filter((c) => c.id !== id)
    resolvedMode === "server" ? setConversations(next) : persistGuest(next)
    setCurrentId(next[0]?.id || "")
  }

  const rename = async (item: ChatConversation) => {
    const title = prompt("Tên mới cho hội thoại", item.title)?.trim()
    if (!title) return
    if (resolvedMode === "server") {
      await chatService.rename(item.id, title, "public")
    }
    const update = (items: ChatConversation[]) => items.map((c) => c.id === item.id ? { ...c, title } : c)
    resolvedMode === "server" ? setConversations(update) : persistGuest(update(conversations))
  }

  const send = async () => {
    if (!input.trim() || !current) return
    const question = input.trim()
    setInput("")
    setLoading(true)

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`, role: "user", content: question, time: new Date().toLocaleString("vi-VN"),
    }
    const withUser = { ...current, messages: [...current.messages, userMsg], updatedAt: new Date().toISOString() }
    resolvedMode === "server"
      ? setConversations((prev) => prev.map((c) => c.id === current.id ? withUser : c))
      : persistGuest(conversations.map((c) => c.id === current.id ? withUser : c))

    try {
      if (resolvedMode === "server") {
        const updated = await chatService.send(current.id, question)
        const mapped: ChatConversation = { id: updated.id, title: updated.title, messages: updated.messages.map(toChatMsg), sources: updated.sources, updatedAt: updated.updatedAt }
        setConversations((prev) => prev.map((c) => c.id === mapped.id ? mapped : c))
      } else {
        const result = await aiService.rag(question)
        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`, role: "ai", content: result.answer,
          time: new Date().toLocaleString("vi-VN"), graph: result.graph,
          sources: result.sources, conflicts: result.conflicts,
        }
        persistGuest(conversations.map((c) => c.id === current.id ? { ...c, title: c.messages.length === 0 ? deriveTitle(question) : c.title, messages: [...c.messages, userMsg, aiMsg], updatedAt: new Date().toISOString() } : c))
      }
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 20)
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không gửi được câu hỏi.")
      setTimeout(() => setToast(""), 3000)
    } finally { setLoading(false) }
  }

  const sourceCount = resolvedMode === "server"
    ? current?.sources.reduce((sum, g) => sum + g.chunks.length, 0) || 0
    : current?.messages.filter((m) => m.role === "ai").pop()?.sources?.length || 0

  const pageTitle = resolvedMode === "server"
    ? (role === "customer" ? "Chat với AI" : "Chat nội bộ với AI")
    : "Chat với AI"

  if (loadError || (loading && conversations.length === 0)) {
    return (
      <AppLayout pageTitle={pageTitle}>
        <ApiDataState loading={loading} error={loadError} onRetry={() => void load()}><div /></ApiDataState>
      </AppLayout>
    )
  }

  return (
    <DemoStateBoundary title={pageTitle}>
      <AppLayout
        pageTitle={pageTitle}
        headerActions={
          <Btn variant={sourcesOpen ? "primary" : "outline"} size="sm" onClick={() => setSourcesOpen((v) => !v)}>
            <FileText size={14} /> Sources <span className="rounded-full bg-black/10 px-1.5">{sourceCount}</span>
          </Btn>
        }
      >
        <div className="h-[calc(100vh-7.5rem)] bg-white border rounded-lg flex overflow-hidden">
          <aside className="w-64 border-r flex flex-col">
            <div className="p-3 border-b">
              <Btn className="w-full justify-center" onClick={() => void create()}>
                <Plus size={14} /> Cuộc trò chuyện mới
              </Btn>
            </div>
            <div className="p-2 border-b relative">
              <Search size={14} className="absolute left-4 top-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm hội thoại..."
                className="w-full border rounded pl-8 pr-2 py-2 text-xs"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {conversations
                .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
                .map((item) => (
                  <div key={item.id} className={`group rounded p-2 mb-1 flex gap-1 ${item.id === currentId ? "bg-red-50 text-[#C8102E]" : "hover:bg-gray-50"}`}>
                    <button onClick={() => setCurrentId(item.id)} className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-medium truncate">{item.title}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{item.updatedAt}</div>
                    </button>
                    <button onClick={() => void rename(item)} title="Đổi tên" className="opacity-0 group-hover:opacity-100"><Clipboard size={13} /></button>
                    <button onClick={() => void remove(item.id)} title="Xóa" className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={13} /></button>
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
                    {current.messages.length} tin nhắn · {resolvedMode === "server" ? (role === "customer" ? "Dữ liệu công khai" : "Dữ liệu nội bộ") : "Dữ liệu công khai"}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  {current.messages.map((msg) => (
                    <MessageView
                      key={msg.id}
                      message={msg}
                      onGraph={() => setGraphOpen(true)}
                      onSources={msg.sources && msg.sources.length > 0 ? () => {
                        const groups = ragSourcesToGroups(msg.sources!)
                        setActiveSourceGroups(groups)
                        setSourcesOpen(true)
                        setSelectedChunk(null)
                      } : undefined}
                      onSourceClick={(chunkId) => {
                        const match = msg.sources?.find((s) => s.chunk_id === chunkId)
                        if (match) {
                          const mapped: TextChunk = {
                            id: match.chunk_id, documentId: match.document_id, documentName: match.document_id,
                            documentCode: "", path: "", content: match.text, snippet: match.text.slice(0, 180),
                            status: "EFFECTIVE", contentType: match.document_type, rank: 0, score: match.score,
                            language: match.language, accessScope: "public", version: match.version,
                            indexedAt: "", available: true,
                          }
                          setSelectedChunk(mapped)
                          setActiveSourceGroups(ragSourcesToGroups(msg.sources!))
                          setSourcesOpen(true)
                        } else if (resolvedMode === "server") {
                          setSourcesOpen(true)
                        }
                      }}
                      onToast={(text) => { setToast(text); setTimeout(() => setToast(""), 1800) }}
                    />
                  ))}
                  {loading && (
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-bounce" /> Lumina đang suy nghĩ...
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
                <div className="p-4 border-t bg-white">
                  <div className="border rounded-lg p-2 flex items-end focus-within:ring-2 ring-red-100">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send() } }}
                      rows={2}
                      maxLength={2000}
                      placeholder="Nhập câu hỏi... Enter để gửi, Shift+Enter để xuống dòng"
                      className="flex-1 resize-none outline-none text-sm p-1"
                    />
                    <button disabled={!input.trim() || loading} onClick={() => void send()} className="p-2 bg-[#C8102E] text-white rounded disabled:opacity-40">
                      <Send size={17} />
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 text-right">{input.length}/2000</div>
                </div>
              </>
            ) : (
              <div className="m-auto">
                <EmptyState title="Chưa có cuộc trò chuyện" description="Tạo cuộc trò chuyện mới để bắt đầu." />
              </div>
            )}
          </section>

          {sourcesOpen && (
            <SourcesPanel
              groups={resolvedMode === "server" ? (current?.sources || []) : activeSourceGroups}
              selected={selectedChunk}
              onSelect={setSelectedChunk}
              onClose={() => { setSourcesOpen(false); setSelectedChunk(null) }}
            />
          )}
        </div>

        {toast && (
          <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-xs px-4 py-3 rounded shadow-xl z-50">{toast}</div>
        )}

        <GraphModal
          open={graphOpen}
          onClose={() => setGraphOpen(false)}
          graphData={
            resolvedMode === "server"
              ? current?.messages.filter((m) => m.role === "ai").pop()?.graph
              : current?.messages.filter((m) => m.role === "ai").pop()?.graph
          }
        />
      </AppLayout>
    </DemoStateBoundary>
  )
}
