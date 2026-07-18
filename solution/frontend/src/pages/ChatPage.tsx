import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Copy,
  FileText,
  Network,
  Pause,
  Send,
  Sparkles,
  Volume2,
} from "lucide-react"
import AppLayout from "../layouts/AppLayout"
import { useAuth } from "../auth/AuthContext"
import type { Message, SourceGroup, TextChunk, RAGGraph, RAGSourceChunk } from "../domain"
import { chatService } from "../services/api"
import { aiService } from "../services/ai"
import { ApiDataState } from "../components/shared"
import { DataStateBoundary } from "./SystemPages"
import GraphModal from "../components/GraphModal"
import SourcesPanel from "../components/SourcesPanel"
import MarkdownMessage from "../components/MarkdownMessage"
import { createId } from "../utils/id"

interface ChatMessage {
  id: string; role: "user" | "ai"; content: string; time: string; warning?: string
  sourceGroupId?: string; graph?: RAGGraph | null; sources?: RAGSourceChunk[]
  conflicts?: Array<{ clause_a: string; clause_b: string }>
}
interface ChatConversation {
  id: string; title: string; messages: ChatMessage[]; sources: SourceGroup[]; updatedAt: string
}
const GUEST_KEY = "shb-rag-guest-chat-v2"

function ragSourcesToGroups(sources: RAGSourceChunk[]): SourceGroup[] {
  const map = new Map<string, TextChunk[]>()
  sources.forEach((s, i) => {
    const key = s.document_id; if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({
      id: s.chunk_id, documentId: s.document_id, documentName: s.document_id, documentCode: "", path: "",
      content: s.text, snippet: s.text.slice(0, 180), status: "EFFECTIVE", contentType: s.document_type,
      rank: i, score: s.score, language: s.language, accessScope: "public", version: s.version, indexedAt: "", available: true,
    })
  })
  return Array.from(map.entries()).map(([docId, chunks]) => ({ id: docId, question: "", chunks }))
}

function toChatMsg(msg: Message): ChatMessage { return { ...msg } }
function deriveTitle(text: string): string { return text.replace(/\s+/g, " ").trim().slice(0, 60) || "Cuộc trò chuyện mới" }

/* ────────────────── MessageView ────────────────── */
function MessageView({ message, onGraph, onSources, onSourceClick, onToast }: {
  message: ChatMessage; onGraph: () => void; onSources?: () => void
  onSourceClick?: (chunkId: string) => void; onToast: (text: string) => void
}) {
  const [speaking, setSpeaking] = useState(false)
  const speak = () => {
    if (!("speechSynthesis" in window)) return onToast("Trình duyệt không hỗ trợ.")
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return }
    const u = new SpeechSynthesisUtterance(message.content); u.lang = "vi-VN"
    u.onend = () => setSpeaking(false); speechSynthesis.speak(u); setSpeaking(true)
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-5">
        <div className="chat-user-bubble">{message.content}</div>
      </div>
    )
  }

  return (
    <div className="flex gap-3.5 mb-8 group/ai">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C8102E] to-[#8b0c20] flex items-center justify-center shrink-0 mt-1 shadow-sm">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="flex-1 min-w-0 max-w-[42rem]">
        <MarkdownMessage content={message.content} onSourceClick={onSourceClick} />
        {message.warning && <div className="mt-3 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-800">{message.warning}</div>}
        {message.conflicts && message.conflicts.length > 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-800">
            Mâu thuẫn: {message.conflicts.map((c) => `${c.clause_a} ↔ ${c.clause_b}`).join(", ")}
          </div>
        )}
        <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover/ai:opacity-100 transition-opacity">
          <span className="text-[10px] text-[#b0a899] mr-auto">{message.time}</span>
          <button onClick={speak} title="Phát" className="chat-action-btn">{speaking ? <Pause size={13} /> : <Volume2 size={13} />}</button>
          <button onClick={async () => { await navigator.clipboard.writeText(message.content); onToast("Đã sao chép") }} className="chat-action-btn" title="Sao chép"><Copy size={13} /></button>
          {message.graph && message.graph.nodes.length > 0 && <button onClick={onGraph} className="chat-action-btn"><Network size={13} /></button>}
          {onSources && message.sources && message.sources.length > 0 && (
            <button onClick={onSources} className="chat-action-btn flex items-center gap-1 text-[11px]"><FileText size={12} /> {message.sources.length}</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ────────────────── Helpers ────────────────── */
function loadGuestConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY); if (!raw) return []
    return (JSON.parse(raw) as Array<{ id: string; title: string; messages: ChatMessage[]; updatedAt: string }>)
      .map((i) => ({ id: i.id, title: i.title, messages: i.messages, sources: [], updatedAt: i.updatedAt }))
  } catch { return [] }
}
function saveGuestConversations(items: ChatConversation[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items.map((i) => ({ id: i.id, title: i.title, messages: i.messages, updatedAt: i.updatedAt }))))
}

