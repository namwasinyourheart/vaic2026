import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { Card, Btn, Input, Select } from '../../components/shared'

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { n: 1, label: 'Chọn file' },
  { n: 2, label: 'Thông tin ban đầu' },
  { n: 3, label: 'Xác nhận' },
  { n: 4, label: 'Theo dõi xử lý' },
]

const PROCESSING_STEPS = [
  { key: 'upload', label: 'Upload file', status: 'done', time: '09:30:01' },
  { key: 'parse', label: 'Parse tài liệu', status: 'done', time: '09:30:05' },
  { key: 'metadata', label: 'Trích xuất metadata', status: 'done', time: '09:30:12' },
  { key: 'clauses', label: 'Trích xuất điều khoản', status: 'running', time: '09:30:18' },
  { key: 'relations', label: 'Phát hiện quan hệ', status: 'waiting', time: '' },
  { key: 'conflicts', label: 'Phát hiện mâu thuẫn', status: 'waiting', time: '' },
  { key: 'review', label: 'Chờ duyệt', status: 'waiting', time: '' },
]

export default function UploadPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [form, setForm] = useState({
    name: '', type: '', field: '', scope: '', notes: '', reviewer: '',
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); if (!form.name) setForm(p => ({ ...p, name: f.name.replace(/\.[^.]+$/, '') })) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); if (!form.name) setForm(p => ({ ...p, name: f.name.replace(/\.[^.]+$/, '') })) }
  }

  const StepIndicator = () => (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              step > s.n ? 'bg-green-500 border-green-500 text-white'
              : step === s.n ? 'bg-[#C8102E] border-[#C8102E] text-white'
              : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {step > s.n
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                : s.n
              }
            </div>
            <div className={`text-[10px] mt-1 font-medium ${step === s.n ? 'text-[#C8102E]' : 'text-gray-400'}`}>{s.label}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-20 mx-2 mb-4 ${step > s.n ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <AppLayout role="employee" pageTitle="Upload tài liệu">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/employee/documents')} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Tài liệu
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-800">Upload tài liệu</span>
        </div>

        <StepIndicator />

        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Chọn file tài liệu</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                dragging ? 'border-[#C8102E] bg-[#FFF1F3]' : 'border-gray-300 hover:border-[#C8102E]/50 hover:bg-gray-50'
              }`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {file ? (
                <div>
                  <div className="text-sm font-semibold text-gray-800">{file.name}</div>
                  <div className="text-xs text-gray-400 font-mono mt-1">{(file.size / 1024).toFixed(1)} KB · {file.name.split('.').pop()?.toUpperCase()}</div>
                  <Btn variant="outline" size="sm" className="mt-3" onClick={() => setFile(null)}>Xóa file</Btn>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-600">Kéo thả file vào đây hoặc</div>
                  <div className="text-sm text-[#C8102E] font-medium mt-1">nhấn để chọn file</div>
                  <div className="text-xs text-gray-400 mt-2">Hỗ trợ: PDF, DOCX, DOC · Tối đa 50MB</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={handleFileSelect} />
            <div className="flex justify-end mt-5">
              <Btn variant="primary" size="md" onClick={() => setStep(2)} disabled={!file}>Tiếp theo</Btn>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Thông tin ban đầu</h2>
            <div className="space-y-4">
              <Input label="Tên tài liệu" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required placeholder="Nhập tên tài liệu" />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Loại tài liệu"
                  value={form.type}
                  onChange={v => setForm(p => ({ ...p, type: v }))}
                  placeholder="Chọn loại tài liệu"
                  options={[
                    { value: 'decision', label: 'Quyết định' },
                    { value: 'circular', label: 'Thông tư' },
                    { value: 'regulation', label: 'Quy chế' },
                    { value: 'resolution', label: 'Nghị quyết' },
                    { value: 'guide', label: 'Hướng dẫn' },
                    { value: 'notice', label: 'Thông báo' },
                  ]}
                />
                <Select
                  label="Lĩnh vực nghiệp vụ"
                  value={form.field}
                  onChange={v => setForm(p => ({ ...p, field: v }))}
                  placeholder="Chọn lĩnh vực"
                  options={[
                    { value: 'credit', label: 'Tín dụng' },
                    { value: 'deposit', label: 'Huy động vốn' },
                    { value: 'card', label: 'Thẻ' },
                    { value: 'forex', label: 'Ngoại hối' },
                    { value: 'risk', label: 'Quản lý rủi ro' },
                  ]}
                />
              </div>
              <Select
                label="Phạm vi truy cập"
                value={form.scope}
                onChange={v => setForm(p => ({ ...p, scope: v }))}
                placeholder="Chọn phạm vi"
                options={[
                  { value: 'internal', label: 'Nội bộ (Nhân viên)' },
                  { value: 'public', label: 'Công khai (Khách hàng)' },
                  { value: 'restricted', label: 'Hạn chế (Ban lãnh đạo)' },
                ]}
              />
              <Input label="Người chịu trách nhiệm duyệt" value={form.reviewer} onChange={v => setForm(p => ({ ...p, reviewer: v }))} placeholder="Nhập tên hoặc email người duyệt" />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Ghi chú thêm về tài liệu (không bắt buộc)"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex justify-between mt-5">
              <Btn variant="outline" size="md" onClick={() => setStep(1)}>Quay lại</Btn>
              <Btn variant="primary" size="md" onClick={() => setStep(3)}>Tiếp theo</Btn>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Xác nhận upload</h2>
            <div className="bg-[#F8FAFC] rounded-lg border border-[#DDE1E9] p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-[#DDE1E9]">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#C8102E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{file?.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{file ? (file.size / 1024).toFixed(1) + ' KB' : ''}</div>
                </div>
              </div>
              {[
                { label: 'Tên tài liệu', value: form.name || '—' },
                { label: 'Loại tài liệu', value: form.type || '—' },
                { label: 'Lĩnh vực nghiệp vụ', value: form.field || '—' },
                { label: 'Phạm vi truy cập', value: form.scope || '—' },
                { label: 'Người duyệt', value: form.reviewer || '—' },
              ].map(row => (
                <div key={row.label} className="flex gap-2 text-sm">
                  <span className="text-gray-500 w-36 flex-shrink-0">{row.label}:</span>
                  <span className="text-gray-800 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-5">
              <Btn variant="outline" size="md" onClick={() => setStep(2)}>Quay lại</Btn>
              <Btn variant="primary" size="md" onClick={() => setStep(4)}>Xác nhận upload</Btn>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Đang xử lý tài liệu</h2>
            <p className="text-sm text-gray-500 mb-6">Hệ thống đang tự động phân tích và trích xuất nội dung</p>
            <div className="space-y-0">
              {PROCESSING_STEPS.map((s, i) => (
                <div key={s.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      s.status === 'done' ? 'bg-green-500' : s.status === 'running' ? 'bg-[#C8102E]' : 'bg-gray-200'
                    }`}>
                      {s.status === 'done' ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : s.status === 'running' ? (
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    {i < PROCESSING_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 my-0.5 ${s.status === 'done' ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <div className={`text-sm font-medium ${s.status === 'waiting' ? 'text-gray-400' : 'text-gray-800'}`}>
                      {s.label}
                    </div>
                    {s.time && <div className="text-[10px] text-gray-400 font-mono mt-0.5">{s.status === 'done' ? 'Hoàn tất' : 'Đang xử lý...'} · {s.time}</div>}
                    {s.status === 'running' && (
                      <div className="mt-1.5 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C8102E] rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Btn variant="outline" size="sm" onClick={() => navigate('/employee/documents')}>Quay lại danh sách</Btn>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
