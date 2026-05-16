import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Doctor } from '../contexts/DataContext'

// 1. Định nghĩa Schema validation bằng Zod
// Đây là "nguồn chân lý duy nhất" cho form của bạn.
const doctorSchema = z.object({
    fullName: z.string().min(1, 'Họ tên không được để trống'),
    licenseNumber: z.string().regex(/^BS-\d{5}$/, 'Mã giấy phép không hợp lệ (BS-XXXXX)'),
    phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ (0xxxxxxxxx)'),
    email: z.string().email('Email không hợp lệ'),
    specialty: z.enum(['Nha khoa tổng quát', 'Niềng răng', 'Implant', 'Nhổ răng', 'Nha chu']),
    degree: z.enum(['Bác sĩ', 'Thạc sĩ', 'Tiến sĩ', 'Phó Giáo sư', 'Giáo sư']),
    experience: z.number().min(0, 'Kinh nghiệm phải lớn hơn 0').max(50, 'Kinh nghiệm phải nhỏ hơn 50'),
    room: z.string().min(1, 'Vui lòng chọn phòng'),
    consultationFee: z.number().positive('Giá khám phải lớn hơn 0'),
    status: z.enum(['active', 'inactive']),
})

// 2. Tự động suy ra Type từ Schema
export type DoctorFormData = z.infer<typeof doctorSchema>

const SPECIALTIES: Doctor['specialty'][] = ['Nha khoa tổng quát', 'Niềng răng', 'Implant', 'Nhổ răng', 'Nha chu']
const DEGREES: Doctor['degree'][] = ['Bác sĩ', 'Thạc sĩ', 'Tiến sĩ', 'Phó Giáo sư', 'Giáo sư']
const ROOMS: string[] = Array.from({ length: 205 }, (_, i) => `Phòng ${101 + i}`)

interface DoctorFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: DoctorFormData, doctorId: string | null) => void
    editingDoctor: Doctor | null
}

export function DoctorFormModal({ isOpen, onClose, onSave, editingDoctor }: DoctorFormModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<DoctorFormData>({
        resolver: zodResolver(doctorSchema), // 3. Kết nối Zod với React Hook Form
    })

    // Khi mở modal (để sửa) hoặc khi editingDoctor thay đổi, reset form với dữ liệu mới
    useEffect(() => {
        if (editingDoctor) {
            reset(editingDoctor)
        } else {
            reset({
                fullName: '',
                licenseNumber: '',
                phone: '',
                email: '',
                specialty: 'Nha khoa tổng quát',
                degree: 'Bác sĩ',
                experience: 0,
                room: 'Phòng 101',
                consultationFee: 0,
                status: 'active',
            })
        }
    }, [editingDoctor, reset])

    const onSubmit: SubmitHandler<DoctorFormData> = (data) => {
        onSave(data, editingDoctor?.id || null)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-slate-900">
                        {editingDoctor ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Họ tên *</label>
                            <input {...register('fullName')} placeholder="Nhập họ tên" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring" />
                            {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Mã giấy phép *</label>
                            <input {...register('licenseNumber')} placeholder="BS-XXXXX" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none ring-blue-200 transition focus:ring" />
                            {errors.licenseNumber && <p className="mt-1 text-xs text-rose-600">{errors.licenseNumber.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Số điện thoại *</label>
                            <input {...register('phone')} placeholder="0xxxxxxxxx" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring" />
                            {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Email *</label>
                            <input type="email" {...register('email')} placeholder="doctor@example.com" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring" />
                            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Chuyên khoa</label>
                            <select {...register('specialty')} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring">
                                {SPECIALTIES.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Bằng cấp</label>
                            <select {...register('degree')} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring">
                                {DEGREES.map((deg) => <option key={deg} value={deg}>{deg}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Kinh nghiệm (năm) *</label>
                            <input type="number" {...register('experience', { valueAsNumber: true })} min="0" max="50" placeholder="0" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring" />
                            {errors.experience && <p className="mt-1 text-xs text-rose-600">{errors.experience.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Phòng</label>
                            <select {...register('room')} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring">
                                {ROOMS.map((room) => <option key={room} value={room}>{room}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-900">Phí khám (VND) *</label>
                            <input type="number" {...register('consultationFee', { valueAsNumber: true })} placeholder="0" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring" />
                            {errors.consultationFee && <p className="mt-1 text-xs text-rose-600">{errors.consultationFee.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-900">Trạng thái</label>
                        <select {...register('status')} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring">
                            <option value="active">Đang làm việc</option>
                            <option value="inactive">Tạm dừng</option>
                        </select>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                            {isSubmitting ? 'Đang lưu...' : (editingDoctor ? 'Cập nhật' : 'Tạo mới')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}