import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, Search, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '../components/PageShell'
import { EmptyState } from '../components/EmptyState'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { api, type ApiListResponse, type ApiItemResponse } from '../lib/api'
import type { MockPatient } from '../lib/mockData'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { formatDate, formatPhone } from '../lib/formatters'

const PAGE_SIZE = 10

type PatientFormState = {
    fullName: string
    phone: string
    dateOfBirth: string
    gender: MockPatient['gender']
    address: string
}

export function PatientManagementPage() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    const { confirm } = useConfirm()

    // Data Fetching
    const { data: patients = [], isLoading } = useQuery<MockPatient[], Error>({
        queryKey: ['patients'],
        queryFn: async () => (await api.get<ApiListResponse<MockPatient>>('/patients')).data.data,
    })

    const { mutate: savePatient } = useMutation<MockPatient, Error, { id?: string; data: Partial<Omit<MockPatient, 'id' | 'createdAt'>> }>({
        mutationFn: async ({ id, data }) => {
            const url = id ? `/patients/${id}` : '/patients'
            const method = id ? 'put' : 'post'
            return (await api[method]<ApiItemResponse<MockPatient>>(url, data)).data.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            addToast('success', 'Lưu thông tin bệnh nhân thành công')
        },
        onError: (err) => addToast('error', `Lỗi lưu thông tin: ${err.message}`),
    })

    const { mutate: deletePatient } = useMutation<any, Error, string>({
        mutationFn: async (id) => (await api.delete(`/patients/${id}`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            addToast('success', 'Đã xóa bệnh nhân')
        },
        onError: (err) => addToast('error', `Lỗi xóa bệnh nhân: ${err.message}`),
    })

    // States
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState<PatientFormState>({ fullName: '', phone: '', dateOfBirth: '', gender: 'Nam', address: '' })
    const [formErrors, setFormErrors] = useState<Partial<PatientFormState>>({})

    // Pagination & Filtering
    const filteredData = useMemo(() => {
        return patients.filter(p => 
            p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone.includes(searchTerm)
        )
    }, [patients, searchTerm])

    const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
    const paginatedData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredData.slice(start, start + PAGE_SIZE)
    }, [filteredData, page])

    // Handlers
    const resetModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormState({ fullName: '', phone: '', dateOfBirth: '', gender: 'Nam', address: '' })
        setFormErrors({})
    }

    const openCreateModal = () => {
        resetModal()
        setIsModalOpen(true)
    }

    const openEditModal = (patient: MockPatient) => {
        setEditingId(patient.id)
        setFormState({
            fullName: patient.fullName,
            phone: patient.phone,
            dateOfBirth: new Date(patient.dateOfBirth).toISOString().split('T')[0],
            gender: patient.gender,
            address: patient.address,
        })
        setIsModalOpen(true)
    }

    const validate = () => {
        const errors: Partial<PatientFormState> = {}
        if (!formState.fullName.trim()) errors.fullName = 'Họ tên không được để trống'
        if (!formState.phone.match(/^0\d{9}$/)) errors.phone = 'Số điện thoại không hợp lệ (Bắt đầu bằng 0 và gồm 10 số)'
        if (!formState.dateOfBirth) errors.dateOfBirth = 'Ngày sinh không được để trống'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSave = () => {
        if (!validate()) return

        if (editingId) {
            savePatient({ id: editingId, data: { ...formState, dateOfBirth: new Date(formState.dateOfBirth).toISOString() } })
        } else {
            savePatient({ data: {
                ...formState,
                dateOfBirth: new Date(formState.dateOfBirth).toISOString(),
            }})
        }
        resetModal()
    }

    const handleDelete = async (patient: MockPatient) => {
        const confirmed = await confirm({ title: 'Xóa bệnh nhân', message: `Bạn có chắc muốn xóa bệnh nhân "${patient.fullName}"? Mọi dữ liệu lịch sử liên quan sẽ mất.`, isDangerous: true })
        if (confirmed) {
            deletePatient(patient.id)
        }
    }

    return (
        <PageShell title="Quản lý Bệnh nhân">
            <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between shadow-sm">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            placeholder="Tìm theo tên hoặc SĐT..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <button onClick={openCreateModal} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 text-sm font-semibold text-white transition-colors">
                        <Plus className="h-4 w-4" /> Thêm bệnh nhân
                    </button>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><TableLoadingSkeleton rows={PAGE_SIZE} /></div>
                ) : paginatedData.length === 0 ? (
                    <div className="mt-8">
                        <EmptyState title="Không tìm thấy bệnh nhân nào" />
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50">
                                    <th className="px-6 py-4 font-semibold text-slate-700">Họ tên</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Số điện thoại</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Ngày sinh</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Giới tính</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Địa chỉ</th>
                                    <th className="px-6 py-4 text-right font-semibold text-slate-700">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.map(p => (
                                    <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{p.fullName}</td>
                                        <td className="px-6 py-4 text-slate-700">{formatPhone(p.phone)}</td>
                                        <td className="px-6 py-4 text-slate-700">{formatDate(p.dateOfBirth)}</td>
                                        <td className="px-6 py-4 text-slate-700">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                p.gender === 'Nam' ? 'bg-blue-100 text-blue-700' : 
                                                p.gender === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {p.gender}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 truncate max-w-[200px]" title={p.address}>{p.address}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => openEditModal(p)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm" title="Sửa">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(p)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm" title="Xóa">
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
                {filteredData.length > 0 && (
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm shadow-sm">
                        <span className="text-slate-600 font-medium">Trang {page} / {totalPages} (Tổng {filteredData.length} bệnh nhân)</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">Trước</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">Tiếp</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between border-b pb-4">
                            <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Cập nhật hồ sơ bệnh nhân' : 'Thêm bệnh nhân mới'}</h3>
                            <button onClick={resetModal} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Họ tên <span className="text-rose-500">*</span></label>
                                <input type="text" value={formState.fullName} onChange={e => setFormState(s => ({ ...s, fullName: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="VD: Nguyễn Văn A" />
                                {formErrors.fullName && <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Số điện thoại <span className="text-rose-500">*</span></label>
                                <input type="text" value={formState.phone} onChange={e => setFormState(s => ({ ...s, phone: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="VD: 0912345678" />
                                {formErrors.phone && <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Ngày sinh <span className="text-rose-500">*</span></label>
                                    <input type="date" value={formState.dateOfBirth} onChange={e => setFormState(s => ({ ...s, dateOfBirth: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    {formErrors.dateOfBirth && <p className="mt-1 text-xs text-rose-600">{formErrors.dateOfBirth}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Giới tính</label>
                                    <select
                                        value={formState.gender}
                                        onChange={(e) => setFormState((s) => ({ ...s, gender: e.target.value as MockPatient['gender'] }))}
                                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Địa chỉ hiện tại</label>
                                <input type="text" value={formState.address} onChange={e => setFormState(s => ({ ...s, address: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Số nhà, đường, quận/huyện..." />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                            <button onClick={resetModal} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Hủy thao tác</button>
                            <button onClick={handleSave} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">{editingId ? 'Cập nhật hồ sơ' : 'Lưu hồ sơ mới'}</button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    )
}
