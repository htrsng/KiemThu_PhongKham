import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, Search, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '../components/PageShell'
import { EmptyState } from '../components/EmptyState'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { api, type ApiListResponse, type ApiItemResponse } from '../lib/api'
import type { Patient } from '../lib/types'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { formatDate, formatPhone } from '../lib/formatters'
import { useLocation } from 'react-router-dom'

const PAGE_SIZE = 10

type PatientFormState = {
    fullName: string
    phone: string
    dateOfBirth: string
    gender: Patient['gender']
    address: string
    
    // Additional identity
    cccd: string
    email: string
    avatarUrl: string
    
    // Medical Info
    bloodType: string
    allergies: string
    backgroundDisease: string
    surgicalHistory: string
    currentMedication: string
    height: string
    weight: string
    
    // Emergency Contact
    emergencyContactName: string
    emergencyContactRelation: string
    emergencyContactPhone: string
    
    // Insurance Config
    insuranceNumber: string
    insurancePlace: string
    insuranceExpirationDate: string

    // System Info
    doctorNotes: string
}

const initialFormState: PatientFormState = {
    fullName: '', phone: '', dateOfBirth: '', gender: 'Nam', address: '',
    cccd: '', email: '', avatarUrl: '',
    bloodType: '', allergies: '', backgroundDisease: '', surgicalHistory: '', currentMedication: '', height: '', weight: '',
    emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
    insuranceNumber: '', insurancePlace: '', insuranceExpirationDate: '',
    doctorNotes: ''
}

