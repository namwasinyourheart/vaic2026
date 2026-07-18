import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout'
import { Card, Badge, Btn, SearchBox, Table, Avatar, Modal, Input, Select, PageHeader } from '../../components/shared'

const USERS = [
  { id: '1', name: 'Nguyễn Văn An', email: 'an.nv@shb.vn', role: 'Bank Employee', dept: 'Ban Tín dụng', status: 'active', created: '01/01/2024', lastLogin: '17/01/2024 09:30' },
  { id: '2', name: 'Trần Thị Bình', email: 'binh.tt@shb.vn', role: 'Bank Employee', dept: 'Ban Nguồn vốn', status: 'active', created: '15/11/2023', lastLogin: '17/01/2024 08:15' },
  { id: '3', name: 'Lê Minh Cường', email: 'cuong.lm@shb.vn', role: 'Bank Employee', dept: 'Ban Tuân thủ', status: 'active', created: '10/09/2023', lastLogin: '16/01/2024 17:45' },
  { id: '4', name: 'Phạm Thu Hà', email: 'ha.pt@shb.vn', role: 'Bank Employee', dept: 'Ban Thẻ', status: 'active', created: '05/06/2023', lastLogin: '17/01/2024 09:55' },
  { id: '5', name: 'Đỗ Quang Minh', email: 'minh.dq@shb.vn', role: 'Bank Employee', dept: 'Ban Dịch vụ', status: 'locked', created: '20/04/2023', lastLogin: '10/01/2024 14:30' },
  { id: '6', name: 'Vũ Thị Lan', email: 'lan.vt@shb.vn', role: 'Bank Employee', dept: 'Ban Pháp chế', status: 'active', created: '01/03/2023', lastLogin: '17/01/2024 07:50' },
  { id: '7', name: 'Nguyễn Thị Mai', email: 'mai.nt@gmail.com', role: 'Customer', dept: '—', status: 'active', created: '12/01/2024', lastLogin: '17/01/2024 09:32' },
  { id: '8', name: 'Bùi Thanh Tú', email: 'tu.bt@gmail.com', role: 'Customer', dept: '—', status: 'locked', created: '05/01/2024', lastLogin: '09/01/2024 10:00' },
]

type UserStatus = 'active' | 'locked'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [lockConfirm, setLockConfirm] = useState<typeof USERS[0] | null>(null)

  const filtered = USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    const matchStatus = !statusFilter || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  return (
    <AppLayout role="admin" pageTitle="Người dùng">
      <PageHeader
        title="Danh sách người dùng"
        subtitle={`${filtered.length} người dùng`}
        actions={
          <Btn variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo người dùng
          </Btn>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc email..." />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none cursor-pointer">
          <option value="">Tất cả vai trò</option>
          <option>Bank Employee</option>
          <option>Customer</option>
          <option>Admin</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-[#DDE1E9] rounded bg-white focus:outline-none cursor-pointer">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'name', label: 'Họ tên' },
            { key: 'email', label: 'Email / Tên đăng nhập' },
            { key: 'role', label: 'Vai trò', width: '130px' },
            { key: 'dept', label: 'Phòng ban', width: '150px' },
            { key: 'status', label: 'Trạng thái', width: '120px' },
            { key: 'created', label: 'Ngày tạo', width: '100px' },
            { key: 'lastLogin', label: 'Đăng nhập gần nhất', width: '160px' },
            { key: 'actions', label: '', width: '120px' },
          ]}
          rows={filtered.map(u => ({
            name: (
              <div className="flex items-center gap-2">
                <Avatar name={u.name} size="sm" />
                <span className="text-sm font-medium text-gray-800">{u.name}</span>
              </div>
            ),
            email: <span className="text-xs text-gray-500 font-mono">{u.email}</span>,
            role: (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                u.role === 'Admin' ? 'bg-purple-100 text-purple-700'
                : u.role === 'Bank Employee' ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
              }`}>{u.role}</span>
            ),
            dept: <span className="text-xs text-gray-600">{u.dept}</span>,
            status: <Badge variant={u.status as UserStatus} />,
            created: <span className="text-xs font-mono text-gray-500">{u.created}</span>,
            lastLogin: <span className="text-xs font-mono text-gray-500">{u.lastLogin}</span>,
            actions: (
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 cursor-pointer" title="Chỉnh sửa">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setLockConfirm(u)}
                  className={`p-1.5 rounded cursor-pointer transition-colors ${
                    u.status === 'active'
                      ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                      : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                  }`}
                  title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                >
                  {u.status === 'active'
                    ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                  }
                </button>
              </div>
            ),
          }))}
        />
      </Card>

      {/* Create user modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo người dùng mới"
        size="md"
        footer={
          <>
            <Btn variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Hủy</Btn>
            <Btn variant="secondary" size="sm">Lưu và kích hoạt</Btn>
            <Btn variant="primary" size="sm">Lưu</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Họ tên" placeholder="Nguyễn Văn A" required />
            <Input label="Email (không bắt buộc)" type="email" placeholder="email@shb.vn" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Vai trò" placeholder="Chọn vai trò" options={[
              { value: 'employee', label: 'Bank Employee' },
              { value: 'customer', label: 'Customer' },
              { value: 'admin', label: 'Admin' },
            ]} />
            <Input label="Phòng ban" placeholder="Ban Tín dụng" />
          </div>
          <Select label="Trạng thái" placeholder="Chọn trạng thái" options={[
            { value: 'active', label: 'Kích hoạt' },
            { value: 'locked', label: 'Tạm khóa' },
          ]} />
          <Input label="Ghi chú" placeholder="Ghi chú về tài khoản..." />
        </div>
      </Modal>

      {/* Lock/unlock confirm */}
      <Modal
        open={!!lockConfirm}
        onClose={() => setLockConfirm(null)}
        title={lockConfirm?.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        size="sm"
        footer={
          <>
            <Btn variant="outline" size="sm" onClick={() => setLockConfirm(null)}>Hủy</Btn>
            <Btn variant={lockConfirm?.status === 'active' ? 'danger' : 'primary'} size="sm" onClick={() => setLockConfirm(null)}>
              {lockConfirm?.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
            </Btn>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          {lockConfirm?.status === 'active'
            ? `Khóa tài khoản của ${lockConfirm?.name}? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.`
            : `Mở khóa tài khoản của ${lockConfirm?.name}?`}
        </p>
      </Modal>
    </AppLayout>
  )
}
