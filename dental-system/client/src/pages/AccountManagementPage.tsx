import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { AxiosError } from 'axios'
import { PageShell } from '../components/PageShell'
import { api } from '../lib/api'

type AccountStatus = 'active' | 'inactive' | 'on_leave'

type AccountRecord = {
    id: string
    username: string
    fullName: string
    roleCode: string
    status: AccountStatus
    linkedDoctorId?: string
}

type DoctorOption = {
    id: string
    fullName: string
    specialty?: string
}

type AccountFormState = {
    username: string
    fullName: string
    roleCode: string
    status: AccountStatus
    linkedDoctorId: string
}

const PAGE_SIZE = 8

const defaultFormState: AccountFormState = {
    username: '',
    fullName: '',
    roleCode: 'ROLE_RECEPTIONIST',
    status: 'active',
    linkedDoctorId: '',
}

function toRoleLabel(roleCode: string) {
    switch (roleCode) {
        case 'ROLE_ADMIN':
            return 'Admin'
        case 'ROLE_DOCTOR':
            return 'Doctor'
        case 'ROLE_RECEPTIONIST':
            return 'Reception'
        default:
            return roleCode
    }
}

function roleBadgeClass(roleCode: string) {
    switch (roleCode) {
        case 'ROLE_ADMIN':
            return 'bg-blue-100 text-blue-900 ring-blue-200'
        case 'ROLE_DOCTOR':
            return 'bg-emerald-100 text-emerald-900 ring-emerald-200'
        default:
            return 'bg-slate-100 text-slate-800 ring-slate-200'
    }
}

function toStatusLabel(status: AccountStatus) {
    if (status === 'active') return 'Hoat dong'
    if (status === 'on_leave') return 'Tam nghi'
    return 'Ngung'
}

function normalizeAxiosError(error: unknown) {
    const axiosError = error as AxiosError<{ error?: string }>
    return axiosError.response?.data?.error || axiosError.message || 'Co loi xay ra khi ket noi API.'
}

