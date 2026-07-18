import { useEffect, useState } from "react"
import { MessageSquare, Search } from "lucide-react"
import AppLayout from "../layouts/AppLayout"
import { useAuth } from "../auth/AuthContext"
import type { Conversation } from "../domain"
import { chatService } from "../services/api"
import { ApiDataState, Card, EmptyState, PageHeader } from "../components/shared"

export default function ConversationHistoryPage() {
  const { user } = useAuth()
  const role = user?.role === "ROLE_STAFF" ? "ROLE_STAFF" : "ROLE_CUSTOMER"
  const [items, setItems] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const load = async () => { setLoading(true); setError(""); try { setItems(await chatService.list(role)) } catch (value) { setError(value instanceof Error ? value.message : "API lịch sử hội thoại không phản hồi.") } finally { setLoading(false) } }
  useEffect(() => { void load() }, [role])
  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <AppLayout pageTitle="Lịch sử hội thoại">
      <PageHeader
        title="Lịch sử hội thoại"
        subtitle={loading ? "Loading…" : error ? "Chưa xác định được lịch sử hội thoại" : `${filtered.length} cuộc trò chuyện`}
      />
      <Card className="p-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm hội thoại..."
            className="w-full border rounded pl-9 py-2 text-sm"
          />
        </div>
      </Card>
      <ApiDataState loading={loading} error={error} onRetry={() => void load()} empty={!loading && !error && filtered.length === 0} emptyTitle="Chưa có hội thoại">
        <Card>
          {filtered.length === 0 ? (
            <EmptyState title="Chưa có hội thoại" />
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="p-4 border-b flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-red-50 text-[#C8102E] grid place-items-center">
                  <MessageSquare size={17} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {item.messages.length} tin nhắn · Cập nhật {item.updatedAt}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {item.scope === "internal" ? "Nội bộ" : "Công khai"}
                </div>
              </div>
            ))
          )}
        </Card>
      </ApiDataState>
    </AppLayout>
  )
}
