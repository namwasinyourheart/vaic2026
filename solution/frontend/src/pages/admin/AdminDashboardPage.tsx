import AppLayout from '../../layouts/AppLayout'
import { StatCard, Card, Avatar } from '../../components/shared'

const RECENT_USERS = [
  { name: 'Nguyễn Thị Thu', role: 'Bank Employee', dept: 'Ban Tín dụng', date: '17/01/2024' },
  { name: 'Trần Văn Phúc', role: 'Customer', dept: '—', date: '16/01/2024' },
  { name: 'Lê Minh Đức', role: 'Bank Employee', dept: 'Ban Nguồn vốn', date: '15/01/2024' },
]

const RECENT_ADMIN_ACTIONS = [
  { actor: 'Admin Hệ thống', action: 'Tạo tài khoản mới', target: 'Nguyễn Thị Thu', time: '17/01 09:45' },
  { actor: 'Admin Hệ thống', action: 'Khóa tài khoản', target: 'Bùi Thanh Tú', time: '16/01 14:22' },
  { actor: 'Admin Hệ thống', action: 'Gán role Bank Employee', target: 'Trần Văn Phúc', time: '16/01 10:10' },
  { actor: 'Admin Hệ thống', action: 'Cập nhật quyền truy cập', target: 'Role: Nhân viên', time: '15/01 16:05' },
]

const SYSTEM_ALERTS = [
  { type: 'error', msg: 'Lỗi kết nối vector DB lúc 03:45', time: '17/01 03:45' },
  { type: 'warning', msg: 'Tải hệ thống cao (85%) trong giờ cao điểm', time: '17/01 08:00' },
  { type: 'info', msg: 'Backup dữ liệu hoàn tất thành công', time: '17/01 02:00' },
]

export default function AdminDashboardPage() {
  return (
    <AppLayout role="admin" pageTitle="Tổng quan hệ thống">
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Tổng người dùng" value="342" sub="↑ 5 tuần này" color="blue" />
        <StatCard label="Đang hoạt động" value="287" sub="83% online" color="green" />
        <StatCard label="Tài khoản bị khóa" value="8" sub="3 chờ xem xét" color="red" />
        <StatCard label="Lỗi hệ thống hôm nay" value="2" sub="↓ so với hôm qua" color="amber" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <StatCard label="Bank Employee" value="124" color="gray" />
        <StatCard label="Customer" value="215" color="gray" />
        <StatCard label="Thao tác hệ thống / ngày" value="1,247" sub="↑ 12% vs tuần trước" color="purple" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <div className="px-4 py-3 border-b border-[#DDE1E9]">
            <h2 className="text-sm font-semibold text-gray-900">Người dùng mới</h2>
          </div>
          <div className="divide-y divide-[#DDE1E9]">
            {RECENT_USERS.map((u, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Avatar name={u.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800">{u.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{u.role} · {u.dept}</div>
                </div>
                <div className="text-[10px] text-gray-400 font-mono flex-shrink-0">{u.date}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-[#DDE1E9]">
            <h2 className="text-sm font-semibold text-gray-900">Hoạt động quản trị</h2>
          </div>
          <div className="divide-y divide-[#DDE1E9]">
            {RECENT_ADMIN_ACTIONS.map((a, i) => (
              <div key={i} className="px-4 py-3">
                <div className="text-xs font-medium text-gray-800">{a.action}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">→ {a.target}</div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{a.actor} · {a.time}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-[#DDE1E9]">
            <h2 className="text-sm font-semibold text-gray-900">Cảnh báo hệ thống</h2>
          </div>
          <div className="divide-y divide-[#DDE1E9]">
            {SYSTEM_ALERTS.map((a, i) => (
              <div key={i} className="px-4 py-3 flex gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${a.type === 'error' ? 'bg-red-500' : a.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                <div>
                  <div className="text-xs text-gray-700">{a.msg}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
