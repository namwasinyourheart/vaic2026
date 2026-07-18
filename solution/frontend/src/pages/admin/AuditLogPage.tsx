import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { Card, SearchBox, Btn, PageHeader, Modal } from '../../components/shared'

const LOGS = [
  { id: 'L-0001', time: '17/01/2024 09:45:12', actor: 'Admin Hệ thống', role: 'Admin', action: 'CREATE_USER', target: 'user:nguyen.thi.thu', result: 'success', ip: '192.168.1.100' },
  { id: 'L-0002', time: '17/01/2024 09:32:05', actor: 'Nguyễn Thị Mai', role: 'Customer', action: 'CHATBOT_QUERY', target: 'session:cust-2024-001', result: 'success', ip: '103.21.45.78' },
  { id: 'L-0003', time: '17/01/2024 09:30:01', actor: 'Nguyễn Văn An', role: 'Nhân viên Nghiệp vụ', action: 'UPLOAD_DOCUMENT', target: 'doc:QĐ-SHB-2024/01', result: 'success', ip: '192.168.1.45' },
  { id: 'L-0004', time: '16/01/2024 14:22:38', actor: 'Admin Hệ thống', role: 'Admin', action: 'LOCK_USER', target: 'user:bui.thanh.tu', result: 'success', ip: '192.168.1.100' },
  { id: 'L-0005', time: '16/01/2024 14:20:15', actor: 'Trần Thị Bình', role: 'Nhân viên Nghiệp vụ', action: 'APPROVE_METADATA', target: 'doc:QĐ-SHB-2023/18', result: 'success', ip: '192.168.1.52' },
  { id: 'L-0006', time: '16/01/2024 13:44:07', actor: 'Bùi Thanh Tú', role: 'Customer', action: 'LOGIN', target: 'auth', result: 'failed', ip: '1.53.201.88' },
  { id: 'L-0007', time: '16/01/2024 13:44:02', actor: 'Bùi Thanh Tú', role: 'Customer', action: 'LOGIN', target: 'auth', result: 'failed', ip: '1.53.201.88' },
  { id: 'L-0008', time: '16/01/2024 10:10:44', actor: 'Admin Hệ thống', role: 'Admin', action: 'ASSIGN_ROLE', target: 'user:tran.van.phuc', result: 'success', ip: '192.168.1.100' },
  { id: 'L-0009', time: '15/01/2024 16:05:30', actor: 'Admin Hệ thống', role: 'Admin', action: 'UPDATE_PERMISSIONS', target: 'role:ROLE_STAFF', result: 'success', ip: '192.168.1.100' },
  { id: 'L-0010', time: '15/01/2024 11:23:18', actor: 'Lê Minh Cường', role: 'Nhân viên Nghiệp vụ', action: 'REJECT_CLAUSE', target: 'clause:QC-CVTD-2023/Điều12', result: 'success', ip: '192.168.1.67' },
]

const ACTION_COLOR: Record<string, string> = {
  CREATE_USER: 'bg-green-50 text-green-700',
  LOCK_USER: 'bg-red-50 text-red-700',
  ASSIGN_ROLE: 'bg-purple-50 text-purple-700',
  UPDATE_PERMISSIONS: 'bg-purple-50 text-purple-700',
  UPLOAD_DOCUMENT: 'bg-blue-50 text-blue-700',
  APPROVE_METADATA: 'bg-green-50 text-green-700',
  REJECT_CLAUSE: 'bg-orange-50 text-orange-700',
  CHATBOT_QUERY: 'bg-gray-100 text-gray-600',
  LOGIN: 'bg-gray-100 text-gray-600',
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [detailLog, setDetailLog] = useState<typeof LOGS[0] | null>(null)

  const filtered = LOGS.filter(l =>
    l.actor.toLowerCase().includes(search.toLowerCase())
    || l.action.toLowerCase().includes(search.toLowerCase())
    || l.target.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout role="admin" pageTitle="Nhật ký hệ thống">
      <PageHeader
        title="Nhật ký hệ thống"
        subtitle="Theo dõi toàn bộ hoạt động trong hệ thống"
        actions={
          <Btn variant="outline" size="sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất CSV
          </Btn>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm kiếm nhật ký..." />
        {[
          { label: 'Tất cả vai trò', opts: ['Admin', 'Nhân viên Nghiệp vụ', 'Customer'] },
          { label: 'Tất cả hành động', opts: ['CREATE_USER', 'LOCK_USER', 'UPLOAD_DOCUMENT', 'APPROVE_METADATA', 'LOGIN'] },
          { label: 'Tất cả kết quả', opts: ['success', 'failed'] },
        ].map(f => (
          <select key={f.label} className="px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none cursor-pointer">
            <option>{f.label}</option>
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <div className="flex gap-1">
          <input type="date" className="px-2 py-2 text-xs border border-[#DDE1E9] rounded bg-white focus:outline-none" defaultValue="2024-01-17" />
          <span className="text-gray-400 flex items-center text-xs">→</span>
          <input type="date" className="px-2 py-2 text-xs border border-[#DDE1E9] rounded bg-white focus:outline-none" defaultValue="2024-01-17" />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#DDE1E9] bg-[#F8FAFC]">
                {['Thời gian', 'Người thực hiện', 'Vai trò', 'Hành động', 'Đối tượng', 'Kết quả', 'IP', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-[#DDE1E9] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{log.time}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-800">{log.actor}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      log.role === 'Admin' ? 'bg-purple-100 text-purple-700'
                      : log.role === 'Nhân viên Nghiệp vụ' ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>{log.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${ACTION_COLOR[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 max-w-40 truncate">{log.target}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${log.result === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {log.result === 'success' ? '✓ Success' : '✗ Failed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ip}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailLog(log)}
                      className="text-xs text-[#C8102E] hover:underline cursor-pointer"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!detailLog}
        onClose={() => setDetailLog(null)}
        title={`Chi tiết nhật ký ${detailLog?.id}`}
        size="md"
        footer={<Btn variant="outline" size="sm" onClick={() => setDetailLog(null)}>Đóng</Btn>}
      >
        {detailLog && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Người thực hiện', value: detailLog.actor },
                { label: 'Vai trò', value: detailLog.role },
                { label: 'Thời gian', value: detailLog.time },
                { label: 'Địa chỉ IP', value: detailLog.ip },
                { label: 'Loại hành động', value: detailLog.action },
                { label: 'Kết quả', value: detailLog.result },
                { label: 'Đối tượng bị tác động', value: detailLog.target },
              ].map(row => (
                <div key={row.label}>
                  <div className="text-xs text-gray-500">{row.label}</div>
                  <div className="text-sm font-medium text-gray-800 font-mono">{row.value}</div>
                </div>
              ))}
            </div>
            {detailLog.action === 'LOCK_USER' && (
              <>
                <div className="border-t border-[#DDE1E9] pt-3">
                  <div className="text-xs text-gray-500 mb-1">Dữ liệu trước thay đổi</div>
                  <pre className="text-xs bg-gray-50 border border-[#DDE1E9] rounded p-2 font-mono overflow-x-auto">{'{ "status": "active" }'}</pre>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Dữ liệu sau thay đổi</div>
                  <pre className="text-xs bg-gray-50 border border-[#DDE1E9] rounded p-2 font-mono overflow-x-auto">{'{ "status": "locked", "lockedAt": "2024-01-16T14:22:38Z" }'}</pre>
                </div>
              </>
            )}
            <div className="bg-gray-50 border border-[#DDE1E9] rounded p-2 text-xs font-mono text-gray-500">
              Request ID: {detailLog.id}-{Date.now().toString(36).toUpperCase()}
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
