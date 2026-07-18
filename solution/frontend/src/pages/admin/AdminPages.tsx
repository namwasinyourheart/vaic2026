import { useEffect, useState } from "react"
import {
  Download,
  Edit3,
  KeyRound,
  Lock,
  Plus,
  Search,
  Shield,
  Unlock,
} from "lucide-react"
import type { Role, User } from "../../domain"
import { ROLE_LABELS } from "../../domain"
import { adminService } from "../../services/api"
import AppLayout from "../../layouts/AppLayout"
import {
  ApiDataState,
  Badge,
  Btn,
  Card,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
} from "../../components/shared"
import { DemoStateBoundary } from "../SystemPages"
import { createId } from "../../utils/id"

export function AdminDashboard() {
  return (
    <DemoStateBoundary title="Tổng quan hệ thống">
      <AppLayout pageTitle="Tổng quan hệ thống">
        <PageHeader
          title="Tổng quan hệ thống"
          subtitle="Theo dõi người dùng, request và hoạt động quản trị"
        />
        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatCard label="Tổng người dùng" value="342" color="blue" />
          <StatCard label="Đang hoạt động" value="287" color="green" />
          <StatCard label="Request hôm nay" value="1,247" color="purple" />
          <StatCard label="Lỗi hệ thống" value="2" color="red" />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatCard label="Khách hàng" value="215" color="gray" />
          <StatCard label="Nhân viên Nghiệp vụ" value="124" color="gray" />
          <StatCard label="Chuyên gia Pháp chế" value="8" color="gray" />
          <StatCard label="Tài khoản bị khóa" value="8" color="amber" />
        </div>
        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2">
            <div className="p-4 border-b font-semibold text-sm">
              Hoạt động quản trị gần đây
            </div>
            {[
              "Tạo người dùng mới · Nguyễn Minh Anh",
              "Khóa tài khoản · Bùi Thanh Tú",
              "Cập nhật ma trận quyền · Quản trị hệ thống",
              "Xuất nhật ký audit · Admin Hệ thống",
            ].map((item, index) => (
              <div
                key={item}
                className="p-4 border-b text-xs flex justify-between"
              >
                <span>{item}</span>
                <span className="text-gray-400">{index + 1} giờ trước</span>
              </div>
            ))}
          </Card>
          <Card>
            <div className="p-4 border-b font-semibold text-sm">
              Cảnh báo hệ thống
            </div>
            {[
              "2 request API thất bại",
              "3 tài liệu cần re-index",
              "Backup dữ liệu hoàn tất",
            ].map((item) => (
              <div key={item} className="p-4 border-b text-xs">
                {item}
              </div>
            ))}
          </Card>
        </div>
      </AppLayout>
    </DemoStateBoundary>
  )
}

