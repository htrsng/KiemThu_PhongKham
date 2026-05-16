import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2, X, Lock, Unlock, Eye, EyeOff } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { useAuth } from '../contexts/AuthContext' // Import useAuth
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/EmptyState'
import { formatDateTime, getRelativeTime } from '../lib/formatters'
import { validateUsername, validateEmail, validatePassword, validateRequired } from '../lib/validators'
import { generateMockAuditLogs, type MockAccount, type MockAuditLog } from '../lib/mockData'
import { api, type ApiListResponse, type ApiItemResponse, type ApiDeleteResponse } from '../lib/api'

type FormState = {
    username: string
    fullName: string
    email: string
    role: 'Admin' | 'Doctor' | 'Reception'
    password: string
    confirmPassword: string
    status: 'Hoat dong' | 'Bi khoa'
}

type FormErrors = Partial<Record<keyof FormState, string>>

const PAGE_SIZE = 5

const defaultFormState: FormState = {
    username: '',
    fullName: '',
    email: '',
    role: 'Reception',
    password: '',
    confirmPassword: '',
    status: 'Hoat dong',
}

function getRoleBadgeClass(role: string): string {
    switch (role) {
        case 'Admin':
            return 'bg-blue-100 text-blue-900'
        case 'Doctor':
            return 'bg-emerald-100 text-emerald-900'
        case 'Reception':
            return 'bg-slate-100 text-slate-800'
        default:
            return 'bg-slate-100 text-slate-800'
    }
}

function getStatusBadgeClass(status: string): string {
    return status === 'Hoat dong'
        ? 'bg-emerald-100 text-emerald-900'
        : 'bg-rose-100 text-rose-900'
}

