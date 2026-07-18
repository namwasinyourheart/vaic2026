import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { createId } from "../utils/id"
import { aiService } from "../services/ai"
import type { RAGResponse, RAGSourceChunk, RAGGraph } from "../domain"
import KnowledgeGraph, { NodeDetailPanel } from "../components/KnowledgeGraph"
import MarkdownMessage from "../components/MarkdownMessage"

type GuestMessage = {
  id: string
  role: "user" | "ai"
  content: string
  createdAt: string
  sources?: RAGSourceChunk[]
  conflicts?: Array<{ clause_a: string; clause_b: string }>
  graph?: RAGGraph | null
}
type GuestConversation = {
  id: string
  title: string
  messages: GuestMessage[]
  updatedAt: string
}
const KEY = "shb-rag-guest-chat-v1"
const id = createId

export default function GuestChatPage() {
  const [items, setItems] = useState<GuestConversation[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]")
    } catch {
      return []
    }
  })
  const [active, setActive] = useState(() => items[0]?.id || "")
  const [question, setQuestion] = useState("")
  const [busy, setBusy] = useState(false)
  const [apiError, setApiError] = useState("")
  const [selectedChunk, setSelectedChunk] = useState<RAGSourceChunk | null>(null)
  const [graphOpen, setGraphOpen] = useState(false)
  const [selectedGraphNode, setSelectedGraphNode] = useState<Record<string, unknown> | null>(null)
  const current = useMemo(
    () => items.find((item) => item.id === active),
    [items, active],
  )
  const save = (next: GuestConversation[]) => {
    setItems(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }
  useEffect(() => {
    if (!active && items.length) setActive(items[0].id)
  }, [items, active])
  const create = () => {
    const item = {
      id: id(),
      title: "Cuộc trò chuyện mới",
      messages: [],
      updatedAt: new Date().toISOString(),
    }
    save([item, ...items])
    setActive(item.id)
  }
  const send = async () => {
    if (!question.trim() || !current || busy) return
    setBusy(true)
    const text = question.trim()
    setQuestion("")
    const now = new Date().toISOString()
    const withQuestion = {
      ...current,
      title: current.messages.length ? current.title : text.slice(0, 40),
      messages: [
        ...current.messages,
        { id: id(), role: "user" as const, content: text, createdAt: now },
      ],
      updatedAt: now,
    }
    save(items.map((item) => (item.id === current.id ? withQuestion : item)))
    try {
      setApiError("")
      const result: RAGResponse = await aiService.rag(text)
      const updated = {
        ...withQuestion,
        messages: [
          ...withQuestion.messages,
          {
            id: id(),
            role: "ai" as const,
            content: result.answer,
            createdAt: new Date().toISOString(),
            sources: result.sources,
            conflicts: result.conflicts,
            graph: result.graph,
          },
        ],
        updatedAt: new Date().toISOString(),
      }
      save(items.map((item) => (item.id === current.id ? updated : item)))
    } catch (value) {
      setApiError(value instanceof Error ? value.message : "API không phản hồi. Câu hỏi chưa nhận được câu trả lời.")
    } finally {
      setBusy(false)
    }
  }
  const lastAiMessage = current?.messages.filter((m) => m.role === "ai").pop()
  const sourceChunks = lastAiMessage?.sources || []
  const graphData = lastAiMessage?.graph

  return (
    <div className="guest-shell">
      <header className="guest-header">
        <strong>Lumina – AI Assistant for Enterprise Knowledge</strong>
        <span>Dữ liệu công khai • Guest</span>
        <nav>
          <Link to="/login">Đăng nhập</Link>
          <Link to="/register">Đăng ký</Link>
        </nav>
      </header>
      <div className="guest-body">
        <aside>
          <button onClick={create}>+ Cuộc trò chuyện mới</button>
          {items.map((item) => (
            <button
              className={item.id === active ? "active" : ""}
              onClick={() => setActive(item.id)}
              key={item.id}
            >
              {item.title}
            </button>
          ))}
          <small>Lịch sử chỉ lưu trên trình duyệt này.</small>
        </aside>
        <main>
          <h1>Trợ lý tài liệu ngân hàng</h1>
          {apiError && (
            <div
              role="alert"
              className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              Không thể nhận phản hồi từ API.{" "}
              <span className="font-medium">{apiError}</span>
            </div>
          )}
          <p className="muted">
            Bạn đang truy vấn phạm vi PUBLIC. Hãy đăng nhập để sử dụng workspace
            cá nhân.
          </p>
          {!current ? (
            <button onClick={create}>Bắt đầu trò chuyện</button>
          ) : (
            <>
              <section className="guest-messages">
                {current.messages.map((message) => (
                  <article className={message.role} key={message.id}>
                    <b>{message.role === "user" ? "Bạn" : "AI"}</b>
                    {message.role === "user" ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <MarkdownMessage
                        content={message.content}
                        onSourceClick={(chunkId) => {
                          const match = message.sources?.find((s) => s.chunk_id === chunkId)
                          if (match) setSelectedChunk(match)
                        }}
                      />
                    )}
                    {message.conflicts && message.conflicts.length > 0 && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                        ⚠️ Phát hiện mâu thuẫn:{" "}
                        {message.conflicts
                          .map((c) => `${c.clause_a} ↔ ${c.clause_b}`)
                          .join(", ")}
                      </div>
                    )}
                  </article>
                ))}
              </section>
              {sourceChunks.length > 0 && (
                <div className="guest-actions">
                  <button onClick={() => setSelectedChunk(sourceChunks[0])}>
                    Sources ({sourceChunks.length})
                  </button>
                  {graphData && (
                    <button onClick={() => setGraphOpen(true)}>Graph</button>
                  )}
                </div>
              )}
              {selectedChunk && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                    <div className="p-4 border-b flex justify-between">
                      <h3 className="font-semibold">{selectedChunk.document_id}</h3>
                      <button onClick={() => setSelectedChunk(null)}>✕</button>
                    </div>
                    <div className="p-4 overflow-y-auto max-h-[60vh]">
                      <div className="text-xs text-gray-500 mb-2">
                        {selectedChunk.section_title} • Score:{" "}
                        {(selectedChunk.score * 100).toFixed(0)}%
                      </div>
                      <p className="text-sm">{selectedChunk.text}</p>
                    </div>
                    <div className="p-4 border-t flex gap-2">
                      {sourceChunks.map((chunk) => (
                        <button
                          key={chunk.chunk_id}
                          onClick={() => setSelectedChunk(chunk)}
                          className={`text-xs p-2 rounded ${
                            selectedChunk.chunk_id === chunk.chunk_id
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100"
                          }`}
                        >
                          {chunk.chunk_id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {graphOpen && graphData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg w-[90vw] h-[80vh] overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex justify-between shrink-0">
                      <h3 className="font-semibold">Knowledge Graph</h3>
                      <button onClick={() => { setGraphOpen(false); setSelectedGraphNode(null) }}>✕</button>
                    </div>
                    <div className="flex flex-1 min-h-0">
                      <div className="flex-1 min-w-0">
                        <KnowledgeGraph data={graphData} onNodeClick={(_id, nd) => setSelectedGraphNode(nd)} />
                      </div>
                      <aside className="w-72 border-l bg-white p-4 overflow-y-auto shrink-0">
                        <NodeDetailPanel node={selectedGraphNode} onClose={() => setSelectedGraphNode(null)} />
                      </aside>
                    </div>
                  </div>
                </div>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void send()
                }}
              >
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Nhập câu hỏi về tài liệu công khai..."
                  disabled={busy}
                />
                <button disabled={busy}>{busy ? "Đang hỏi…" : "Gửi"}</button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
