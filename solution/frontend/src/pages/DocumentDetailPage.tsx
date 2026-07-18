import { useEffect, useState } from "react"
import { Download, Network, Search } from "lucide-react"
import { useParams } from "react-router-dom"
import type { Document } from "../domain"
import { documentService } from "../services/api"
import AppLayout from "../layouts/AppLayout"
import { Badge, ApiDataState, Btn, Card, Tabs } from "../components/shared"
import { DemoStateBoundary } from "./SystemPages"

const statusLabel: Record<string, string> = {
  EFFECTIVE: "Đang có hiệu lực",
  PARTIALLY_EFFECTIVE: "Còn hiệu lực một phần",
  FUTURE_EFFECTIVE: "Chưa hiệu lực",
  EXPIRED: "Hết hiệu lực",
  SUPERSEDED: "Đã thay thế",
}

function TimelineList({ documents }: { documents: Document[] }) {
  return (
    <div className="p-5">
      {documents.flatMap((doc) => doc.timeline).map((event) => (
        <div key={event.id} className="flex gap-4 pb-5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-[#C8102E] mt-1" />
            <div className="w-px bg-gray-200 flex-1" />
          </div>
          <div className="border rounded p-4 flex-1">
            <div className="flex justify-between">
              <h3 className="font-semibold text-sm">{event.type} · {event.clause}</h3>
              <span className="text-xs font-mono text-gray-400">{event.date}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Văn bản tạo thay đổi: {event.document}</div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-red-50 text-red-700 p-3 rounded text-xs"><b>Trước:</b> {event.before}</div>
              <div className="bg-green-50 text-green-700 p-3 rounded text-xs"><b>Sau:</b> {event.after}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RelationList({ documents }: { documents: Document[] }) {
  return (
    <div className="p-5 space-y-3">
      {documents.flatMap((doc) => doc.relations).map((relation) => (
        <div key={relation.id} className="border rounded p-4 flex items-center">
          <div className="w-10 h-10 rounded bg-purple-50 text-purple-700 grid place-items-center">
            <Network size={18} />
          </div>
          <div className="flex-1 ml-3">
            <div className="font-semibold text-sm">{relation.targetDocument}</div>
            <div className="text-xs text-gray-400">{relation.type} · Áp dụng từ {relation.startDate}</div>
          </div>
          <Badge variant="approved" label={relation.type} />
        </div>
      ))}
    </div>
  )
}

export function DocumentDetailPageNew() {
  const { id = "doc-1" } = useParams()
  const [doc, setDoc] = useState<Document>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("overview")
  const [contentQuery, setContentQuery] = useState("")

  const load = async () => {
    setLoading(true); setError("")
    try { setDoc(await documentService.get(id)) }
    catch (e) { setError(e instanceof Error ? e.message : "API chi tiết văn bản không phản hồi.") }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [id])

  if (loading || error) return <AppLayout pageTitle="Chi tiết văn bản"><ApiDataState loading={loading} error={error} onRetry={() => void load()}><div /></ApiDataState></AppLayout>
  if (!doc) return <AppLayout pageTitle="Chi tiết văn bản"><ApiDataState loading={false} empty><div /></ApiDataState></AppLayout>

  return (
    <DemoStateBoundary title="Chi tiết văn bản">
      <AppLayout pageTitle="Chi tiết văn bản" breadcrumbs={["Quản lý văn bản", doc.code]}>
        <Card className="p-5 mb-4 flex justify-between">
          <div>
            <h2 className="font-bold">{doc.name}</h2>
            <div className="text-xs font-mono text-gray-400 mt-1">{doc.code} · {doc.type} · {doc.issuingUnit}</div>
            <div className="mt-2"><Badge variant="effective" label={statusLabel[doc.effectiveStatus]} /></div>
          </div>
          <Btn variant="outline"><Download size={14} /> Tải văn bản gốc</Btn>
        </Card>
        <Card>
          <Tabs
            tabs={[
              { key: "overview", label: "Tổng quan" },
              { key: "content", label: "Nội dung" },
              { key: "clauses", label: "Điều khoản", count: doc.clauses.length },
              { key: "versions", label: "Phiên bản", count: doc.versions.length },
              { key: "timeline", label: "Timeline sửa đổi" },
              { key: "related", label: "Văn bản liên quan" },
            ]}
            active={tab}
            onChange={setTab}
          />
          {tab === "overview" && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                ["Tên văn bản", doc.name],
                ["Số hiệu", doc.code],
                ["Loại", doc.type],
                ["Đơn vị ban hành", doc.issuingUnit],
                ["Ngày ban hành", doc.issuedAt],
                ["Ngày hiệu lực", doc.effectiveAt],
                ["Trạng thái", statusLabel[doc.effectiveStatus]],
                ["Lĩnh vực", doc.field],
                ["Từ khóa", doc.keywords.join(", ")],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-gray-400">{label}</div>
                  <div className="text-sm font-medium mt-1">{value}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "content" && (
            <div className="flex h-[520px]">
              <aside className="w-60 border-r p-3 overflow-y-auto">
                <div className="font-semibold text-xs mb-3">Mục lục</div>
                {["Chương I. Quy định chung", "Điều 1. Phạm vi", "Chương II. Nội dung", "Điều 5. Lãi suất", "Khoản 2. Kỳ hạn 12 tháng"].map((text) => (
                  <button key={text} className="block text-left w-full text-xs p-2 hover:bg-gray-50">{text}</button>
                ))}
              </aside>
              <article className="flex-1 p-5 overflow-y-auto">
                <div className="relative mb-4">
                  <Search size={15} className="absolute left-2.5 top-2 text-gray-400" />
                  <input value={contentQuery} onChange={(e) => setContentQuery(e.target.value)} placeholder="Tìm trong văn bản..." className="border rounded pl-8 pr-3 py-1.5 text-xs w-72" />
                </div>
                <h2 className="font-bold text-center">{doc.name.toUpperCase()}</h2>
                <p className="mt-5 text-sm leading-7">Căn cứ các quy định pháp luật hiện hành và quy chế hoạt động của Ngân hàng TMCP Sài Gòn – Hà Nội;</p>
                <h3 className="font-bold mt-5">Điều 5. Quy định áp dụng</h3>
                <p className={`mt-2 text-sm leading-7 ${contentQuery ? "bg-yellow-100" : ""}`}>{doc.clauses[0]?.content}</p>
              </article>
            </div>
          )}
          {tab === "clauses" && (
            <div className="p-5 space-y-3">
              {doc.clauses.map((clause) => (
                <div key={clause.id} className="border rounded p-4">
                  <div className="font-semibold text-sm text-blue-700">{clause.path}</div>
                  <p className="text-sm mt-2">{clause.content}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "versions" && (
            <div className="p-5 space-y-3">
              {doc.versions.map((version) => (
                <div key={version.id} className="border rounded p-4 flex items-center">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{version.label}</div>
                    <div className="text-xs text-gray-400">{version.effectiveFrom} – {version.effectiveTo || "Hiện tại"} · {version.changeDocument}</div>
                  </div>
                  <Badge variant={version.status === "EFFECTIVE" ? "effective" : "superseded"} />
                </div>
              ))}
            </div>
          )}
          {tab === "timeline" && <TimelineList documents={[doc]} />}
          {tab === "related" && <RelationList documents={[doc]} />}
        </Card>
      </AppLayout>
    </DemoStateBoundary>
  )
}
