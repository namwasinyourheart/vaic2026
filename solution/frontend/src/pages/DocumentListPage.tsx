import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
  X,
  FileUp,
  Pencil,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import type { Document } from "../domain"
import { documentService } from "../services/api"
import AppLayout from "../layouts/AppLayout"
import {
  Badge,
  ApiDataState,
  Btn,
  Card,
  PageHeader,
  Select,
} from "../components/shared"

const STATUS_LABELS: Record<string, string> = {
  EFFECTIVE: "Có hiệu lực",
  PARTIALLY_EFFECTIVE: "Hiệu lực một phần",
  FUTURE_EFFECTIVE: "Chưa hiệu lực",
  EXPIRED: "Hết hiệu lực",
  SUPERSEDED: "Đã thay thế",
}

const STATUS_BADGE: Record<string, "effective" | "warning" | "info" | "expired" | "superseded"> = {
  EFFECTIVE: "effective",
  PARTIALLY_EFFECTIVE: "warning",
  FUTURE_EFFECTIVE: "info",
  EXPIRED: "expired",
  SUPERSEDED: "superseded",
}

const DOC_TYPES = [
  { value: "", label: "Tất cả" },
  { value: "Nghị định", label: "Nghị định" },
  { value: "Thông tư", label: "Thông tư" },
  { value: "Quyết định", label: "Quyết định" },
  { value: "Quy chế", label: "Quy chế" },
  { value: "Hướng dẫn", label: "Hướng dẫn" },
  { value: "Công văn", label: "Công văn" },
]

const EFFECTIVE_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "EFFECTIVE", label: "Có hiệu lực" },
  { value: "PARTIALLY_EFFECTIVE", label: "Một phần" },
  { value: "FUTURE_EFFECTIVE", label: "Chưa hiệu lực" },
  { value: "EXPIRED", label: "Hết hiệu lực" },
  { value: "SUPERSEDED", label: "Đã thay thế" },
]

interface DocumentFormData {
  title: string
  doc_number: string
  doc_type: string
  agency: string
  signer: string
  signer_title: string
  issue_date: string
  effective_date: string
  expire_date: string
  status: string
  industry: string
  field: string
  access_scope: string
}

const EMPTY_FORM: DocumentFormData = {
  title: "",
  doc_number: "",
  doc_type: "",
  agency: "",
  signer: "",
  signer_title: "",
  issue_date: "",
  effective_date: "",
  expire_date: "",
  status: "Còn hiệu lực",
  industry: "",
  field: "",
  access_scope: "INTERNAL",
}

function parseMdFrontmatter(content: string): { metadata: Partial<DocumentFormData>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { metadata: {}, body: content }
  const yamlBlock = match[1]
  const body = match[2]
  const metadata: Partial<DocumentFormData> = {}
  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx < 0) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "")
    if (key === "title") metadata.title = value
    else if (key === "doc_number" || key === "document_code") metadata.doc_number = value
    else if (key === "doc_type" || key === "document_type") metadata.doc_type = value
    else if (key === "agency" || key === "issuing_unit") metadata.agency = value
    else if (key === "signer") metadata.signer = value
    else if (key === "signer_title") metadata.signer_title = value
    else if (key === "issue_date") metadata.issue_date = value
    else if (key === "effective_date" || key === "effective_from") metadata.effective_date = value
    else if (key === "expire_date" || key === "effective_to") metadata.expire_date = value
    else if (key === "status") metadata.status = value
    else if (key === "industry") metadata.industry = value
    else if (key === "field" || key === "business_domain") metadata.field = value
    else if (key === "access_scope") metadata.access_scope = value
  }
  return { metadata, body }
}

function AddDocumentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [tab, setTab] = useState<"form" | "upload">("form")
  const [form, setForm] = useState<DocumentFormData>({ ...EMPTY_FORM })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")

  const reset = () => {
    setForm({ ...EMPTY_FORM })
    setError("")
    setSuccess(false)
    setSelectedFile(null)
    setFileName("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const set = (key: keyof DocumentFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".md")) {
      setError("Chỉ chấp nhận file .md (Markdown)")
      return
    }
    setFileName(file.name)
    setSelectedFile(file)
    try {
      const text = await file.text()
      const { metadata } = parseMdFrontmatter(text)
      if (Object.keys(metadata).length > 0) {
        setForm((prev) => ({ ...prev, ...metadata }))
        setTab("form")
      }
    } catch {
      setError("Không thể đọc file .md")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
  }

  const submit = async () => {
    setError("")
    if (!form.title.trim() || !form.doc_number.trim()) {
      setError("Vui lòng nhập ít nhất Số hiệu và Tên văn bản")
      return
    }
    setLoading(true)
    try {
      const fileContent = selectedFile
        ? await selectedFile.text()
        : `---\ntitle: "${form.title}"\ndoc_number: "${form.doc_number}"\ndoc_type: "${form.doc_type}"\nagency: "${form.agency}"\nsigner: "${form.signer}"\nsigner_title: "${form.signer_title}"\nissue_date: "${form.issue_date}"\neffective_date: "${form.effective_date}"\nexpire_date: "${form.expire_date}"\nstatus: "${form.status}"\nindustry: "${form.industry}"\nfield: "${form.field}"\naccess_scope: "${form.access_scope}"\n---\n\n${form.title}`
      const blob = new Blob([fileContent], { type: "text/markdown" })
      const mdFile = new File([blob], `${form.doc_number}.md`, { type: "text/markdown" })
      await documentService.upload(mdFile, {
        name: form.title,
        type: form.doc_type || "Khác",
        field: form.field || form.industry || "",
        scope: form.access_scope,
        doc_number: form.doc_number,
        agency: form.agency,
        issued_at: form.issue_date || undefined,
        effective_from: form.effective_date || undefined,
        effective_to: form.expire_date || undefined,
      })
      setSuccess(true)
      setTimeout(() => {
        handleClose()
        onCreated()
      }, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tạo văn bản thất bại")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[#DDE1E9]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE1E9]">
          <h2 className="text-base font-semibold text-gray-900">Thêm văn bản mới</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-[#DDE1E9]">
          <button
            onClick={() => setTab("form")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === "form" ? "border-[#C8102E] text-[#C8102E]" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Pencil size={15} /> Nhập thông tin
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === "upload" ? "border-[#C8102E] text-[#C8102E]" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileUp size={15} /> Upload file .md
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="text-green-600 mb-3" size={40} />
              <div className="text-sm font-semibold text-gray-900">Tạo văn bản thành công!</div>
              <div className="text-xs text-gray-500 mt-1">Đang quay lại danh sách...</div>
            </div>
          ) : tab === "upload" ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? "border-[#C8102E] bg-red-50" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <FileUp className="mx-auto text-gray-400 mb-3" size={36} />
              <div className="text-sm font-medium text-gray-700">
                Kéo thả file .md vào đây
              </div>
              <div className="text-xs text-gray-500 mt-1">
                File phải có YAML frontmatter chứa metadata
              </div>
              <div className="mt-4">
                <Btn variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Chọn file
                </Btn>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
              {fileName && (
                <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  Đã chọn: {fileName}
                </div>
              )}
              <div className="mt-4 text-left bg-gray-50 rounded p-3">
                <div className="text-xs font-medium text-gray-600 mb-2">Định dạng file .md mẫu:</div>
                <pre className="text-[11px] text-gray-500 font-mono whitespace-pre-wrap">{`---
title: "Nghị định số 141/2026/NĐ-CP"
doc_number: "141/2026/NĐ-CP"
doc_type: "Nghị định"
agency: "Chính phủ"
effective_date: "2026-01-01"
status: "Còn hiệu lực"
---

Nội dung văn bản ở đây...`}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Số hiệu văn bản <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.doc_number}
                    onChange={(e) => set("doc_number", e.target.value)}
                    placeholder="VD: 141/2026/NĐ-CP"
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tên văn bản <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Tên đầy đủ của văn bản"
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Loại văn bản</label>
                  <select
                    value={form.doc_type}
                    onChange={(e) => set("doc_type", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Chọn loại</option>
                    <option value="Nghị định">Nghị định</option>
                    <option value="Thông tư">Thông tư</option>
                    <option value="Quyết định">Quyết định</option>
                    <option value="Quy chế">Quy chế</option>
                    <option value="Hướng dẫn">Hướng dẫn</option>
                    <option value="Công văn">Công văn</option>
                    <option value="Luật">Luật</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cơ quan ban hành</label>
                  <input
                    value={form.agency}
                    onChange={(e) => set("agency", e.target.value)}
                    placeholder="VD: Chính phủ, NHNN"
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Người ký</label>
                  <input
                    value={form.signer}
                    onChange={(e) => set("signer", e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Chức vụ người ký</label>
                  <input
                    value={form.signer_title}
                    onChange={(e) => set("signer_title", e.target.value)}
                    placeholder="VD: Phó Thủ tướng"
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngày ban hành</label>
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => set("issue_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngày hiệu lực</label>
                  <input
                    type="date"
                    value={form.effective_date}
                    onChange={(e) => set("effective_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngày hết hiệu lực</label>
                  <input
                    type="date"
                    value={form.expire_date}
                    onChange={(e) => set("expire_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Còn hiệu lực">Còn hiệu lực</option>
                    <option value="Chưa hiệu lực">Chưa hiệu lực</option>
                    <option value="Hết hiệu lực">Hết hiệu lực</option>
                    <option value="Đã thay thế">Đã thay thế</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngành</label>
                  <input
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                    placeholder="VD: Tài chính"
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lĩnh vực</label>
                  <input
                    value={form.field}
                    onChange={(e) => set("field", e.target.value)}
                    placeholder="VD: Thuế thu nhập doanh nghiệp"
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phạm vi truy cập</label>
                  <select
                    value={form.access_scope}
                    onChange={(e) => set("access_scope", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="INTERNAL">Nội bộ</option>
                    <option value="PUBLIC">Công khai</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-3">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {!success && (
          <div className="px-5 py-3 border-t border-[#DDE1E9] flex justify-end gap-2">
            <Btn variant="outline" onClick={handleClose}>Hủy</Btn>
            <Btn onClick={submit} disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo văn bản"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DocumentListPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setDocuments(await documentService.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách văn bản.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = documents.filter((doc) => {
    const matchQuery = !query || `${doc.name} ${doc.code}`.toLowerCase().includes(query.toLowerCase())
    const matchType = !typeFilter || doc.type === typeFilter
    const matchStatus = !statusFilter || doc.effectiveStatus === statusFilter
    return matchQuery && matchType && matchStatus
  })

  return (
    <AppLayout pageTitle="Quản lý văn bản">
      <PageHeader
        title="Quản lý văn bản"
        subtitle={`${documents.length} văn bản trong hệ thống`}
        actions={
          <Btn onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Thêm văn bản mới
          </Btn>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc số hiệu văn bản..."
              className="w-full border border-[#DDE1E9] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors"
            />
          </div>
          <Btn variant="outline" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal size={14} /> Bộ lọc
            {(typeFilter || statusFilter) && (
              <span className="ml-1 w-4 h-4 rounded-full bg-[#C8102E] text-white text-[10px] grid place-items-center">
                {(typeFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </Btn>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#DDE1E9]">
            <Select
              label="Loại văn bản"
              value={typeFilter}
              onChange={setTypeFilter}
              options={DOC_TYPES}
            />
            <Select
              label="Trạng thái hiệu lực"
              value={statusFilter}
              onChange={setStatusFilter}
              options={EFFECTIVE_OPTIONS}
            />
          </div>
        )}
      </Card>

      <ApiDataState
        loading={loading}
        error={error}
        onRetry={() => void load()}
        empty={!loading && !error && filtered.length === 0}
        emptyTitle="Không tìm thấy văn bản"
        emptyDescription="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
      >
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#DDE1E9] bg-[#F8FAFC]">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Số hiệu</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Tên văn bản</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Loại</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Cơ quan ban hành</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Ngày hiệu lực</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Trạng thái</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Ngày tạo</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[#DDE1E9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{doc.code}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/staff/documents/${doc.id}`)}
                        className="text-left font-medium text-sm text-gray-900 hover:text-[#C8102E] transition-colors line-clamp-2"
                      >
                        {doc.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{doc.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{doc.issuingUnit || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{doc.effectiveAt || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={STATUS_BADGE[doc.effectiveStatus] || "info"}
                        label={STATUS_LABELS[doc.effectiveStatus] || doc.effectiveStatus}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{doc.updatedAt}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/staff/documents/${doc.id}`)}
                        className="p-1.5 text-gray-400 hover:text-[#C8102E] hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </ApiDataState>

      <AddDocumentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={() => void load()}
      />
    </AppLayout>
  )
}
