import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { guestChatService } from "../services/api"
import { createId } from "../utils/id"

type GuestMessage = {
  id: string
  role: "user" | "ai"
  content: string
  createdAt: string
}
type GuestConversation = {
  id: string
  title: string
  messages: GuestMessage[]
  sourceGroupId?: string
  sourceRefs?: Array<{
    ai_chunk_id: string
    rank: number
    relevance_score: number
  }>
  graphId?: string
  guestAccessToken?: string
  updatedAt: string
}
const KEY = "shb-rag-guest-chat-v1"
const sidKey = "shb-rag-guest-session-id"
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
      const session = localStorage.getItem(sidKey) || id()
      localStorage.setItem(sidKey, session)
      const result = await guestChatService.send(session, text)
      const updated = {
        ...withQuestion,
        messages: [
          ...withQuestion.messages,
          {
            id: id(),
            role: "ai" as const,
            content: result.answer,
            createdAt: result.created_at,
          },
        ],
        sourceGroupId: result.ai_source_group_id,
        sourceRefs: result.source_refs,
        graphId: result.ai_graph_id,
        guestAccessToken: result.guest_access_token,
        updatedAt: result.created_at,
      }
      save(items.map((item) => (item.id === current.id ? updated : item)))
    } catch (value) {
      setApiError(value instanceof Error ? value.message : "API không phản hồi. Câu hỏi chưa nhận được câu trả lời.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="guest-shell">
      <header className="guest-header">
        <strong>SHB Advanced RAG Knowledge Base</strong>
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
            {apiError && <div role="alert" className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Không thể nhận phản hồi từ API. Lịch sử câu hỏi vẫn được giữ trên trình duyệt. <span className="font-medium">{apiError}</span></div>}
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
                    <p>{message.content}</p>
                  </article>
                ))}
              </section>
              {current.sourceGroupId && (
                <div className="guest-actions">
                  <button
                    onClick={async () => {
                      const chunk = await guestChatService.chunk(
                        current.sourceGroupId!,
                        "unknown",
                        current.guestAccessToken!,
                      )
                      alert(String(chunk.content || "Source"))
                    }}
                  >
                    Sources
                  </button>
                  <button
                    onClick={async () => {
                      const graph = await guestChatService.graph(
                        current.graphId!,
                        current.guestAccessToken!,
                      )
                      alert(JSON.stringify(graph))
                    }}
                  >
                    Graph
                  </button>
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
