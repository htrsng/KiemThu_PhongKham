import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { AxiosError } from 'axios'
import { PageShell } from '../components/PageShell'
import { api } from '../lib/api'

type PermissionRecord = {
    id: string
    moduleCode: string
    moduleName: string
    actions: string[]
    description?: string
    status?: string
}

type PermissionFormState = {
    moduleCode: string
    moduleName: string
    actionsText: string
    description: string
    status: string
}

const PAGE_SIZE = 8

const defaultFormState: PermissionFormState = {
    moduleCode: '',
    moduleName: '',
    actionsText: '',
    description: '',
    status: 'active',
}

function normalizeAxiosError(error: unknown) {
    const axiosError = error as AxiosError<{ error?: string }>
    return axiosError.response?.data?.error || axiosError.message || 'Co loi xay ra khi ket noi API.'
}

export function PermissionManagementPage() {
    const [permissions, setPermissions] = useState<PermissionRecord[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [errorMessage, setErrorMessage] = useState('')
    const [formState, setFormState] = useState<PermissionFormState>(defaultFormState)

    const filteredPermissions = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase()
        if (!keyword) return permissions

        return permissions.filter((permission) => {
            return (
                permission.moduleCode.toLowerCase().includes(keyword) ||
                permission.moduleName.toLowerCase().includes(keyword) ||
                permission.actions.join(', ').toLowerCase().includes(keyword)
            )
        })
    }, [permissions, searchTerm])

    const totalPages = Math.max(1, Math.ceil(filteredPermissions.length / PAGE_SIZE))

    const pagedPermissions = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredPermissions.slice(start, start + PAGE_SIZE)
    }, [filteredPermissions, page])

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    async function fetchPermissions() {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const response = await api.get<{ data: PermissionRecord[] }>('/permissions', { params: { limit: 500 } })
            setPermissions(response.data.data)
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void fetchPermissions()
    }, [])

    function updateForm<K extends keyof PermissionFormState>(key: K, value: PermissionFormState[K]) {
        setFormState((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

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

    function openEditModal(permission: PermissionRecord) {
        setEditingId(permission.id)
        setFormState({
            moduleCode: permission.moduleCode,
            moduleName: permission.moduleName,
            actionsText: permission.actions.join(', '),
            description: permission.description || '',
            status: permission.status || 'active',
        })
        setIsModalOpen(true)
    }

    async function savePermission() {
        if (!formState.moduleCode.trim() || !formState.moduleName.trim()) {
            setErrorMessage('Module Code va Module Name la bat buoc.')
            return
        }

        setIsSaving(true)
        setErrorMessage('')

        const payload = {
            moduleCode: formState.moduleCode.trim(),
            moduleName: formState.moduleName.trim(),
            actions: formState.actionsText
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            description: formState.description.trim(),
            status: formState.status,
        }

        try {
            if (editingId) {
                await api.put(`/permissions/${editingId}`, payload)
            } else {
                await api.post('/permissions', payload)
            }

            await fetchPermissions()
            resetModalState()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsSaving(false)
        }
    }

    async function deletePermission(id: string) {
        setErrorMessage('')
        try {
            await api.delete(`/permissions/${id}`)
            await fetchPermissions()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        }
    }

    return (
        <section data-testid="page-permissions" className="space-y-6">
            <PageShell
                title="Phân quyền"
                description="Quản lý module quyền truy cập với API thật, hỗ trợ tìm kiếm, phân trang, tạo mới, sửa và xóa."
                testId="page-permissions"
            />

            {errorMessage ? (
                <div data-testid="permissions-error" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <label className="relative block w-full md:max-w-sm" htmlFor="permissions-search-input">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        id="permissions-search-input"
                        data-testid="permissions-search-input"
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value)
                            setPage(1)
                        }}
                        placeholder="Tim module code, module name, action..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    />
                </label>

                <button
                    type="button"
                    data-testid="permissions-add-button"
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
                            <th className="px-5 py-4">Module Code</th>
                            <th className="px-5 py-4">Module Name</th>
                            <th className="px-5 py-4">Actions</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td className="px-5 py-8 text-sm text-slate-500" colSpan={5} data-testid="permissions-loading">
                                    Dang tai du lieu...
                                </td>
                            </tr>
                        ) : pagedPermissions.length === 0 ? (
                            <tr>
                                <td className="px-5 py-8 text-sm text-slate-500" colSpan={5} data-testid="permissions-empty">
                                    Khong co du lieu.
                                </td>
                            </tr>
                        ) : (
                            pagedPermissions.map((permission) => (
                                <tr key={permission.id} className="border-b border-slate-100 last:border-b-0" data-testid={`permissions-row-${permission.id}`}>
                                    <td className="px-5 py-4 text-sm font-medium text-slate-900">{permission.moduleCode}</td>
                                    <td className="px-5 py-4 text-sm text-slate-700">{permission.moduleName}</td>
                                    <td className="px-5 py-4 text-sm text-slate-700">{permission.actions.join(', ')}</td>
                                    <td className="px-5 py-4 text-sm text-slate-700">{permission.status || 'active'}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                data-testid={`permissions-edit-${permission.id}`}
                                                onClick={() => openEditModal(permission)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-blue-900"
                                                aria-label="Sua"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                data-testid={`permissions-delete-${permission.id}`}
                                                onClick={() => {
                                                    void deletePermission(permission.id)
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
                <span data-testid="permissions-pagination-summary">
                    Trang {page}/{totalPages} - {filteredPermissions.length} ban ghi
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        data-testid="permissions-pagination-prev"
                        disabled={page <= 1}
                        onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                        className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        data-testid="permissions-pagination-next"
                        disabled={page >= totalPages}
                        onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                        className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" data-testid="permissions-modal-overlay">
                    <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-semibold text-slate-900">{editingId ? 'Sua permission' : 'Them moi permission'}</h3>
                            <button
                                type="button"
                                data-testid="permissions-modal-close"
                                onClick={resetModalState}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Module Code</span>
                                <input
                                    data-testid="permissions-form-module-code"
                                    value={formState.moduleCode}
                                    onChange={(event) => updateForm('moduleCode', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Module Name</span>
                                <input
                                    data-testid="permissions-form-module-name"
                                    value={formState.moduleName}
                                    onChange={(event) => updateForm('moduleName', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                                <span>Actions (comma separated)</span>
                                <input
                                    data-testid="permissions-form-actions"
                                    value={formState.actionsText}
                                    onChange={(event) => updateForm('actionsText', event.target.value)}
                                    placeholder="view, create, update, delete"
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                                <span>Description</span>
                                <input
                                    data-testid="permissions-form-description"
                                    value={formState.description}
                                    onChange={(event) => updateForm('description', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Status</span>
                                <select
                                    data-testid="permissions-form-status"
                                    value={formState.status}
                                    onChange={(event) => updateForm('status', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                >
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                </select>
                            </label>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                data-testid="permissions-form-cancel"
                                onClick={resetModalState}
                                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                            >
                                Huy
                            </button>
                            <button
                                type="button"
                                data-testid="permissions-form-submit"
                                onClick={() => {
                                    void savePermission()
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