export function AccountManagementPage() {
     const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Doctor' | 'Reception'>('All')
    const [page, setPage] = useState(1)
    const [showPassword, setShowPassword] = useState(false)
    const [formState, setFormState] = useState<FormState>(defaultFormState)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [activeTab, setActiveTab] = useState<'accounts' | 'audit'>('accounts')
    const [auditLogs] = useState<MockAuditLog[]>(() => generateMockAuditLogs(20)) // Audit log vẫn dùng mock
    const [auditSearchRole, setAuditSearchRole] = useState('')
    const [auditActionFilter, setAuditActionFilter] = useState<string>('')
    const [auditPage, setAuditPage] = useState(1)

    const { addToast } = useToast()
    const { currentUser } = useAuth() // Get current user
    const { confirm } = useConfirm()
    const queryClient = useQueryClient()

    // --- Data Fetching using TanStack Query ---
    const { data: accounts = [], isLoading } = useQuery<MockAccount[], Error>({
        queryKey: ['accounts'],
        queryFn: async () => (await api.get<ApiListResponse<MockAccount>>('/accounts')).data.data,
    });

    const { mutate: createAccount } = useMutation<MockAccount, Error, Omit<MockAccount, 'id' | 'lastLogin' | 'createdAt'>>({
        mutationFn: async (newAccount) => (await api.post<ApiItemResponse<MockAccount>>('/accounts', newAccount)).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            addToast('success', 'Tạo tài khoản thành công');
            resetModal();
        },
        onError: (err) => addToast('error', `Lỗi: ${err.message}`),
    });

    const { mutate: updateAccount } = useMutation<MockAccount, Error, { id: string; data: Partial<MockAccount> }>({
        mutationFn: async ({ id, data }) => (await api.put<ApiItemResponse<MockAccount>>(`/accounts/${id}`, data)).data.data,
        onSuccess: (updatedAccount) => {
            queryClient.setQueryData<MockAccount[]>(['accounts'], (oldData) =>
                oldData ? oldData.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc) : []
            );
            addToast('success', 'Cập nhật tài khoản thành công');
            resetModal();
        },
        onError: (err) => addToast('error', `Lỗi: ${err.message}`),
    });

    const { mutate: deleteAccount } = useMutation<ApiDeleteResponse, Error, string>({
        mutationFn: async (id) => (await api.delete<ApiDeleteResponse>(`/accounts/${id}`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            addToast('success', 'Xóa tài khoản thành công');
        },
        onError: (err) => addToast('error', `Lỗi: ${err.message}`),
    });

    if (currentUser?.role === 'Doctor') {
        return <EmptyState title="Bạn không có quyền truy cập mục này." description="Chỉ quản trị viên mới có thể quản lý tài khoản." />
    }

    // Filter and paginate accounts
    const filteredAccounts = useMemo(() => {
        let result = accounts

        // Search filter
        if (searchTerm.trim()) {
            const keyword = searchTerm.toLowerCase()
            result = result.filter(
                (acc) =>
                    acc.username.toLowerCase().includes(keyword) ||
                    acc.fullName.toLowerCase().includes(keyword) ||
                    acc.email.toLowerCase().includes(keyword)
            )
        }

        // Role filter
        if (roleFilter !== 'All') {
            result = result.filter((acc) => acc.role === roleFilter)
        }

        return result
    }, [accounts, searchTerm, roleFilter])

    const accountsTotalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE))
    const accountsToDisplay = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredAccounts.slice(start, start + PAGE_SIZE)
    }, [filteredAccounts, page])

    // Audit log filtering
    const filteredAuditLogs = useMemo(() => {
        let result = auditLogs

        if (auditSearchRole.trim()) {
            result = result.filter((log) => log.account.toLowerCase().includes(auditSearchRole.toLowerCase()))
        }

        if (auditActionFilter) {
            result = result.filter((log) => log.action === auditActionFilter)
        }

        return result
    }, [auditLogs, auditSearchRole, auditActionFilter])

    const auditTotalPages = Math.max(1, Math.ceil(filteredAuditLogs.length / PAGE_SIZE))
    const auditLogsToDisplay = useMemo(() => {
        const start = (auditPage - 1) * PAGE_SIZE
        return filteredAuditLogs.slice(start, start + PAGE_SIZE)
    }, [filteredAuditLogs, auditPage])

    // Form validation
    function validateForm(isEditMode: boolean = false): boolean {
        const errors: FormErrors = {}

        if (!validateRequired(formState.username, 'Username').valid) {
            errors.username = validateRequired(formState.username, 'Username').error
        } else if (!validateUsername(formState.username).valid) {
            errors.username = validateUsername(formState.username).error
        }
        // Kiểm tra trùng lặp username khi tạo mới
        if (!isEditMode && accounts.some(acc => acc.username === formState.username)) {
            errors.username = 'Username này đã tồn tại.'
        }

        if (!validateRequired(formState.fullName, 'Họ tên').valid) {
            errors.fullName = validateRequired(formState.fullName, 'Họ tên').error
        }

        if (!validateRequired(formState.email, 'Email').valid) {
            errors.email = validateRequired(formState.email, 'Email').error
        } else if (!validateEmail(formState.email).valid) {
            errors.email = validateEmail(formState.email).error
        }
        // Kiểm tra trùng lặp email khi tạo mới
        if (!isEditMode && accounts.some(acc => acc.email === formState.email)) {
            errors.email = 'Email này đã được sử dụng.'
        }

        if (!isEditMode) {
            if (!validateRequired(formState.password, 'Mật khẩu').valid) {
                errors.password = validateRequired(formState.password, 'Mật khẩu').error
            } else if (!validatePassword(formState.password).valid) {
                errors.password = validatePassword(formState.password).error
            }

            if (!validateRequired(formState.confirmPassword, 'Xác nhận mật khẩu').valid) {
                errors.confirmPassword = validateRequired(formState.confirmPassword, 'Xác nhận mật khẩu').error
            } else if (formState.password !== formState.confirmPassword) {
                errors.confirmPassword = 'Mật khẩu không trùng khớp'
            }
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    function resetModal() {
        setFormState(defaultFormState)
        setFormErrors({})
        setEditingId(null)
        setIsModalOpen(false)
        setShowPassword(false)
    }

    function openCreateModal() {
        resetModal()
        setFormState(defaultFormState)
        setIsModalOpen(true)
    }

    function openEditModal(account: MockAccount) {
        setEditingId(account.id)
        setFormState({
            username: account.username,
            fullName: account.fullName,
            email: account.email,
            role: account.role,
            password: '',
            confirmPassword: '',
            status: account.status,
        })
        setFormErrors({})
        setIsModalOpen(true)
    }

    async function handleSaveAccount() {
        if (!validateForm(!!editingId)) return

        if (editingId) {
            updateAccount({
                id: editingId,
                data: {
                    username: formState.username,
                    fullName: formState.fullName,
                    email: formState.email,
                    role: formState.role,
                    status: formState.status,
                }
            });
        } else {
            createAccount({
                username: formState.username,
                fullName: formState.fullName,
                email: formState.email,
                role: formState.role,
                status: formState.status,
                password: formState.password,
            });
        }
    }

    async function handleDeleteAccount(account: MockAccount) {
        const confirmed = await confirm({
            title: 'Xóa tài khoản',
            message: `Bạn có chắc muốn xóa tài khoản "${account.fullName}"? Hành động này không thể hoàn tác.`,
            isDangerous: true,
        })

        if (confirmed) {
            deleteAccount(account.id);
        }
    }

    async function handleToggleLock(account: MockAccount) {
        const newStatus = account.status === 'Hoat dong' ? 'Bi khoa' : 'Hoat dong'
        updateAccount({ id: account.id, data: { status: newStatus } });
    }

    function handleClearFilters() {
        setSearchTerm('')
        setRoleFilter('All')
        setPage(1)
    }

    function handleClearAuditFilters() {
        setAuditSearchRole('')
        setAuditActionFilter('')
        setAuditPage(1)
    }

    const showClearButton = searchTerm !== '' || roleFilter !== 'All'
    const showClearAuditButton = auditSearchRole !== '' || auditActionFilter !== ''

    return (
        <section data-testid="page-accounts" className="space-y-6">
            <PageShell
                title="Quản lý tài khoản"
                description="Danh sách tài khoản, trạng thái hoạt động và vai trò người dùng. Quản lý, cập nhật và theo dõi lịch sử hoạt động."
                testId="page-accounts"
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`px-4 py-3 text-sm font-medium ${
                        activeTab === 'accounts'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Danh sách tài khoản
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-3 text-sm font-medium ${
                        activeTab === 'audit'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Lịch sử hoạt động
                </button>
            </div>

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
                <div className="space-y-4">
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <label className="relative block w-full md:max-w-sm" htmlFor="accounts-search">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="accounts-search"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setPage(1)
                                    }}
                                    placeholder="Tìm kiếm theo username, tên hoặc email..."
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>

                            <div className="flex gap-2">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value as typeof roleFilter)
                                        setPage(1)
                                    }}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                >
                                    <option value="All">Tất cả vai trò</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Reception">Reception</option>
                                </select>

                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
                                >
                                    <Plus className="h-4 w-4" />
                                    Thêm mới
                                </button>
                            </div>
                        </div>

                        {showClearButton && (
                            <button
                                onClick={handleClearFilters}
                                className="self-start rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <TableLoadingSkeleton rows={PAGE_SIZE} />
                        </div>
                    ) : accountsToDisplay.length === 0 ? (
                        <EmptyState
                            title="Không tìm thấy tài khoản"
                            description="Không có dữ liệu phù hợp với bộ lọc của bạn"
                            onClearFilters={showClearButton ? handleClearFilters : undefined}
                            showClearButton={showClearButton}
                        />
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-4 py-3 font-semibold text-slate-700">Username</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Họ tên</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Vai trò</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Trạng thái</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Lần đăng nhập cuối</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {accountsToDisplay.map((account) => (
                                        <tr key={account.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{account.username}</td>
                                            <td className="px-4 py-3 text-slate-700">{account.fullName}</td>
                                            <td className="px-4 py-3 text-slate-600">{account.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(account.role)}`}>
                                                    {account.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(account.status)}`}>
                                                    {account.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 text-xs">
                                                {getRelativeTime(account.lastLogin)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleLock(account)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-amber-600"
                                                        title={account.status === 'Hoat dong' ? 'Khóa' : 'Mở khóa'}
                                                    >
                                                        {account.status === 'Hoat dong' ? (
                                                            <Unlock className="h-4 w-4" />
                                                        ) : (
                                                            <Lock className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(account)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-blue-600"
                                                        title="Sửa"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAccount(account)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                        <span className="text-slate-600">
                            Trang {page}/{accountsTotalPages} - Tổng {filteredAccounts.length} bản ghi
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(accountsTotalPages, p + 1))}
                                disabled={page >= accountsTotalPages}
                                className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                            >
                                Tiếp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
                <div className="space-y-4">
                    {/* Audit Filters */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <input
                                type="text"
                                value={auditSearchRole}
                                onChange={(e) => {
                                    setAuditSearchRole(e.target.value)
                                    setAuditPage(1)
                                }}
                                placeholder="Tìm kiếm theo tài khoản..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring md:max-w-sm"
                            />

                            <select
                                value={auditActionFilter}
                                onChange={(e) => {
                                    setAuditActionFilter(e.target.value)
                                    setAuditPage(1)
                                }}
                                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                            >
                                <option value="">Tất cả hành động</option>
                                <option value="Đăng nhập">Đăng nhập</option>
                                <option value="Đổi mật khẩu">Đổi mật khẩu</option>
                                <option value="Tạo tài khoản">Tạo tài khoản</option>
                                <option value="Khóa tài khoản">Khóa tài khoản</option>
                                <option value="Sửa tài khoản">Sửa tài khoản</option>
                            </select>
                        </div>

                        {showClearAuditButton && (
                            <button
                                onClick={handleClearAuditFilters}
                                className="self-start rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Audit Table */}
                    {auditLogsToDisplay.length === 0 ? (
                        <EmptyState
                            title="Không tìm thấy hoạt động"
                            description="Không có dữ liệu lịch sử phù hợp"
                            onClearFilters={showClearAuditButton ? handleClearAuditFilters : undefined}
                            showClearButton={showClearAuditButton}
                        />
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-4 py-3 font-semibold text-slate-700">Thời gian</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Tài khoản</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Hành động</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">IP Address</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Kết quả</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {auditLogsToDisplay.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-700">{formatDateTime(log.timestamp)}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{log.account}</td>
                                            <td className="px-4 py-3 text-slate-700">{log.action}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.ipAddress}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        log.result === 'Thành công'
                                                            ? 'bg-emerald-100 text-emerald-900'
                                                            : 'bg-rose-100 text-rose-900'
                                                    }`}
                                                >
                                                    {log.result}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Audit Pagination */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                        <span className="text-slate-600">
                            Trang {auditPage}/{auditTotalPages} - Tổng {filteredAuditLogs.length} bản ghi
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                                disabled={auditPage <= 1}
                                className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                                disabled={auditPage >= auditTotalPages}
                                className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                            >
                                Tiếp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-slate-900">
                                {editingId ? 'Chỉnh sửa tài khoản' : 'Thêm mới tài khoản'}
                            </h3>
                            <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900">
                                    Username <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formState.username}
                                    onChange={(e) => {
                                        setFormState((prev) => ({ ...prev, username: e.target.value }))
                                        if (formErrors.username) {
                                            setFormErrors((prev) => ({ ...prev, username: undefined }))
                                        }
                                    }}
                                    placeholder="Chỉ chữ thường và dấu chấm, tối thiểu 4 ký tự"
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                />
                                {formErrors.username && <p className="mt-1 text-xs text-rose-600">{formErrors.username}</p>}
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900">
                                    Họ tên <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formState.fullName}
                                    onChange={(e) => {
                                        setFormState((prev) => ({ ...prev, fullName: e.target.value }))
                                        if (formErrors.fullName) {
                                            setFormErrors((prev) => ({ ...prev, fullName: undefined }))
                                        }
                                    }}
                                    placeholder="Nhập họ tên đầy đủ"
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                />
                                {formErrors.fullName && <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900">
                                    Email <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formState.email}
                                    onChange={(e) => {
                                        setFormState((prev) => ({ ...prev, email: e.target.value }))
                                        if (formErrors.email) {
                                            setFormErrors((prev) => ({ ...prev, email: undefined }))
                                        }
                                    }}
                                    placeholder="example@domain.com"
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                />
                                {formErrors.email && <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>}
                            </div>

                            {/* Role */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">
                                        Vai trò <span className="text-rose-600">*</span>
                                    </label>
                                    <select
                                        value={formState.role}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                role: e.target.value as typeof formState.role,
                                            }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Doctor">Doctor</option>
                                        <option value="Reception">Reception</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">
                                        Trạng thái <span className="text-rose-600">*</span>
                                    </label>
                                    <select
                                        value={formState.status}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                status: e.target.value as typeof formState.status,
                                            }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        <option value="Hoat dong">Hoạt động</option>
                                        <option value="Bi khoa">Bị khóa</option>
                                    </select>
                                </div>
                            </div>

                            {!editingId && (
                                <>
                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-900">
                                            Mật khẩu <span className="text-rose-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formState.password}
                                                onChange={(e) => {
                                                    setFormState((prev) => ({ ...prev, password: e.target.value }))
                                                    if (formErrors.password) {
                                                        setFormErrors((prev) => ({ ...prev, password: undefined }))
                                                    }
                                                }}
                                                placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số"
                                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {formErrors.password && <p className="mt-1 text-xs text-rose-600">{formErrors.password}</p>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-900">
                                            Xác nhận mật khẩu <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formState.confirmPassword}
                                            onChange={(e) => {
                                                setFormState((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                                if (formErrors.confirmPassword) {
                                                    setFormErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                                                }
                                            }}
                                            placeholder="Nhập lại mật khẩu"
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                        />
                                        {formErrors.confirmPassword && (
                                            <p className="mt-1 text-xs text-rose-600">{formErrors.confirmPassword}</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={resetModal}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveAccount}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                {editingId ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