export function AccountManagementPage() {
    const [accounts, setAccounts] = useState<AccountRecord[]>([])
    const [doctors, setDoctors] = useState<DoctorOption[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [formState, setFormState] = useState<AccountFormState>(defaultFormState)

    const isDoctorRole = formState.roleCode === 'ROLE_DOCTOR'

    const filteredAccounts = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase()

        if (!keyword) {
            return accounts
        }

        return accounts.filter((account) => {
            return (
                account.username.toLowerCase().includes(keyword) ||
                account.fullName.toLowerCase().includes(keyword) ||
                toRoleLabel(account.roleCode).toLowerCase().includes(keyword)
            )
        })
    }, [accounts, searchTerm])

    const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE))

    const pagedAccounts = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredAccounts.slice(start, start + PAGE_SIZE)
    }, [filteredAccounts, page])

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    async function fetchAccounts() {
        setIsLoading(true)
        setErrorMessage('')

        try {
            const response = await api.get<{ data: AccountRecord[] }>('/accounts', {
                params: { limit: 500 },
            })
            setAccounts(response.data.data)
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsLoading(false)
        }
    }

    async function fetchDoctors() {
        try {
            const response = await api.get<{ data: DoctorOption[] }>('/doctors', {
                params: { limit: 500 },
            })
            setDoctors(response.data.data)
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        }
    }

    useEffect(() => {
        void fetchAccounts()
        void fetchDoctors()
    }, [])

    function resetModalState() {
        setEditingId(null)
        setFormState(defaultFormState)
        setIsModalOpen(false)
    }

    function openCreateModal() {
        setEditingId(null)
        setFormState(defaultFormState)
        setIsModalOpen(true)
    }

    function openEditModal(account: AccountRecord) {
        setEditingId(account.id)
        setFormState({
            username: account.username,
            fullName: account.fullName,
            roleCode: account.roleCode,
            status: account.status,
            linkedDoctorId: account.linkedDoctorId || '',
        })
        setIsModalOpen(true)
    }

    function updateForm<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) {
        setFormState((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

    async function saveAccount() {
        if (!formState.username.trim() || !formState.fullName.trim()) {
            setErrorMessage('Vui long nhap day du Username va Full Name.')
            return
        }

        if (isDoctorRole && !formState.linkedDoctorId) {
            setErrorMessage('Tai khoan role Doctor phai lien ket mot bac si.')
            return
        }

        setIsSaving(true)
        setErrorMessage('')

        const payload = {
            username: formState.username.trim(),
            fullName: formState.fullName.trim(),
            roleCode: formState.roleCode,
            status: formState.status,
            linkedDoctorId: isDoctorRole ? formState.linkedDoctorId : '',
        }

        try {
            if (editingId) {
                await api.put(`/accounts/${editingId}`, payload)
            } else {
                await api.post('/accounts', payload)
            }

            await fetchAccounts()
            resetModalState()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsSaving(false)
        }
    }

    async function deleteAccount(id: string) {
        setErrorMessage('')

        try {
            await api.delete(`/accounts/${id}`)
            await fetchAccounts()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        }
    }

    async function toggleAccountStatus(account: AccountRecord) {
        const nextStatus: AccountStatus = account.status === 'active' ? 'inactive' : 'active'
        setErrorMessage('')

        try {
            await api.put(`/accounts/${account.id}`, {
                ...account,
                status: nextStatus,
            })
            await fetchAccounts()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        }
    }

    return (
        <section data-testid="page-accounts" className="space-y-6">
            <PageShell
                title="Quản lý tài khoản"
                description="Danh sách tài khoản, trạng thái hoạt động và vai trò người dùng với API thật từ hệ thống backend."
                testId="page-accounts"
            />

            {errorMessage ? (
                <div data-testid="accounts-error" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <label className="relative block w-full md:max-w-sm" htmlFor="accounts-search-input">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        id="accounts-search-input"
                        data-testid="accounts-search-input"
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value)
                            setPage(1)
                        }}
                        placeholder="Tim theo username, full name, role..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    />
                </label>

                <button
                    type="button"
                    data-testid="accounts-add-button"
                    onClick={openCreateModal}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
                >
                    <Plus className="h-4 w-4" />
                    Them moi
                </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.16em] text-slate-500">
                        <tr>
                            <th className="px-5 py-4">Username</th>
                            <th className="px-5 py-4">Full Name</th>
                            <th className="px-5 py-4">Role</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td className="px-5 py-8 text-sm text-slate-500" colSpan={5} data-testid="accounts-loading">
                                    Dang tai du lieu...
                                </td>
                            </tr>
                        ) : pagedAccounts.length === 0 ? (
                            <tr>
                                <td className="px-5 py-8 text-sm text-slate-500" colSpan={5} data-testid="accounts-empty">
                                    Khong co du lieu.
                                </td>
                            </tr>
                        ) : (
                            pagedAccounts.map((account) => (
                                <tr key={account.id} className="border-b border-slate-100 last:border-b-0" data-testid={`accounts-row-${account.id}`}>
                                    <td className="px-5 py-4 text-sm font-medium text-slate-900">{account.username}</td>
                                    <td className="px-5 py-4 text-sm text-slate-700">{account.fullName}</td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${roleBadgeClass(account.roleCode)}`}
                                            data-testid={`accounts-role-${account.id}`}
                                        >
                                            {toRoleLabel(account.roleCode)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            type="button"
                                            data-testid={`accounts-status-toggle-${account.id}`}
                                            onClick={() => {
                                                void toggleAccountStatus(account)
                                            }}
                                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${account.status === 'active'
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-slate-300 bg-slate-100 text-slate-600'
                                                }`}
                                        >
                                            {toStatusLabel(account.status)}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                data-testid={`accounts-edit-${account.id}`}
                                                onClick={() => openEditModal(account)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-blue-900"
                                                aria-label="Sua"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                data-testid={`accounts-delete-${account.id}`}
                                                onClick={() => {
                                                    void deleteAccount(account.id)
                                                }}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                                aria-label="Xoa"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <span data-testid="accounts-pagination-summary">
                    Trang {page}/{totalPages} - {filteredAccounts.length} ban ghi
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        data-testid="accounts-pagination-prev"
                        disabled={page <= 1}
                        onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                        className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        data-testid="accounts-pagination-next"
                        disabled={page >= totalPages}
                        onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                        className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" data-testid="accounts-modal-overlay">
                    <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-900">Account Form</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                                    {editingId ? 'Sua tai khoan' : 'Them moi tai khoan'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                data-testid="accounts-modal-close"
                                onClick={resetModalState}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Username</span>
                                <input
                                    data-testid="accounts-form-username"
                                    value={formState.username}
                                    onChange={(event) => updateForm('username', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Full Name</span>
                                <input
                                    data-testid="accounts-form-full-name"
                                    value={formState.fullName}
                                    onChange={(event) => updateForm('fullName', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Role</span>
                                <select
                                    data-testid="accounts-form-role"
                                    value={formState.roleCode}
                                    onChange={(event) => updateForm('roleCode', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                >
                                    <option value="ROLE_ADMIN">Admin</option>
                                    <option value="ROLE_DOCTOR">Doctor</option>
                                    <option value="ROLE_RECEPTIONIST">Reception</option>
                                </select>
                            </label>

                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Status</span>
                                <select
                                    data-testid="accounts-form-status"
                                    value={formState.status}
                                    onChange={(event) => updateForm('status', event.target.value as AccountStatus)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                >
                                    <option value="active">Hoat dong</option>
                                    <option value="inactive">Ngung</option>
                                    <option value="on_leave">Tam nghi</option>
                                </select>
                            </label>
                        </div>

                        {isDoctorRole ? (
                            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                <label className="space-y-2 text-sm text-slate-700">
                                    <span>Lien ket Bac si</span>
                                    <select
                                        data-testid="accounts-form-linked-doctor"
                                        value={formState.linkedDoctorId}
                                        onChange={(event) => updateForm('linkedDoctorId', event.target.value)}
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        <option value="">Chon bac si tu danh sach</option>
                                        {doctors.map((doctor) => (
                                            <option key={doctor.id} value={doctor.id}>
                                                {doctor.fullName} {doctor.specialty ? `- ${doctor.specialty}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        ) : null}

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                data-testid="accounts-form-cancel"
                                onClick={resetModalState}
                                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                            >
                                Huy
                            </button>
                            <button
                                type="button"
                                data-testid="accounts-form-submit"
                                onClick={() => {
                                    void saveAccount()
                                }}
                                disabled={isSaving}
                                className="h-11 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-60"
                            >
                                {isSaving ? 'Dang luu...' : 'Luu'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    )
}