import { useEffect, useRef, useState } from "react"
import {
  Check,
  FileUp,
  Link2,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldOff,
  Trash2,
  UploadCloud,
} from "lucide-react"
import type { Document, EffectiveStatus, Relation } from "../../domain"
import { documentService, knowledgeService } from "../../services/api"
import AppLayout from "../../layouts/AppLayout"
import {
  Badge,
  ApiDataState,
  Btn,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
} from "../../components/shared"
import { DataStateBoundary } from "../SystemPages"
import { createId } from "../../utils/id"

function useKnowledgeDocs() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const reload = async () => { setLoading(true); setError(""); try { setDocuments(await documentService.list()) } catch (value) { setError(value instanceof Error ? value.message : "API tài liệu không phản hồi.") } finally { setLoading(false) } }
  useEffect(() => {
    void reload()
  }, [])
  return { documents, setDocuments, loading, error, reload }
}
function KnowledgeUnavailable({ title, loading, error, reload }: { title: string; loading: boolean; error: string; reload: () => void }) {
  if (!loading && !error) return null
  return <AppLayout pageTitle={title}><ApiDataState loading={loading} error={error} onRetry={() => void reload()}><div /></ApiDataState></AppLayout>
}
const effectiveVariant = (status: EffectiveStatus) =>
  status === "EFFECTIVE"
    ? "effective"
    : status === "PARTIALLY_EFFECTIVE"
      ? "partially_effective"
      : status === "EXPIRED"
        ? "expired"
        : status === "SUPERSEDED"
          ? "superseded"
          : "future_effective"