const roles: Role[] = [
  "customer",
  "staff",
  "compliance_officer",
  "system_admin",
]
export function AdminUsers() {
  const [users, setUsers] = useState<Omit<User, "password">[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [editing, setEditing] = useState<Omit<User, "password"> | null>(null)
  const [create, setCreate] = useState(false)
  const load = async () => {
    setLoading(true)
    setError("")
    try {
      setUsers(await adminService.users())
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "API người dùng không phản hồi.",
      )
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])
  const filtered = users.filter(
    (user) =>
      (!query ||
        `${user.name} ${user.email} ${user.username}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!role || user.role === role) &&
      (!status || user.status === status),
  )
  const save = async (value: Omit<User, "password">) => {
    try {
      const saved = await adminService.saveUser({
        ...value,
        password: "password",
      })
      await load()
      setEditing(null)
      setCreate(false)
      return saved
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể lưu người dùng.",
      )
      return undefined
    }
  }
  const toggle = (user: Omit<User, "password">) =>
    void save({
      ...user,
      status: user.status === "active" ? "locked" : "active",
    })
  const resetPassword = async (user: Omit<User, "password">) => {
    if (!window.confirm(`Đặt lại mật khẩu của ${user.username} về vaic@2026?`)) return
    try {
      await adminService.resetUserPassword(user.id)
      setError("")
      window.alert("Đã reset mật khẩu về vaic@2026.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể reset mật khẩu.")
    }
  }
  const subtitle = loading
    ? "Đang tải danh sách người dùng…"
    : error
      ? "Chưa xác định được số người dùng"
      : `${filtered.length} người dùng`
  return (
    <DemoStateBoundary title="Người dùng">
      <AppLayout pageTitle="Người dùng">
        <PageHeader
          title="Quản lý người dùng"
          subtitle={subtitle}
          actions={
            <Btn disabled={loading || !!error} onClick={() => setCreate(true)}>
              <Plus size={14} /> Tạo người dùng
            </Btn>
          }
        />
        {!loading && !error && (
          <Card className="p-4 mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm tên, username hoặc email..."
                  className="w-full border rounded pl-9 py-2 text-xs"
                />
              </div>
              <Select
                value={role}
                onChange={setRole}
                options={[
                  { value: "", label: "Tất cả vai trò" },
                  ...roles.map((value) => ({
                    value,
                    label: ROLE_LABELS[value],
                  })),
                ]}
              />
              <Select
                value={status}
                onChange={setStatus}
                options={[
                  { value: "", label: "Tất cả trạng thái" },
                  { value: "active", label: "Đang hoạt động" },
                  { value: "locked", label: "Bị khóa" },
                ]}
              />
            </div>
          </Card>
        )}
        <ApiDataState
          loading={loading}
          error={error}
          onRetry={() => void load()}
          empty={!loading && !error && filtered.length === 0}
          emptyTitle={
            users.length
              ? "Không có người dùng phù hợp bộ lọc"
              : "Chưa có người dùng"
          }
        >
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Họ tên",
                      "Username",
                      "Email",
                      "Vai trò",
                      "Trạng thái",
                      "Ngày tạo",
                      "Đăng nhập cuối",
                      "Thao tác",
                    ].map((item) => (
                      <th key={item} className="text-left p-3">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="p-3 font-medium">{user.name}</td>
                      <td className="p-3 font-mono">{user.username}</td>
                      <td className="p-3">{user.email || "—"}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            user.role === "system_admin" ? "info" : "active"
                          }
                          label={ROLE_LABELS[user.role]}
                        />
                      </td>
                      <td className="p-3">
                        <Badge variant={user.status} />
                      </td>
                      <td className="p-3">{user.createdAt || "—"}</td>
                      <td className="p-3">{user.lastLogin || "—"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditing(user)}
                            className="p-1.5 hover:bg-gray-100"
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => void resetPassword(user)}
                            className="p-1.5 hover:bg-gray-100"
                            title="Reset mật khẩu"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => toggle(user)}
                            className="p-1.5 hover:bg-gray-100"
                            title={
                              user.status === "active" ? "Khóa" : "Mở khóa"
                            }
                          >
                            {user.status === "active" ? (
                              <Lock size={14} />
                            ) : (
                              <Unlock size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </ApiDataState>
        <UserModal
          user={editing}
          create={create}
          onClose={() => {
            setEditing(null)
            setCreate(false)
          }}
          onSave={(value) => void save(value)}
        />
      </AppLayout>
    </DemoStateBoundary>
  )
}

function UserModal({
  user,
  create,
  onClose,
  onSave,
}: {
  user: Omit<User, "password"> | null
  create: boolean
  onClose: () => void
  onSave: (user: Omit<User, "password">) => void
}) {
  const [value, setValue] = useState<Omit<User, "password">>(
    () =>
      user || {
        id: createId(),
        username: "",
        name: "",
        email: "",
        role: "customer",
        status: "active",
        createdAt: new Date().toLocaleDateString("vi-VN"),
      },
  )
  useEffect(() => {
    if (user) setValue(user)
  }, [user])
  const open = create || !!user
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={create ? "Tạo người dùng mới" : "Chỉnh sửa người dùng"}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Hủy
          </Btn>
          <Btn
            disabled={!value.name || !value.username}
            onClick={() => onSave(value)}
          >
            Lưu
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="Họ tên"
          required
          value={value.name}
          onChange={(name) => setValue((v) => ({ ...v, name }))}
        />
        <Input
          label="Username"
          required
          value={value.username}
          onChange={(username) => setValue((v) => ({ ...v, username }))}
        />
        <Input
          label="Email (không bắt buộc)"
          type="email"
          value={value.email}
          onChange={(email) => setValue((v) => ({ ...v, email }))}
        />
        <Select
          label="Vai trò"
          value={value.role}
          onChange={(role) => setValue((v) => ({ ...v, role: role as Role }))}
          options={roles.map((role) => ({
            value: role,
            label: ROLE_LABELS[role],
          }))}
        />
        <Select
          label="Trạng thái"
          value={value.status}
          onChange={(status) =>
            setValue((v) => ({ ...v, status: status as "active" | "locked" }))
          }
          options={[
            { value: "active", label: "Đang hoạt động" },
            { value: "locked", label: "Bị khóa" },
          ]}
        />
      </div>
    </Modal>
  )
}

const ROLE_NAMES_VI: Record<Role, string> = {
  customer: "Khách hàng",
  staff: "Nhân viên Nghiệp vụ",
  compliance_officer: "Chuyên gia Pháp chế",
  system_admin: "Quản trị hệ thống",
}

const ACTOR_DETAILS: Record<Role, { position: string; responsibility: string }> =
{
  customer: {
    position: "Khách hàng cá nhân / doanh nghiệp",
    responsibility: "Tra cứu dịch vụ, biểu mẫu và quy định công khai.",
  },
  staff: {
    position: "RM, Giao dịch viên, Tín dụng",
    responsibility: "Tra cứu chính sách, quy trình nội bộ phục vụ nghiệp vụ.",
  },
  compliance_officer: {
    position: "Phòng Pháp chế / Khối Tuân thủ",
    responsibility: "Quản trị kho tri thức, hiệu lực, quan hệ và xung đột.",
  },
  system_admin: {
    position: "CNTT / DevOps / An toàn thông tin",
    responsibility: "Quản lý tài khoản, RBAC, audit và vận hành hệ thống.",
  },
}

const PERMISSIONS = [
  {
    code: "chat:public",
    name: "Sử dụng chatbot công khai",
    description: "Đặt câu hỏi và nhận câu trả lời từ kho dữ liệu công khai.",
  },
  {
    code: "chat:internal",
    name: "Sử dụng chatbot nội bộ",
    description: "Tra cứu thông tin trong kho tài liệu nội bộ được cấp quyền.",
  },
  {
    code: "documents:read",
    name: "Xem và tra cứu tài liệu",
    description: "Xem danh sách, metadata, phiên bản và chi tiết tài liệu.",
  },
  {
    code: "documents:manage",
    name: "Quản lý tài liệu",
    description:
      "Tải lên, cập nhật file, sửa thông tin và cho tài liệu hết hiệu lực.",
  },
  {
    code: "metadata:manage",
    name: "Quản lý metadata",
    description: "Cập nhật và duyệt thông tin mô tả của tài liệu.",
  },
  {
    code: "relations:manage",
    name: "Quản lý quan hệ tài liệu",
    description:
      "Tạo, sửa và duyệt quan hệ tham chiếu, sửa đổi, thay thế hoặc bãi bỏ.",
  },
  {
    code: "reindex:manage",
    name: "Quản lý tái lập chỉ mục",
    description:
      "Yêu cầu re-index một hoặc nhiều tài liệu và theo dõi tiến trình.",
  },
  {
    code: "users:manage",
    name: "Quản lý người dùng",
    description: "Tạo, cập nhật, khóa, mở khóa và xóa tài khoản.",
  },
  {
    code: "roles:manage",
    name: "Quản lý vai trò và quyền",
    description: "Thay đổi vai trò người dùng và cấu hình ma trận phân quyền.",
  },
  {
    code: "audit:read",
    name: "Xem nhật ký hệ thống",
    description: "Tra cứu, lọc, xem chi tiết và xuất nhật ký audit.",
  },
] as const

export function AdminRoles() {
  const [matrix, setMatrix] = useState<Record<Role, Set<string>>>(() => ({
    customer: new Set(["chat:public"]),
    staff: new Set(["chat:internal", "documents:read"]),
    compliance_officer: new Set([
      "chat:internal",
      "documents:read",
      "documents:manage",
      "metadata:manage",
      "relations:manage",
      "reindex:manage",
    ]),
    system_admin: new Set(["users:manage", "roles:manage", "audit:read"]),
  }))
  const toggle = (role: Role, permission: string) =>
    setMatrix((value) => {
      const next = { ...value, [role]: new Set(value[role]) }
      next[role].has(permission)
        ? next[role].delete(permission)
        : next[role].add(permission)
      return next
    })

  return (
    <DemoStateBoundary title="Vai trò và quyền">
      <AppLayout pageTitle="Vai trò và quyền">
        <PageHeader
          title="Quản lý vai trò và quyền"
          subtitle="Mô hình Hybrid B2C/B2E với dữ liệu PUBLIC và INTERNAL được phân tách"
        />
        <div className="grid grid-cols-4 gap-4 mb-5">
          {roles.map((role) => (
            <Card key={role} className="p-4">
              <Shield className="text-[#C8102E]" size={20} />
              <div className="font-semibold text-sm mt-3">
                {ROLE_NAMES_VI[role]}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {ACTOR_DETAILS[role].position}
              </div>
              <div className="text-xs text-gray-600 mt-3 leading-5">
                {ACTOR_DETAILS[role].responsibility}
              </div>
              <div className="text-xs text-[#C8102E] font-medium mt-3">
                {matrix[role].size} quyền đang bật
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 min-w-[320px]">
                    Quyền truy cập
                  </th>
                  {roles.map((role) => (
                    <th key={role} className="p-3 text-center min-w-[150px]">
                      {ROLE_NAMES_VI[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((permission) => (
                  <tr key={permission.code} className="border-t">
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">
                        {permission.name}
                      </div>
                      <div className="text-gray-500 mt-1 leading-5">
                        {permission.description}
                      </div>
                      <div className="font-mono text-[10px] text-gray-400 mt-1">
                        Mã quyền: {permission.code}
                      </div>
                    </td>
                    {roles.map((role) => (
                      <td key={role} className="p-3 text-center">
                        <input
                          aria-label={`${permission.name} - ${ROLE_NAMES_VI[role]}`}
                          title={`${ROLE_NAMES_VI[role]}: ${permission.name}`}
                          type="checkbox"
                          checked={matrix[role].has(permission.code)}
                          onChange={() => toggle(role, permission.code)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </AppLayout>
    </DemoStateBoundary>
  )
}

export function AdminAudit() {
  const [logs, setLogs] =
    useState<Awaited<ReturnType<typeof adminService.audit>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [result, setResult] = useState("")
  const [detail, setDetail] = useState<typeof logs[number] | null>(null)
  const load = async () => { setLoading(true); setError(""); try { setLogs(await adminService.audit()) } catch (value) { setError(value instanceof Error ? value.message : "API nhật ký không phản hồi.") } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const filtered = logs.filter(
    (log) =>
      (!query ||
        `${log.actor} ${log.action} ${log.target} ${log.requestId}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!result || log.result === result),
  )
  const exportCsv = () => {
    const csv = [
      "time,actor,role,action,target,result,requestId",
      ...filtered.map((log) =>
        [
          log.time,
          log.actor,
          log.role,
          log.action,
          log.target,
          log.result,
          log.requestId,
        ].join(","),
      ),
    ].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "audit-log.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <DemoStateBoundary title="Nhật ký hệ thống">
      <AppLayout pageTitle="Nhật ký hệ thống">
        <PageHeader
          title="Nhật ký hệ thống"
          subtitle={loading ? "Loading…" : error ? "Chưa xác định được nhật ký hệ thống" : "Theo dõi toàn bộ hoạt động trong hệ thống"}
          actions={
            <Btn variant="outline" disabled={loading || !!error} onClick={exportCsv}>
              <Download size={14} /> Xuất CSV
            </Btn>
          }
        />
        <Card className="p-4 mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Actor, action, resource hoặc request ID..."
                className="w-full border rounded pl-9 py-2 text-xs"
              />
            </div>
            <Select
              options={[
                { value: "", label: "Tất cả vai trò" },
                ...roles.map((role) => ({
                  value: role,
                  label: ROLE_LABELS[role],
                })),
              ]}
            />
            <Select
              value={result}
              onChange={setResult}
              options={[
                { value: "", label: "Tất cả kết quả" },
                { value: "success", label: "Thành công" },
                { value: "failed", label: "Thất bại" },
              ]}
            />
            <Input type="date" />
          </div>
        </Card>
        <ApiDataState loading={loading} error={error} onRetry={() => void load()} empty={!loading && !error && filtered.length === 0} emptyTitle="Chưa có nhật ký phù hợp"><Card>
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Thời gian",
                  "Người thực hiện",
                  "Vai trò",
                  "Hành động",
                  "Loại tài nguyên",
                  "Đối tượng",
                  "Kết quả",
                  "Request ID",
                  "",
                ].map((item) => (
                  <th key={item} className="text-left p-3">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="p-3 font-mono">{log.time}</td>
                  <td className="p-3">{log.actor}</td>
                  <td className="p-3">{ROLE_LABELS[log.role]}</td>
                  <td className="p-3 font-mono">{log.action}</td>
                  <td className="p-3">{log.resourceType}</td>
                  <td className="p-3">{log.target}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        log.result === "success" ? "completed" : "failed"
                      }
                    />
                  </td>
                  <td className="p-3 font-mono">{log.requestId}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setDetail(log)}
                      className="text-[#C8102E]"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card></ApiDataState>
        <Modal
          open={!!detail}
          onClose={() => setDetail(null)}
          title="Chi tiết audit log"
          footer={
            <Btn variant="outline" onClick={() => setDetail(null)}>
              Đóng
            </Btn>
          }
        >
          {detail && (
            <div className="text-xs space-y-3">
              <div>
                <b>Request ID:</b> {detail.requestId}
              </div>
              <div>
                <b>Dữ liệu trước:</b>
                <pre className="bg-gray-50 p-3 mt-1 rounded">
                  {detail.before || "Không có"}
                </pre>
              </div>
              <div>
                <b>Dữ liệu sau:</b>
                <pre className="bg-gray-50 p-3 mt-1 rounded">
                  {detail.after || "Không có"}
                </pre>
              </div>
            </div>
          )}
        </Modal>
      </AppLayout>
    </DemoStateBoundary>
  )
}