export type ChatMode = "server" | "rag"

/* ══════════════════════ Main Page ══════════════════════ */
export default function ChatPage({ mode }: { mode?: ChatMode }) {
  const { user } = useAuth()
  const resolvedMode: ChatMode = mode || (user?.role === "ROLE_CUSTOMER" || user?.role === "ROLE_STAFF" ? "server" : "rag")
  const role = user?.role === "ROLE_STAFF" ? "ROLE_STAFF" : "ROLE_CUSTOMER"

  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentId, setCurrentId] = useState("")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<TextChunk | null>(null)
  const [activeSourceGroups, setActiveSourceGroups] = useState<SourceGroup[]>([])
  const [graphOpen, setGraphOpen] = useState(false)
  const [toast, setToast] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true); setLoadError("")
    try {
      if (resolvedMode === "server") {
        const items = await chatService.list(role)
        setConversations(items.map((c) => ({ id: c.id, title: c.title, messages: c.messages.map(toChatMsg), sources: c.sources, updatedAt: c.updatedAt })))
      } else { setConversations(loadGuestConversations()) }
    } catch (e) { setLoadError(e instanceof Error ? e.message : "Không thể tải.") }
    finally { setLoading(false) }
  }, [resolvedMode, role])

  useEffect(() => { void load() }, [load])

  const current = useMemo(() => conversations.find((c) => c.id === currentId), [conversations, currentId])
  const persistGuest = (items: ChatConversation[]) => { setConversations(items); saveGuestConversations(items) }

  const send = async () => {
    if (!input.trim()) return
    let active = current
    if (!active) {
      if (resolvedMode === "server") {
        const next = await chatService.create(role)
        const mapped: ChatConversation = { id: next.id, title: next.title, messages: next.messages.map(toChatMsg), sources: next.sources, updatedAt: next.updatedAt }
        setConversations((p) => [mapped, ...p]); setCurrentId(mapped.id)
        active = mapped
      } else {
        const cid = createId()
        const item: ChatConversation = { id: cid, title: "Cuộc trò chuyện mới", messages: [], sources: [], updatedAt: new Date().toISOString() }
        persistGuest([item, ...conversations]); setCurrentId(cid)
        active = item
      }
    }
    const question = input.trim(); setInput(""); setLoading(true)
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: question, time: new Date().toLocaleString("vi-VN") }
    const withUser = { ...active, messages: [...active.messages, userMsg], updatedAt: new Date().toISOString() }
    resolvedMode === "server"
      ? setConversations((p) => p.map((c) => c.id === active!.id ? withUser : c))
      : persistGuest(conversations.map((c) => c.id === active!.id ? withUser : c))
    try {
      if (resolvedMode === "server") {
        const updated = await chatService.send(active.id, question)
        const mapped: ChatConversation = { id: updated.id, title: updated.title, messages: updated.messages.map(toChatMsg), sources: updated.sources, updatedAt: updated.updatedAt }
        setConversations((p) => p.map((c) => c.id === mapped.id ? mapped : c))
      } else {
        const result = await aiService.rag(question)
        const aiMsg: ChatMessage = { id: `a-${Date.now()}`, role: "ai", content: result.answer, time: new Date().toLocaleString("vi-VN"), graph: result.graph, sources: result.sources, conflicts: result.conflicts }
        persistGuest(conversations.map((c) => c.id === active!.id ? { ...c, title: c.messages.length === 0 ? deriveTitle(question) : c.title, messages: [...c.messages, userMsg, aiMsg], updatedAt: new Date().toISOString() } : c))
      }
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 20)
    } catch (e) { setToast(e instanceof Error ? e.message : "Không gửi được."); setTimeout(() => setToast(""), 3000) }
    finally { setLoading(false) }
  }

  const sourceCount = resolvedMode === "server"
    ? current?.sources.reduce((sum, g) => sum + g.chunks.length, 0) || 0
    : current?.messages.filter((m) => m.role === "ai").pop()?.sources?.length || 0

  const pageTitle = resolvedMode === "server" ? (role === "ROLE_CUSTOMER" ? "Chat với AI" : "Chat nội bộ") : "Chat với AI"

  if (loadError || (loading && conversations.length === 0)) {
    return <AppLayout pageTitle={pageTitle}><ApiDataState loading={loading} error={loadError} onRetry={() => void load()}><div /></ApiDataState></AppLayout>
  }

  const isEmpty = !current || current.messages.length === 0

  return (
    <DataStateBoundary title={pageTitle}>
      <AppLayout pageTitle={pageTitle}>
        <div className="h-[calc(100vh-7.5rem)] bg-[#f9f7f4] rounded-2xl flex overflow-hidden border border-[#e0d8cb]">
          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
          {isEmpty ? (
            /* ─── Empty hero ─── */
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="mb-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C8102E] to-[#8b0c20] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#C8102E]/20">
                  <Sparkles size={30} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#1f1b17] tracking-tight mb-2">Lumina</h2>
                <p className="text-[15px] text-[#9a9186]">Chat với AI • {resolvedMode === "server" ? (role === "ROLE_CUSTOMER" ? "Công khai" : "Nội bộ") : "Công khai"}</p>
              </div>
              <div className="w-full max-w-[36rem]">
                <div className="chat-composer">
                  <div className="flex items-end p-2.5">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send() } }}
                      rows={2} maxLength={2000} placeholder="Nhập câu hỏi..."
                      className="flex-1 resize-none outline-none text-[15px] px-3 py-2 bg-transparent text-[#1f1b17] placeholder-[#b0a899] leading-relaxed" />
                    <button disabled={!input.trim() || loading} onClick={() => void send()}
                      className="p-2.5 rounded-full bg-[#C8102E] text-white disabled:opacity-20 transition-all shrink-0 m-0.5 hover:bg-[#a80d24] active:scale-95">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-[#b0a899] text-center mt-3">Nhấn Enter để gửi</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-[42rem] mx-auto px-5 py-8">
                  {current.messages.map((msg) => (
                    <MessageView key={msg.id} message={msg}
                      onGraph={() => setGraphOpen(true)}
                      onSources={msg.sources && msg.sources.length > 0 ? () => { setActiveSourceGroups(ragSourcesToGroups(msg.sources!)); setSourcesOpen(true); setSelectedChunk(null) } : undefined}
                      onSourceClick={(cid) => {
                        const m = msg.sources?.find((s) => s.chunk_id === cid)
                        if (m) { setSelectedChunk({ id: m.chunk_id, documentId: m.document_id, documentName: m.document_id, documentCode: "", path: "", content: m.text, snippet: m.text.slice(0, 180), status: "EFFECTIVE", contentType: m.document_type, rank: 0, score: m.score, language: m.language, accessScope: "public", version: m.version, indexedAt: "", available: true }); setActiveSourceGroups(ragSourcesToGroups(msg.sources!)); setSourcesOpen(true) }
                      }}
                      onToast={(t) => { setToast(t); setTimeout(() => setToast(""), 1800) }} />
                  ))}
                  {loading && (
                    <div className="flex gap-3.5 mb-8">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C8102E] to-[#8b0c20] flex items-center justify-center shrink-0 shadow-sm">
                        <Sparkles size={13} className="text-white" />
                      </div>
                      <div className="flex items-center gap-2 pt-1.5">
                        <div className="typing-indicator"><span /><span /><span /></div>
                        <span className="text-xs text-[#b0a899]">Đang tìm kiếm...</span>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>
              {/* Sticky composer */}
              <div className="border-t border-[#e0d8cb] bg-white/80 backdrop-blur-sm p-4 shrink-0">
                <div className="max-w-[42rem] mx-auto">
                  {sourceCount > 0 && (
                    <button onClick={() => setSourcesOpen((v) => !v)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mb-2 transition-colors ${sourcesOpen ? 'bg-[#C8102E] text-white' : 'bg-[#f6f2ec] border border-[#d7d0c5] text-[#1f1b17] hover:bg-[#ede8e0]'}`}>
                      <FileText size={13} /> Sources ({sourceCount})
                    </button>
                  )}
                  <div className="chat-composer">
                    <div className="flex items-end p-2.5">
                      <textarea value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send() } }}
                        rows={2} maxLength={2000} placeholder="Hỏi tiếp..."
                        className="flex-1 resize-none outline-none text-[15px] px-3 py-2 bg-transparent text-[#1f1b17] placeholder-[#b0a899] leading-relaxed" />
                      <button disabled={!input.trim() || loading} onClick={() => void send()}
                        className="p-2.5 rounded-full bg-[#C8102E] text-white disabled:opacity-20 transition-all shrink-0 m-0.5 hover:bg-[#a80d24] active:scale-95">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {sourcesOpen && !isEmpty && (
          <SourcesPanel
            groups={resolvedMode === "server" ? (current?.sources || []) : activeSourceGroups}
            selected={selectedChunk} onSelect={setSelectedChunk}
            onClose={() => { setSourcesOpen(false); setSelectedChunk(null) }} />
        )}
        </div>

        {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1f1b17] text-white text-sm px-5 py-3 rounded-2xl shadow-2xl z-50">{toast}</div>}

        <GraphModal open={graphOpen} onClose={() => setGraphOpen(false)}
          graphData={current?.messages.filter((m) => m.role === "ai").pop()?.graph} />
      </AppLayout>
    </DataStateBoundary>
  )
}
