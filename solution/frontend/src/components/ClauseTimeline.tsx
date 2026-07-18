import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Clock, FileText } from "lucide-react"
import { aiService, type TimelineEntry } from "../services/ai"

interface Props {
  clauseId: string
  onClose?: () => void
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Active: { bg: "bg-green-100", text: "text-green-700", label: "Đang hiệu lực" },
  Expired: { bg: "bg-gray-100", text: "text-gray-500", label: "Hết hiệu lực" },
  Superseded: { bg: "bg-amber-100", text: "text-amber-700", label: "Đã thay thế" },
  Draft: { bg: "bg-blue-100", text: "text-blue-700", label: "Bản nháp" },
}

export default function ClauseTimeline({ clauseId, onClose }: Props) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    setLoading(true)
    setError("")
    aiService
      .clauseTimeline(clauseId)
      .then((res) => {
        setEntries(res.timeline)
        // Auto-expand the current version
        const currentIdx = res.timeline.findIndex((e) => e.is_current)
        if (currentIdx >= 0) setExpanded(new Set([currentIdx]))
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi tải timeline"))
      .finally(() => setLoading(false))
  }, [clauseId])

  const toggle = (idx: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-6 justify-center">
        <Clock size={14} className="animate-spin" />
        Đang tải dòng thời gian...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-xs text-red-500 bg-red-50 rounded p-3 my-2">
        {error}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-xs text-gray-400 py-6 text-center">
        Không tìm thấy lịch sử phiên bản cho điều khoản này.
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <Clock size={13} />
          Tất cả phiên bản ({entries.length})
        </h4>
        {onClose && (
          <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-gray-600">
            Đóng
          </button>
        )}
      </div>

      <div className="relative pl-4">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />

        {entries.map((entry, idx) => {
          const isExpanded = expanded.has(idx)
          const style = STATUS_STYLES[entry.status] || STATUS_STYLES.Active

          return (
            <div key={entry.clause_id} className="relative mb-4 last:mb-0">
              {/* Dot on timeline */}
              <div
                className={`absolute -left-4 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  entry.is_current
                    ? "bg-[#C8102E]"
                    : entry.status === "Superseded"
                      ? "bg-amber-400"
                      : "bg-gray-300"
                }`}
              />

              <div className="ml-2">
                {/* Header row */}
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left flex items-center gap-1.5 group"
                >
                  {isExpanded ? (
                    <ChevronDown size={12} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight size={12} className="text-gray-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-semibold text-gray-800 group-hover:text-[#C8102E]">
                    {entry.clause_id}
                  </span>
                  {entry.is_current && (
                    <span className="text-[9px] bg-[#C8102E] text-white px-1.5 py-0.5 rounded-full font-medium">
                      HIỆN TẠI
                    </span>
                  )}
                </button>

                {/* Metadata row */}
                <div className="flex items-center gap-2 mt-1 ml-4">
                  <span className="text-[10px] text-gray-400">
                    {entry.effective_date || "—"}
                  </span>
                  {entry.expiry_date && (
                    <>
                      <span className="text-[10px] text-gray-300">→</span>
                      <span className="text-[10px] text-gray-400">{entry.expiry_date}</span>
                    </>
                  )}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="ml-4 mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText size={11} className="text-gray-400" />
                      <span className="text-[10px] text-gray-500">
                        {entry.document_title}
                      </span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {entry.document_id}
                      </span>
                    </div>
                    {entry.text ? (
                      <p className="text-[11px] leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {entry.text}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">
                        (Không có nội dung)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