export function PatientManagementPage() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    const { confirm } = useConfirm()

    // Data Fetching
    const { data: patients = [], isLoading } = useQuery<Patient[], Error>({
        queryKey: ['patients'],
        queryFn: async () => (await api.get<ApiListResponse<Patient>>('/patients')).data.data,
    })

    const { mutate: savePatient } = useMutation<Patient, Error, { id?: string; data: Partial<Omit<Patient, 'id' | 'createdAt'>> }>({
        mutationFn: async ({ id, data }) => {
            const url = id ? `/patients/${id}` : '/patients'
            const method = id ? 'put' : 'post'
            return (await api[method]<ApiItemResponse<Patient>>(url, data)).data.data
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
    const location = useLocation()
    const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '')
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState<PatientFormState>(initialFormState)
    const [formErrors, setFormErrors] = useState<Partial<PatientFormState>>({})
    const [isFormDirty, setIsFormDirty] = useState(false)

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
    const handleCloseModal = async () => {
        if (isFormDirty) {
            const confirmed = await confirm({ title: 'Xác nhận đóng', message: 'Bạn có những thay đổi chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ?', isDangerous: true })
            if (!confirmed) return
        }
        resetModal()
    }

    const resetModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormState(initialFormState)
        setFormErrors({})
        setIsFormDirty(false)
    }

    const openCreateModal = () => {
        resetModal()
        setIsModalOpen(true)
    }

    const openEditModal = (patient: Patient) => {
        setEditingId(patient.id)
        setFormState({
            fullName: patient.fullName,
            phone: patient.phone,
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
            gender: patient.gender,
            address: patient.address,
            cccd: patient.cccd || '',
            email: patient.email || '',
            avatarUrl: patient.avatarUrl || '',
            bloodType: patient.bloodType || '',
            allergies: patient.allergies?.join(', ') || '',
            backgroundDisease: patient.backgroundDisease || '',
            surgicalHistory: patient.surgicalHistory || '',
            currentMedication: patient.currentMedication || '',
            height: patient.height?.toString() || '',
            weight: patient.weight?.toString() || '',
            emergencyContactName: patient.emergencyContactName || '',
            emergencyContactRelation: patient.emergencyContactRelation || '',
            emergencyContactPhone: patient.emergencyContactPhone || '',
            insuranceNumber: patient.insuranceNumber || '',
            insurancePlace: patient.insurancePlace || '',
            insuranceExpirationDate: patient.insuranceExpirationDate ? new Date(patient.insuranceExpirationDate).toISOString().split('T')[0] : '',
            doctorNotes: patient.doctorNotes || ''
        })
        setIsModalOpen(true)
        setIsFormDirty(false)
    }

    const updateFormField = (field: keyof PatientFormState, value: any) => {
        setFormState(s => ({ ...s, [field]: value }))
        setIsFormDirty(true)
    }

    const validate = () => {
        const errors: Partial<PatientFormState> = {}
        if (!formState.fullName.trim()) errors.fullName = 'Họ tên không được để trống'
        if (!formState.phone.match(/^(0|\+84)\d{9}$/)) errors.phone = 'Số điện thoại không hợp lệ'
        
        if (!formState.dateOfBirth) {
            errors.dateOfBirth = 'Ngày sinh không được để trống'
        } else {
            const dob = new Date(formState.dateOfBirth)
            const today = new Date()
            if (dob > today) {
                errors.dateOfBirth = 'Ngày sinh không được vượt quá hiện tại'
            }
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSave = () => {
        if (!validate()) return

        const payload: Partial<Omit<Patient, 'id' | 'createdAt'>> = {
            ...formState,
            dateOfBirth: new Date(formState.dateOfBirth).toISOString(),
            allergies: formState.allergies ? formState.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
            height: formState.height ? parseFloat(formState.height) : undefined,
            weight: formState.weight ? parseFloat(formState.weight) : undefined,
            insuranceExpirationDate: formState.insuranceExpirationDate ? new Date(formState.insuranceExpirationDate).toISOString() : undefined,
        }

        if (editingId) {
            savePatient({ id: editingId, data: payload })
        } else {
            savePatient({ data: payload })
        }
        resetModal()
    }

    const handleDelete = async (patient: Patient) => {
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
                    <div className="flex w-full max-w-4xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b p-6 pb-4">
                            <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Cập nhật hồ sơ bệnh nhân' : 'Thêm bệnh nhân mới'}</h3>
                            <button onClick={handleCloseModal} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Section 1: Thông tin định danh */}
                            <div>
                                <h4 className="mb-4 text-base font-semibold text-blue-800 border-b pb-2">Thông tin định danh</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="col-span-full md:col-span-2">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Mã bệnh nhân</label>
                                        <input type="text" value={editingId ? 'Auto-generated' : 'Sẽ tự động tạo'} disabled className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                                    </div>
                                    <div className="col-span-1 border-r pr-4 mb-4 md:mb-0 md:col-span-2 md:border-none md:pr-0">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Họ tên <span className="text-rose-500">*</span></label>
                                                <input type="text" value={formState.fullName} onChange={e => updateFormField('fullName', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="VD: Nguyễn Văn A" />
                                                {formErrors.fullName && <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại <span className="text-rose-500">*</span></label>
                                                <input type="tel" value={formState.phone} onChange={e => updateFormField('phone', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="VD: 0912..." />
                                                {formErrors.phone && <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Ngày sinh <span className="text-rose-500">*</span></label>
                                                <input type="date" value={formState.dateOfBirth} onChange={e => updateFormField('dateOfBirth', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" max={new Date().toISOString().split("T")[0]} />
                                                {formErrors.dateOfBirth && <p className="mt-1 text-xs text-rose-600">{formErrors.dateOfBirth}</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Giới tính</label>
                                                <select value={formState.gender} onChange={(e) => updateFormField('gender', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                                    <option value="Nam">Nam</option>
                                                    <option value="Nữ">Nữ</option>
                                                    <option value="Khác">Khác</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">CCCD/CMND</label>
                                                <input type="text" value={formState.cccd} onChange={e => updateFormField('cccd', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="Số CCCD..." />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                                <input type="email" value={formState.email} onChange={e => updateFormField('email', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="Mật khẩu sẽ gửi vào đây (nếu cần)" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Ảnh đại diện (URL)</label>
                                                <input type="text" value={formState.avatarUrl} onChange={e => updateFormField('avatarUrl', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="https://..." />
                                            </div>
                                            <div className="col-span-full">
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Địa chỉ hiện tại</label>
                                                <input type="text" value={formState.address} onChange={e => updateFormField('address', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="Số nhà, phố, phường/xã..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Thông tin y tế */}
                            <div>
                                <h4 className="mb-4 text-base font-semibold text-blue-800 border-b pb-2">Thông tin y tế</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Nhóm máu</label>
                                        <select value={formState.bloodType} onChange={(e) => updateFormField('bloodType', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                            <option value="">Chưa rõ</option>
                                            <option value="A+">A+</option><option value="A-">A-</option>
                                            <option value="B+">B+</option><option value="B-">B-</option>
                                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                            <option value="O+">O+</option><option value="O-">O-</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Dị ứng thuốc/thực phẩm</label>
                                        <input type="text" value={formState.allergies} onChange={e => updateFormField('allergies', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="Cách nhau bằng dấu phẩy" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Bệnh nền</label>
                                        <input type="text" value={formState.backgroundDisease} onChange={e => updateFormField('backgroundDisease', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="Tiểu đường, tim mạch..." />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Tiền sử phẫu thuật</label>
                                        <input type="text" value={formState.surgicalHistory} onChange={e => updateFormField('surgicalHistory', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400" placeholder="Phẫu thuật..." />
                                    </div>
                                    <div className="col-span-full">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Thuốc đang sử dụng</label>
                                        <input type="text" value={formState.currentMedication} onChange={e => updateFormField('currentMedication', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Các loại thuốc dùng hiện tại..." />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Chiều cao (cm)</label>
                                        <input type="number" value={formState.height} onChange={e => updateFormField('height', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="VD: 170" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Cân nặng (kg)</label>
                                            <input type="number" value={formState.weight} onChange={e => updateFormField('weight', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="VD: 65" />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">BMI</label>
                                            <input type="text" readOnly value={(parseFloat(formState.weight) && parseFloat(formState.height)) ? (parseFloat(formState.weight) / ((parseFloat(formState.height) / 100) ** 2)).toFixed(1) : ''} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" placeholder="Tự tính" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Section 3: Liên hệ khẩn cấp */}
                            <div>
                                <h4 className="mb-4 text-base font-semibold text-blue-800 border-b pb-2">Liên hệ khẩn cấp</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Người liên hệ</label>
                                        <input type="text" value={formState.emergencyContactName} onChange={e => updateFormField('emergencyContactName', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Họ tên người liên hệ..." />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Quan hệ</label>
                                        <input type="text" value={formState.emergencyContactRelation} onChange={e => updateFormField('emergencyContactRelation', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Cha/Mẹ/Vợ..." />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">SĐT Khẩn cấp</label>
                                        <input type="tel" value={formState.emergencyContactPhone} onChange={e => updateFormField('emergencyContactPhone', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="VD: 09..." />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Thông tin bảo hiểm */}
                            <div>
                                <h4 className="mb-4 text-base font-semibold text-blue-800 border-b pb-2">Thông tin bảo hiểm</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Số BHYT</label>
                                        <input type="text" value={formState.insuranceNumber} onChange={e => updateFormField('insuranceNumber', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="DN..." />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Ngày hết hạn BHYT</label>
                                        <input type="date" value={formState.insuranceExpirationDate} onChange={e => updateFormField('insuranceExpirationDate', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Nơi đăng ký KCBBBĐ</label>
                                        <input type="text" value={formState.insurancePlace} onChange={e => updateFormField('insurancePlace', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Bệnh viện..." />
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Thông tin hệ thống */}
                            <div>
                                <h4 className="mb-4 text-base font-semibold text-blue-800 border-b pb-2">Thông tin hệ thống</h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Người cập nhật gần nhất</label>
                                        <input type="text" value={editingId ? 'admin (Hệ thống)' : 'Chưa có'} disabled className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Ngày tạo hồ sơ</label>
                                        <input type="text" value={editingId ? new Date().toLocaleDateString('vi-VN') : 'Sẽ tự tạo'} disabled className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú bác sĩ / Khác</label>
                                        <textarea rows={3} value={formState.doctorNotes} onChange={e => updateFormField('doctorNotes', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Lưu ý điều trị..."></textarea>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="flex items-center justify-end gap-3 border-t p-6 pb-4">
                            <button onClick={handleCloseModal} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Hủy thao tác</button>
                            <button onClick={handleSave} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">{editingId ? 'Cập nhật hồ sơ' : 'Lưu hồ sơ mới'}</button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    )
}
