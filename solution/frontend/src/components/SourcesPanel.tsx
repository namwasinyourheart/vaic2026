import { useState } from "react"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import type { SourceGroup, TextChunk } from "../domain"
import { Badge, EmptyState } from "./shared"
import ClauseTimeline from "./ClauseTimeline"

export default function SourcesPanel({
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

  if (selected) {
    return (
      <aside className="w-[560px] border-l bg-white flex min-h-0">
        <div className="w-56 border-r overflow-y-auto p-3">
          <button onClick={() => onSelect(null)} className="text-xs text-[#C8102E] mb-3">
            ← Danh sách chunks
          </button>
          {groups.flatMap((group) => group.chunks).map((chunk) => (
            <button
              key={chunk.id}
              onClick={() => onSelect(chunk)}
              className={`w-full text-left border rounded p-2 mb-2 ${selected.id === chunk.id ? "border-[#C8102E] bg-red-50" : ""}`}
            >
              <div className="text-[10px] font-mono text-gray-400">
                #{chunk.rank}
              </div>
              <div className="text-xs font-medium line-clamp-2 mt-1">{chunk.documentName}</div>
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="p-4 border-b flex justify-between">
            <div>
              <div className="text-[10px] text-gray-400 uppercase">Chi tiết text chunk</div>
              <h3 className="font-semibold text-sm mt-1">{selected.documentName}</h3>
            </div>
            <button onClick={onClose}><X size={18} /></button>
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
              ) : (
                <p className="text-sm leading-7 text-gray-700">{selected.content}</p>
              )}
            </div>
            <div className="p-4 border-t">
              <ClauseTimeline clauseId={selected.id} />
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-96 border-l bg-white flex flex-col min-h-0">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Sources</h3>
          <div className="text-[10px] text-gray-400">
            {groups.reduce((sum, group) => sum + group.chunks.length, 0)} text chunks
          </div>
        </div>
        <button onClick={onClose}><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {groups.length === 0 ? (
          <EmptyState title="Chưa có Sources" description="Gửi câu hỏi để hệ thống truy xuất nguồn." />
        ) : (
          groups.map((group) => (
            <section key={group.id} className="mb-3 border rounded">
              <button
                onClick={() => toggle(group.id)}
                className="w-full p-3 flex gap-2 text-left bg-gray-50 sticky top-0 z-10 border-b"
              >
                {collapsed.has(group.id) ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold">Results for</span>
                  <span className="text-xs text-gray-600 ml-1">&ldquo;{group.question}&rdquo;</span>
                </div>
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
                        <span className="text-[10px] font-mono text-[#C8102E]">Kết quả #{chunk.rank}</span>
                        <Badge variant="effective" />
                      </div>
                      <div className="text-xs font-semibold mt-2">{chunk.documentName}</div>
                      <div className="text-[10px] font-mono text-gray-400 mt-1">
                        {chunk.documentCode} · {chunk.path}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3 mt-2">{chunk.snippet}</p>
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