export function KnowledgeDashboard() {
  const { documents, loading, error, reload } = useKnowledgeDocs()
  if (loading || error) return <KnowledgeUnavailable title="Tổng quan kho tri thức" loading={loading} error={error} reload={reload} />
  const recent = documents.slice(0, 5)
  return (
    <DataStateBoundary title="Tổng quan kho tri thức">
      <AppLayout pageTitle="Tổng quan kho tri thức">
        <PageHeader
          title="Kho tri thức"
          subtitle="Trạng thái dữ liệu và hoạt động xử lý tài liệu"
        />
        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatCard
            label="Tổng tài liệu"
            value={documents.length}
            color="blue"
          />
          <StatCard
            label="Đang có hiệu lực"
            value={
              documents.filter((d) => d.effectiveStatus === "EFFECTIVE").length
            }
            color="green"
          />
          <StatCard
            label="Đang xử lý"
            value={
              documents.filter((d) => d.processingStatus === "PROCESSING")
                .length
            }
            color="purple"
          />
          <StatCard
            label="Xử lý lỗi"
            value={
              documents.filter((d) => d.processingStatus === "FAILED").length
            }
            color="red"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard
            label="Chưa index"
            value={
              documents.filter((d) => d.indexStatus === "NOT_INDEXED").length
            }
            color="gray"
          />
          <StatCard
            label="Cần re-index"
            value={
              documents.filter((d) => d.indexStatus === "REINDEX_REQUIRED")
                .length
            }
            color="amber"
          />
          <StatCard
            label="Hết/giảm hiệu lực"
            value={
              documents.filter((d) => d.effectiveStatus !== "EFFECTIVE").length
            }
            color="red"
          />
        </div>
        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2">
            <div className="p-4 border-b font-semibold text-sm">
              Tài liệu mới cập nhật
            </div>
            {recent.map((doc) => (
              <div
                key={doc.id}
                className="px-4 py-3 border-b flex items-center"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{doc.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {doc.code} · {doc.updatedAt}
                  </div>
                </div>
                <Badge variant={effectiveVariant(doc.effectiveStatus)} />
              </div>
            ))}
          </Card>
          <Card>
            <div className="p-4 border-b font-semibold text-sm">
              Hoạt động gần đây
            </div>
            {[
              "Upload QĐ-01/2024",
              "Duyệt metadata VB-002",
              "Re-index hoàn tất",
              "Liên kết văn bản mới",
            ].map((item, index) => (
              <div key={item} className="px-4 py-3 border-b">
                <div className="text-xs">{item}</div>
                <div className="text-[10px] text-gray-400">
                  {index + 1} giờ trước · Chuyên gia Pháp chế
                </div>
              </div>
            ))}
          </Card>
        </div>
      </AppLayout>
    </DataStateBoundary>
  )
}

export function KnowledgeDocuments() {
  const { documents, loading, error, reload } = useKnowledgeDocs()
  const [query, setQuery] = useState("")
  const [process, setProcess] = useState("")
  const [index, setIndex] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 8
  const filtered = documents.filter(
    (doc) =>
      (!query ||
        `${doc.name} ${doc.code}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!process || doc.processingStatus === process) &&
      (!index || doc.indexStatus === index),
  )
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)
  return (
    <DataStateBoundary title="Danh sách tài liệu">
      <AppLayout pageTitle="Danh sách tài liệu">
        <PageHeader
          title="Danh sách tài liệu"
          subtitle={loading ? "Loading…" : error ? "Chưa xác định được số tài liệu" : `${filtered.length} tài liệu trong kho`}
          actions={
            <Btn disabled={loading || !!error} onClick={() => location.assign("/knowledge-manager/upload")}>
              <FileUp size={14} /> Upload tài liệu
            </Btn>
          }
        />
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-2 relative">
              <Search
                size={15}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Từ khóa, tên hoặc số hiệu..."
                className="w-full border rounded pl-9 pr-2 py-2 text-xs"
              />
            </div>
            <Select
              value={process}
              onChange={setProcess}
              options={[
                { value: "", label: "Mọi trạng thái xử lý" },
                { value: "COMPLETED", label: "Hoàn tất" },
                { value: "FAILED", label: "Lỗi" },
                { value: "PROCESSING", label: "Đang xử lý" },
              ]}
            />
            <Select
              value={index}
              onChange={setIndex}
              options={[
                { value: "", label: "Mọi trạng thái index" },
                { value: "INDEXED", label: "Đã index" },
                { value: "REINDEX_REQUIRED", label: "Cần re-index" },
              ]}
            />
            <Select
              options={[
                { value: "", label: "Mọi hiệu lực" },
                { value: "EFFECTIVE", label: "Đang hiệu lực" },
              ]}
            />
            <Input type="date" />
          </div>
        </Card>
        <Card>
          {loading || error ? (
            <ApiDataState loading={loading} error={error} onRetry={() => void reload()}><div /></ApiDataState>
          ) : rows.length === 0 ? (
            <EmptyState title="Không có tài liệu" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    {[
                      "Tên tài liệu",
                      "Số hiệu",
                      "Loại",
                      "Ngày hiệu lực",
                      "Hiệu lực",
                      "Xử lý",
                      "Index",
                      "Cập nhật",
                      "Thao tác",
                    ].map((item) => (
                      <th key={item} className="text-left p-3">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((doc) => (
                    <tr key={doc.id} className="border-t">
                      <td className="p-3 font-medium max-w-64">{doc.name}</td>
                      <td className="p-3 font-mono">{doc.code}</td>
                      <td className="p-3">{doc.type}</td>
                      <td className="p-3">{doc.effectiveAt}</td>
                      <td className="p-3">
                        <Badge
                          variant={effectiveVariant(doc.effectiveStatus)}
                        />
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            doc.processingStatus.toLowerCase() as "completed" | "failed" | "processing"
                          }
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10px]">
                          {doc.indexStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        {doc.uploader}
                        <br />
                        <span className="text-gray-400">{doc.updatedAt}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            title="Chỉnh sửa metadata"
                            onClick={() =>
                              location.assign(
                                `/knowledge-manager/metadata?document=${doc.id}`,
                              )
                            }
                            className="p-1.5 hover:bg-gray-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            title="Đánh dấu hết hiệu lực"
                            onClick={() =>
                              location.assign(
                                `/knowledge-manager/effectiveness?document=${doc.id}`,
                              )
                            }
                            className="p-1.5 hover:bg-gray-100"
                          >
                            <ShieldOff size={14} />
                          </button>
                          <button
                            title="Re-index"
                            onClick={() =>
                              location.assign(
                                `/knowledge-manager/reindex?document=${doc.id}`,
                              )
                            }
                            className="p-1.5 hover:bg-gray-100"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 border-t flex justify-between text-xs">
            <span>
              Trang {page}/{Math.max(1, Math.ceil(filtered.length / pageSize))}
            </span>
            <div className="flex gap-2">
              <Btn
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((v) => v - 1)}
              >
                Trước
              </Btn>
              <Btn
                size="sm"
                variant="outline"
                disabled={page * pageSize >= filtered.length}
                onClick={() => setPage((v) => v + 1)}
              >
                Sau
              </Btn>
            </div>
          </div>
        </Card>
      </AppLayout>
    </DataStateBoundary>
  )
}

const PROCESS_STEPS = [
  "Upload",
  "Parse",
  "Trích xuất cấu trúc",
  "Chunking",
  "Embedding",
  "Index",
  "Hoàn tất",
]
export function UploadDocumentPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File>()
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [processStep, setProcessStep] = useState(0)
  const [form, setForm] = useState({
    name: "",
    type: "",
    field: "",
    scope: "",
    description: "",
    notes: "",
  })
  const validate = (value?: File) => {
    if (!value) return
    const extension = value.name.split(".").pop()?.toLowerCase()
    if (!["pdf", "docx"].includes(extension || ""))
      return setError("Chỉ hỗ trợ file PDF hoặc DOCX.")
    if (value.size > 50 * 1024 * 1024)
      return setError("Dung lượng file không được vượt quá 50 MB.")
    setError("")
    setFile(value)
    setForm((old) => ({
      ...old,
      name: old.name || value.name.replace(/\.[^.]+$/, ""),
    }))
  }
  const start = async () => {
    if (!file) return
    setStep(4)
    try {
      await documentService.upload(file, form)
      for (let index = 1; index <= PROCESS_STEPS.length; index++) {
        await new Promise((resolve) => setTimeout(resolve, 120))
        setProcessStep(index)
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : "Upload thất bại.")
      setStep(3)
    }
  }
  return (
    <DataStateBoundary title="Upload tài liệu">
      <AppLayout pageTitle="Upload tài liệu">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Upload tài liệu"
            subtitle="PDF/DOCX, tối đa 50 MB"
          />
          <div className="flex justify-center mb-6">
            {["Chọn file", "Thông tin", "Xác nhận", "Xử lý"].map(
              (label, index) => (
                <div key={label} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold ${step > index
                        ? "bg-[#C8102E] text-white"
                        : "bg-gray-200 text-gray-500"
                      }`}
                  >
                    {step > index + 1 ? <Check size={14} /> : index + 1}
                  </div>
                  <span className="text-xs mx-2">{label}</span>
                  {index < 3 && <div className="w-10 h-px bg-gray-300 mr-2" />}
                </div>
              ),
            )}
          </div>
          {step === 1 && (
            <Card className="p-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  validate(e.dataTransfer.files[0])
                }}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-[#C8102E]"
              >
                <UploadCloud className="mx-auto text-gray-300" size={42} />
                {file ? (
                  <>
                    <div className="font-semibold mt-3">{file.name}</div>
                    <div className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium text-sm mt-3">
                      Kéo thả file hoặc nhấn để chọn
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      PDF, DOCX · Tối đa 50 MB
                    </div>
                  </>
                )}
                <input
                  ref={fileRef}
                  hidden
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => validate(e.target.files?.[0])}
                />
              </div>
              {error && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Btn disabled={!file} onClick={() => setStep(2)}>
                  Tiếp theo
                </Btn>
              </div>
            </Card>
          )}
          {step === 2 && (
            <Card className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tên tài liệu"
                  required
                  value={form.name}
                  onChange={(name) => setForm((v) => ({ ...v, name }))}
                />
                <Select
                  label="Loại tài liệu"
                  value={form.type}
                  onChange={(type) => setForm((v) => ({ ...v, type }))}
                  options={[
                    "Quyết định",
                    "Quy chế",
                    "Hướng dẫn",
                    "Thông tư",
                  ].map((value) => ({ value, label: value }))}
                />
                <Select
                  label="Lĩnh vực nghiệp vụ"
                  value={form.field}
                  onChange={(field) => setForm((v) => ({ ...v, field }))}
                  options={["Tín dụng", "Huy động vốn", "Thẻ", "Vận hành"].map(
                    (value) => ({ value, label: value }),
                  )}
                />
                <Select
                  label="Phạm vi truy cập"
                  value={form.scope}
                  onChange={(scope) => setForm((v) => ({ ...v, scope }))}
                  options={[
                    { value: "public", label: "Công khai" },
                    { value: "internal", label: "Nội bộ" },
                  ]}
                />
                <div className="col-span-2">
                  <Input
                    label="Mô tả"
                    value={form.description}
                    onChange={(description) =>
                      setForm((v) => ({ ...v, description }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label="Ghi chú"
                    value={form.notes}
                    onChange={(notes) => setForm((v) => ({ ...v, notes }))}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-5">
                <Btn variant="outline" onClick={() => setStep(1)}>
                  Quay lại
                </Btn>
                <Btn
                  disabled={
                    !form.name || !form.type || !form.field || !form.scope
                  }
                  onClick={() => setStep(3)}
                >
                  Tiếp theo
                </Btn>
              </div>
            </Card>
          )}
          {step === 3 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Xác nhận thông tin</h3>
              <div className="bg-gray-50 rounded p-4 text-sm space-y-2">
                {[
                  ["File", file?.name],
                  ["Tên tài liệu", form.name],
                  ["Loại", form.type],
                  ["Lĩnh vực", form.field],
                  ["Phạm vi", form.scope],
                  ["Mô tả", form.description || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex">
                    <span className="text-gray-400 w-36">{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-5">
                <Btn variant="outline" onClick={() => setStep(2)}>
                  Quay lại
                </Btn>
                <Btn onClick={() => void start()}>Xác nhận upload</Btn>
              </div>
            </Card>
          )}
          {step === 4 && (
            <Card className="p-6">
              <h3 className="font-semibold">Tiến trình xử lý</h3>
              <div className="mt-5">
                {PROCESS_STEPS.map((label, index) => (
                  <div key={label} className="flex gap-3 min-h-14">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full grid place-items-center ${processStep > index
                            ? "bg-green-500 text-white"
                            : processStep === index
                              ? "bg-[#C8102E] text-white animate-pulse"
                              : "bg-gray-200"
                          }`}
                      >
                        {processStep > index ? <Check size={14} /> : index + 1}
                      </div>
                      {index < PROCESS_STEPS.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-[10px] text-gray-400">
                        {processStep > index
                          ? "Hoàn tất · 0,2 giây"
                          : processStep === index
                            ? "Đang xử lý..."
                            : "Đang chờ"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {processStep === PROCESS_STEPS.length && (
                <div className="bg-green-50 border border-green-200 p-3 rounded text-sm text-green-700">
                  Upload và index tài liệu thành công.
                </div>
              )}
            </Card>
          )}
        </div>
      </AppLayout>
    </DataStateBoundary>
  )
}

export function MetadataPage() {
  const { documents, loading, error, reload } = useKnowledgeDocs()
  const doc = documents[0]
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    if (doc)
      setValues({
        name: doc.name,
        code: doc.code,
        type: doc.type,
        unit: doc.issuingUnit,
        issued: doc.issuedAt,
        effective: doc.effectiveAt,
        expires: doc.expiresAt || "",
        field: doc.field,
        scope: doc.accessScope,
        keywords: doc.keywords.join(", "),
        description: doc.description,
        language: "Tiếng Việt",
        status: doc.effectiveStatus,
      })
  }, [doc])
  if (loading || error) return <KnowledgeUnavailable title="Metadata" loading={loading} error={error} reload={reload} />
  if (!doc) return <AppLayout pageTitle="Metadata"><ApiDataState loading={false} empty><div /></ApiDataState></AppLayout>
  const fields = [
    ["name", "Tên tài liệu"],
    ["code", "Số hiệu"],
    ["type", "Loại tài liệu"],
    ["unit", "Đơn vị ban hành"],
    ["issued", "Ngày ban hành"],
    ["effective", "Ngày bắt đầu hiệu lực"],
    ["expires", "Ngày hết hiệu lực"],
    ["field", "Lĩnh vực nghiệp vụ"],
    ["scope", "Phạm vi truy cập"],
    ["keywords", "Từ khóa"],
    ["description", "Mô tả"],
    ["language", "Ngôn ngữ"],
    ["status", "Trạng thái hiệu lực"],
  ]
  const save = async () => {
    await documentService.save({
      ...doc,
      name: values.name,
      code: values.code,
      description: values.description,
      keywords: values.keywords.split(",").map((v) => v.trim()),
    })
    setSaved(true)
    reload()
    setTimeout(() => setSaved(false), 1600)
  }
  return (
    <DataStateBoundary title="Khai báo Metadata">
      <AppLayout pageTitle="Khai báo Metadata">
        <PageHeader
          title="Metadata tài liệu"
          subtitle={`${doc.code} · Phân biệt giá trị AI và giá trị đang sử dụng`}
          actions={
            <Btn onClick={() => void save()}>
              <Save size={14} /> Lưu thay đổi
            </Btn>
          }
        />
        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2 p-5">
            <div className="grid grid-cols-2 gap-4">
              {fields.map(([key, label]) => (
                <label
                  key={key}
                  className={key === "description" ? "col-span-2" : ""}
                >
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>{label}</span>
                    <span className="text-blue-600 text-[10px]">
                      Đang sử dụng
                    </span>
                  </div>
                  <input
                    value={values[key] || ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [key]: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                  <div className="text-[10px] text-purple-600 mt-1">
                    AI trích xuất: {values[key] || "Chưa xác định"}
                  </div>
                </label>
              ))}
            </div>
            {saved && (
              <div className="mt-4 text-sm text-green-600">
                Đã lưu metadata.
              </div>
            )}
          </Card>
          <Card className="p-4 h-fit">
            <h3 className="font-semibold text-sm">Chú giải dữ liệu</h3>
            <div className="mt-3 space-y-3 text-xs">
              <div className="p-2 bg-purple-50 text-purple-700 rounded">
                AI trích xuất: giá trị hệ thống nhận diện từ file.
              </div>
              <div className="p-2 bg-amber-50 text-amber-700 rounded">
                Đã chỉnh sửa: giá trị Chuyên gia Pháp chế thay đổi.
              </div>
              <div className="p-2 bg-blue-50 text-blue-700 rounded">
                Đang sử dụng: giá trị hiện hành trong hệ thống.
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </DataStateBoundary>
  )
}

export function EffectivenessPage() {
  const { documents, loading, error, reload } = useKnowledgeDocs()
  const [selected, setSelected] = useState<Document>()
  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [replacement, setReplacement] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const submit = async () => {
    if (!selected || !date || !reason || !confirmed) return
    await documentService.save({
      ...selected,
      effectiveStatus: "EXPIRED",
      expiresAt: date,
    })
    setSelected(undefined)
    setConfirmed(false)
    reload()
  }
  if (loading || error) return <KnowledgeUnavailable title="Hiệu lực văn bản" loading={loading} error={error} reload={reload} />
  return (
    <DataStateBoundary title="Hiệu lực văn bản">
      <AppLayout pageTitle="Hiệu lực văn bản">
        <PageHeader
          title="Quản lý hiệu lực văn bản"
          subtitle="Đánh dấu hết hiệu lực và khai báo văn bản thay thế"
        />
        <Card>
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 border-b flex items-center">
              <div className="flex-1">
                <div className="font-medium text-sm">{doc.name}</div>
                <div className="text-xs text-gray-400">
                  {doc.code} · Hiệu lực từ {doc.effectiveAt}
                </div>
              </div>
              <Badge variant={effectiveVariant(doc.effectiveStatus)} />
              <Btn
                className="ml-3"
                variant="outline"
                size="sm"
                onClick={() => setSelected(doc)}
                disabled={doc.effectiveStatus === "EXPIRED"}
              >
                <ShieldOff size={13} /> Hết hiệu lực
              </Btn>
            </div>
          ))}
        </Card>
        <Modal
          open={!!selected}
          onClose={() => setSelected(undefined)}
          title="Xác nhận hết hiệu lực"
          footer={
            <>
              <Btn variant="outline" onClick={() => setSelected(undefined)}>
                Hủy
              </Btn>
              <Btn
                variant="danger"
                disabled={!date || !reason || !confirmed}
                onClick={() => void submit()}
              >
                Xác nhận hết hiệu lực
              </Btn>
            </>
          }
        >
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 mb-4">
            Sau khi hết hiệu lực, văn bản sẽ không còn được ưu tiên khi AI trả
            lời về quy định hiện hành.
          </div>
          <div className="space-y-3">
            <Input
              label="Ngày hết hiệu lực"
              type="date"
              value={date}
              onChange={setDate}
              required
            />
            <Input label="Lý do" value={reason} onChange={setReason} required />
            <Select
              label="Văn bản thay thế"
              value={replacement}
              onChange={setReplacement}
              options={[
                { value: "", label: "Không có" },
                ...documents
                  .filter((d) => d.id !== selected?.id)
                  .map((d) => ({ value: d.id, label: d.code })),
              ]}
            />
            <Input label="Ghi chú" />
            <label className="flex gap-2 text-xs">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />{" "}
              Tôi xác nhận thay đổi hiệu lực văn bản.
            </label>
          </div>
        </Modal>
      </AppLayout>
    </DataStateBoundary>
  )
}

export function KnowledgeRelationsPage() {
  const { documents, loading, error, reload } = useKnowledgeDocs()
  const [relations, setRelations] = useState<Relation[]>([])
  const [source, setSource] = useState("")
  const [target, setTarget] = useState("")
  const [type, setType] = useState<Relation["type"]>("Tham chiếu")
  useEffect(
    () => setRelations(documents.flatMap((d) => d.relations)),
    [documents],
  )
  const add = () => {
    if (!source || !target) return
    setRelations((v) => [
      ...v,
      {
        id: createId(),
        sourceDocument: source,
        targetDocument: target,
        type,
        startDate: new Date().toLocaleDateString("vi-VN"),
      },
    ])
    setSource("")
    setTarget("")
  }
  if (loading || error) return <KnowledgeUnavailable title="Liên kết văn bản" loading={loading} error={error} reload={reload} />
  return (
    <DataStateBoundary title="Liên kết văn bản">
      <AppLayout pageTitle="Liên kết văn bản">
        <PageHeader
          title="Liên kết văn bản"
          subtitle="Văn bản–văn bản, điều khoản–văn bản và điều khoản–điều khoản"
        />
        <div className="grid grid-cols-3 gap-5">
          <Card className="p-5 h-fit">
            <h3 className="font-semibold text-sm mb-4">Tạo liên kết</h3>
            <div className="space-y-3">
              <Select
                label="Văn bản nguồn"
                value={source}
                onChange={setSource}
                options={documents.map((d) => ({
                  value: d.code,
                  label: d.code,
                }))}
              />
              <Input label="Điều khoản nguồn" placeholder="Không bắt buộc" />
              <Select
                label="Loại quan hệ"
                value={type}
                onChange={(v) => setType(v as Relation["type"])}
                options={[
                  "Tham chiếu",
                  "Sửa đổi",
                  "Thay thế",
                  "Thay thế một phần",
                  "Liên quan",
                ].map((value) => ({ value, label: value }))}
              />
              <Select
                label="Văn bản đích"
                value={target}
                onChange={setTarget}
                options={documents.map((d) => ({
                  value: d.code,
                  label: d.code,
                }))}
              />
              <Input label="Điều khoản đích" />
              <Input label="Ngày bắt đầu áp dụng" type="date" />
              <Input label="Ngày kết thúc" type="date" />
              <Input label="Ghi chú" />
              <Btn className="w-full justify-center" onClick={add}>
                <Link2 size={14} /> Tạo liên kết
              </Btn>
            </div>
          </Card>
          <Card className="col-span-2">
            <div className="p-4 border-b font-semibold text-sm">
              Quan hệ hiện có
            </div>
            {relations.map((relation) => (
              <div
                key={relation.id}
                className="p-4 border-b flex items-center gap-3"
              >
                <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                  <div className="bg-gray-50 rounded p-3 font-mono">
                    {relation.sourceDocument}
                    <br />
                    {relation.sourceClause}
                  </div>
                  <Badge variant="approved" label={relation.type} />
                  <div className="bg-gray-50 rounded p-3 font-mono">
                    {relation.targetDocument}
                    <br />
                    {relation.targetClause}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setRelations((v) => v.filter((r) => r.id !== relation.id))
                  }
                  className="text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </Card>
        </div>
      </AppLayout>
    </DataStateBoundary>
  )
}

export function ReindexPage() {
  const { documents, loading, error, reload } = useKnowledgeDocs()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState("")
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const start = async () => {
    if (!selected.size || !reason) return
    setRunning(true)
    await knowledgeService.reindex([...selected], reason)
    for (const value of [15, 35, 60, 80, 100]) {
      await new Promise((resolve) => setTimeout(resolve, 220))
      setProgress(value)
    }
    reload()
  }
  if (loading || error) return <KnowledgeUnavailable title="Re-index tài liệu" loading={loading} error={error} reload={reload} />
  return (
    <DataStateBoundary title="Re-index tài liệu">
      <AppLayout pageTitle="Re-index tài liệu">
        <PageHeader
          title="Re-index tài liệu"
          subtitle="Chọn một hoặc nhiều tài liệu để chạy lại pipeline"
          actions={
            <Btn disabled={!selected.size} onClick={() => setRunning(true)}>
              <RefreshCw size={14} /> Re-index ({selected.size})
            </Btn>
          }
        />
        <Card>
          <div className="p-4 border-b">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={selected.size === documents.length}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? new Set(documents.map((d) => d.id))
                      : new Set(),
                  )
                }
              />{" "}
              Chọn tất cả tài liệu
            </label>
          </div>
          {documents.map((doc) => (
            <label
              key={doc.id}
              className="p-4 border-b flex items-center gap-3"
            >
              <input
                type="checkbox"
                checked={selected.has(doc.id)}
                onChange={(e) =>
                  setSelected((current) => {
                    const next = new Set(current)
                    e.target.checked ? next.add(doc.id) : next.delete(doc.id)
                    return next
                  })
                }
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{doc.name}</div>
                <div className="text-xs text-gray-400">
                  {doc.code} · Index hiện tại: v2.4 · {doc.indexStatus}
                </div>
              </div>
              <Badge
                variant={
                  doc.indexStatus === "REINDEX_REQUIRED"
                    ? "warning"
                    : "completed"
                }
                label={doc.indexStatus}
              />
            </label>
          ))}
        </Card>
        <Modal
          open={running}
          onClose={() => {
            if (progress === 100) setRunning(false)
          }}
          title="Tiến trình re-index"
          footer={
            progress === 100 ? (
              <Btn onClick={() => setRunning(false)}>Đóng</Btn>
            ) : (
              <Btn
                disabled={!reason || progress > 0}
                onClick={() => void start()}
              >
                Bắt đầu
              </Btn>
            )
          }
        >
          <div className="text-xs mb-3">
            {selected.size} tài liệu · Chạy lại Parse → Chunking → Embedding →
            Index
          </div>
          <Input
            label="Lý do re-index"
            required
            value={reason}
            onChange={setReason}
          />
          <div className="mt-4">
            <div className="flex justify-between text-xs">
              <span>{progress ? "PROCESSING" : "QUEUED"}</span>
              <b>{progress}%</b>
            </div>
            <div className="h-2 bg-gray-200 rounded mt-2 overflow-hidden">
              <div
                className="h-full bg-[#C8102E] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <div className="text-green-600 text-xs mt-2">
                COMPLETED · Hoàn thành lúc{" "}
                {new Date().toLocaleTimeString("vi-VN")}
              </div>
            )}
          </div>
        </Modal>
      </AppLayout>
    </DataStateBoundary>
  )
}

export function KnowledgeHistoryPage() {
  return (
    <DataStateBoundary title="Lịch sử thao tác">
      <AppLayout pageTitle="Lịch sử thao tác">
        <PageHeader
          title="Lịch sử thao tác"
          subtitle="Theo dõi thay đổi dữ liệu kho tri thức"
        />
        <Card>
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Thời gian",
                  "Người thực hiện",
                  "Hành động",
                  "Tài liệu",
                  "Kết quả",
                ].map((item) => (
                  <th key={item} className="text-left p-3">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                "UPLOAD_DOCUMENT",
                "UPDATE_METADATA",
                "CREATE_RELATION",
                "REINDEX_DOCUMENT",
                "EXPIRE_DOCUMENT",
              ].map((action, index) => (
                <tr key={action} className="border-t">
                  <td className="p-3 font-mono">17/01/2024 {10 + index}:20</td>
                  <td className="p-3">Lê Thu Hà</td>
                  <td className="p-3 font-mono">{action}</td>
                  <td className="p-3">VB-SHB-00{index + 1}/2024</td>
                  <td className="p-3">
                    <Badge variant="completed" label="Thành công" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </AppLayout>
    </DataStateBoundary>
  )
}
