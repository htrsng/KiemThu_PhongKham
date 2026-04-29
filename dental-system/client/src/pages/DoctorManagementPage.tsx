import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2, X, Plus, Clock, Phone, Mail, Award, BookOpen, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { formatVND, formatPhone, getSpecialtyColor, getInitials } from '../lib/formatters'
import { generateMockDoctors, type MockDoctor } from '../lib/mockData'
import { EmptyState } from '../components/EmptyState'

const SPECIALTIES = ['Nha khoa tổng quát', 'Niềng răng', 'Implant', 'Nhổ răng', 'Nha chu']
const DEGREES = ['Bác sĩ', 'Thạc sĩ', 'Tiến sĩ', 'Phó Giáo sư', 'Giáo sư']
const ROOMS = Array.from({ length: 205 }, (_, i) => (101 + i).toString()) // 101-305
const SCHEDULE_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const SCHEDULE_DAY_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']

type DoctorFormState = {
    fullName: string
    phone: string
    email: string
    specialty: string
    degree: string
    experience: number
    room: string
    consultationFee: number
    licenseNumber: string
    status: 'active' | 'inactive'
    schedule: Record<string, { enabled: boolean; startTime: string; endTime: string }>
}

type ScheduleModalState = {
    isOpen: boolean
    doctorId: string | null
    doctorName: string
}

export function DoctorManagementPage() {
    const [doctors, setDoctors] = useState<MockDoctor[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 3

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null)
    const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({
        isOpen: false,
        doctorId: null,
        doctorName: '',
    })

    // Form state
    const [formState, setFormState] = useState<DoctorFormState>({
        fullName: '',
        phone: '',
        email: '',
        specialty: SPECIALTIES[0],
        degree: DEGREES[0],
        experience: 0,
        room: '101',
        consultationFee: 0,
        licenseNumber: '',
        status: 'active',
        schedule: Object.fromEntries(
            SCHEDULE_DAYS.map((day) => [
                day,
                { enabled: day !== 'CN', startTime: '08:00', endTime: '17:00' },
            ])
        ),
    })

    const [formErrors, setFormErrors] = useState<Partial<DoctorFormState>>({})

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [specialtyFilter, setSpecialtyFilter] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [roomFilter, setRoomFilter] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<'name' | 'fee' | 'experience'>('name')

    const { addToast } = useToast()
    const { confirm } = useConfirm()

    // Load mock data
    useEffect(() => {
        const timer = setTimeout(() => {
            setDoctors(generateMockDoctors(9))
            setIsLoading(false)
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    // Filter and sort doctors
    const filteredDoctors = useMemo(() => {
        let result = doctors

        // Search
        if (searchTerm.trim()) {
            const keyword = searchTerm.toLowerCase()
            result = result.filter(
                (d) =>
                    d.fullName.toLowerCase().includes(keyword) ||
                    d.phone.includes(keyword) ||
                    d.licenseNumber.toLowerCase().includes(keyword)
            )
        }

        // Specialty filter
        if (specialtyFilter) {
            result = result.filter((d) => d.specialty === specialtyFilter)
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter((d) => d.status === statusFilter)
        }

        // Room filter
        if (roomFilter) {
            result = result.filter((d) => d.room === roomFilter)
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'name') return a.fullName.localeCompare(b.fullName)
            if (sortBy === 'fee') return a.consultationFee - b.consultationFee
            if (sortBy === 'experience') return b.experience - a.experience
            return 0
        })

        return result
    }, [doctors, searchTerm, specialtyFilter, statusFilter, roomFilter, sortBy])

    // Pagination
    const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage)
    const paginatedDoctors = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredDoctors.slice(start, start + itemsPerPage)
    }, [filteredDoctors, currentPage])

    // Form functions
    function openCreateModal() {
        setEditingDoctorId(null)
        setFormState({
            fullName: '',
            phone: '',
            email: '',
            specialty: SPECIALTIES[0],
            degree: DEGREES[0],
            experience: 0,
            room: '101',
            consultationFee: 0,
            licenseNumber: '',
            status: 'active',
            schedule: Object.fromEntries(
                SCHEDULE_DAYS.map((day) => [
                    day,
                    { enabled: day !== 'CN', startTime: '08:00', endTime: '17:00' },
                ])
            ),
        })
        setFormErrors({})
        setIsModalOpen(true)
    }

    function openEditModal(doctor: MockDoctor) {
        setEditingDoctorId(doctor.id)
        setFormState({
            fullName: doctor.fullName,
            phone: doctor.phone,
            email: doctor.email,
            specialty: doctor.specialty,
            degree: doctor.degree,
            experience: doctor.experience,
            room: doctor.room,
            consultationFee: doctor.consultationFee,
            licenseNumber: doctor.licenseNumber,
            status: doctor.status,
            schedule: { ...doctor.schedule },
        })
        setFormErrors({})
        setIsModalOpen(true)
    }

    function validateForm(): boolean {
        const errors: Partial<DoctorFormState> = {}

        if (!formState.fullName.trim()) errors.fullName = 'Họ tên không được để trống'
        if (!formState.phone.match(/^0\d{9}$/)) errors.phone = 'Số điện thoại không hợp lệ (0xxxxxxxxx)'
        if (!formState.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Email không hợp lệ'
        if (!formState.licenseNumber.match(/^BS-\d{5}$/)) errors.licenseNumber = 'Mã giấy phép không hợp lệ (BS-XXXXX)'
        if (formState.experience < 0 || formState.experience > 50) errors.experience = 'Kinh nghiệm phải từ 0-50 năm'
        if (formState.consultationFee <= 0) errors.consultationFee = 'Giá khám phải lớn hơn 0'

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    function handleSaveDoctor() {
        if (!validateForm()) return

        if (editingDoctorId) {
            setDoctors((prev) =>
                prev.map((d) => (d.id === editingDoctorId ? { ...d, ...formState } : d))
            )
            addToast('success', 'Cập nhật thông tin bác sĩ thành công')
        } else {
            const newDoctor: MockDoctor = {
                id: `doc-${Date.now()}`,
                ...formState,
            }
            setDoctors((prev) => [newDoctor, ...prev])
            addToast('success', 'Thêm bác sĩ mới thành công')
        }

        setIsModalOpen(false)
        setCurrentPage(1)
    }

    async function handleDeleteDoctor(doctor: MockDoctor) {
        const confirmed = await confirm({
            title: 'Xóa bác sĩ',
            message: `Bạn có chắc muốn xóa bác sĩ "${doctor.fullName}"?`,
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            isDangerous: true,
        })
        if (confirmed) {
            setDoctors((prev) => prev.filter((d) => d.id !== doctor.id))
            addToast('success', 'Xóa bác sĩ thành công')
        }
    }

    function openScheduleModal(doctor: MockDoctor) {
        setEditingDoctorId(doctor.id)
        setFormState({
            fullName: doctor.fullName,
            phone: doctor.phone,
            email: doctor.email,
            specialty: doctor.specialty,
            degree: doctor.degree,
            experience: doctor.experience,
            room: doctor.room,
            consultationFee: doctor.consultationFee,
            licenseNumber: doctor.licenseNumber,
            status: doctor.status,
            schedule: { ...doctor.schedule },
        })
        setScheduleModal({
            isOpen: true,
            doctorId: doctor.id,
            doctorName: doctor.fullName,
        })
    }

    function handleSaveSchedule() {
        setDoctors((prev) =>
            prev.map((d) => (d.id === editingDoctorId ? { ...d, schedule: formState.schedule } : d))
        )
        addToast('success', 'Cập nhật lịch làm việc thành công')
        setScheduleModal({ isOpen: false, doctorId: null, doctorName: '' })
        setEditingDoctorId(null)
    }

    return (
        <section className="space-y-6">
            <PageShell
                title="Quản lý bác sĩ"
                description="Quản lý danh sách bác sĩ nha khoa, thông tin cấp phép, chuyên khoa, lịch làm việc và phí khám."
                testId="page-doctors"
            />

            {/* Search and Filters */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                {/* Search Bar */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                        placeholder="Tìm kiếm theo tên, điện thoại hoặc mã giấy phép..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring md:max-w-sm"
                    />
                    <button
                        onClick={openCreateModal}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                        <Plus className="h-4 w-4" />
                        Thêm bác sĩ
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <select
                        value={specialtyFilter || ''}
                        onChange={(e) => {
                            setSpecialtyFilter(e.target.value || null)
                            setCurrentPage(1)
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    >
                        <option value="">Tất cả chuyên khoa</option>
                        {SPECIALTIES.map((spec) => (
                            <option key={spec} value={spec}>
                                {spec}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as typeof statusFilter)
                            setCurrentPage(1)
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang làm việc</option>
                        <option value="inactive">Tạm dừng</option>
                    </select>

                    <select
                        value={roomFilter || ''}
                        onChange={(e) => {
                            setRoomFilter(e.target.value || null)
                            setCurrentPage(1)
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    >
                        <option value="">Tất cả phòng</option>
                        {ROOMS.map((room) => (
                            <option key={room} value={room}>
                                Phòng {room}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    >
                        <option value="name">Sắp xếp: Tên A-Z</option>
                        <option value="fee">Sắp xếp: Phí thấp-cao</option>
                        <option value="experience">Sắp xếp: Kinh nghiệm cao</option>
                    </select>

                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setSpecialtyFilter(null)
                            setStatusFilter('all')
                            setRoomFilter(null)
                            setSortBy('name')
                            setCurrentPage(1)
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </div>

            {/* Doctor Cards */}
            {paginatedDoctors.length === 0 ? (
                <EmptyState
                    title="Không tìm thấy bác sĩ"
                    description="Không có bác sĩ phù hợp với tìm kiếm của bạn"
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedDoctors.map((doctor) => {
                        const bgColor = getSpecialtyColor(doctor.specialty)
                        return (
                            <div
                                key={doctor.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                            >
                                {/* Header with Avatar */}
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ${bgColor}`}
                                        >
                                            {getInitials(doctor.fullName)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{doctor.fullName}</h3>
                                            <p className="text-xs text-slate-500">{doctor.specialty}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                            doctor.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-900'
                                                : 'bg-slate-100 text-slate-800'
                                        }`}
                                    >
                                        {doctor.status === 'active' ? 'Đang làm' : 'Tạm dừng'}
                                    </span>
                                </div>

                                {/* Info Grid */}
                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span>{formatPhone(doctor.phone)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="truncate">{doctor.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Award className="h-4 w-4 text-slate-400" />
                                        <span>{doctor.experience} năm kinh nghiệm</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <BookOpen className="h-4 w-4 text-slate-400" />
                                        <span>{doctor.degree}</span>
                                    </div>
                                </div>

                                {/* Schedule Summary */}
                                <div className="mb-4 rounded-lg bg-blue-50 p-2 text-xs text-blue-900">
                                    <div className="font-semibold mb-1">Lịch làm việc:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {SCHEDULE_DAYS.map((day, idx) =>
                                            doctor.schedule?.[day]?.enabled ? (
                                                <span key={day} className="inline-block bg-blue-100 rounded px-2 py-1">
                                                    {SCHEDULE_DAY_NAMES[idx]}
                                                </span>
                                            ) : null
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openScheduleModal(doctor)}
                                        className="flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        Xem lịch
                                    </button>
                                    <button
                                        onClick={() => openEditModal(doctor)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-blue-600"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDoctor(doctor)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm text-slate-600">
                        Trang {currentPage} / {totalPages} ({filteredDoctors.length} bác sĩ)
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-blue-600 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-blue-600 disabled:opacity-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Doctor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-slate-900">
                                {editingDoctorId ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Họ tên *</label>
                                    <input
                                        type="text"
                                        value={formState.fullName}
                                        onChange={(e) =>
                                            setFormState((prev) => ({ ...prev, fullName: e.target.value }))
                                        }
                                        placeholder="Nhập họ tên"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {formErrors.fullName && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">
                                        Mã giấy phép *
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.licenseNumber}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                licenseNumber: e.target.value.toUpperCase(),
                                            }))
                                        }
                                        placeholder="BS-XXXXX"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {formErrors.licenseNumber && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.licenseNumber}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">
                                        Số điện thoại *
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.phone}
                                        onChange={(e) =>
                                            setFormState((prev) => ({ ...prev, phone: e.target.value }))
                                        }
                                        placeholder="0xxxxxxxxx"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {formErrors.phone && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Email *</label>
                                    <input
                                        type="email"
                                        value={formState.email}
                                        onChange={(e) =>
                                            setFormState((prev) => ({ ...prev, email: e.target.value }))
                                        }
                                        placeholder="doctor@example.com"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {formErrors.email && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Chuyên khoa</label>
                                    <select
                                        value={formState.specialty}
                                        onChange={(e) =>
                                            setFormState((prev) => ({ ...prev, specialty: e.target.value }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        {SPECIALTIES.map((spec) => (
                                            <option key={spec} value={spec}>
                                                {spec}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Bằng cấp</label>
                                    <select
                                        value={formState.degree}
                                        onChange={(e) =>
                                            setFormState((prev) => ({ ...prev, degree: e.target.value }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        {DEGREES.map((deg) => (
                                            <option key={deg} value={deg}>
                                                {deg}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">
                                        Kinh nghiệm (năm) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formState.experience}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                experience: parseInt(e.target.value) || 0,
                                            }))
                                        }
                                        min="0"
                                        max="50"
                                        placeholder="0"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {formErrors.experience && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.experience}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Phòng</label>
                                    <select
                                        value={formState.room}
                                        onChange={(e) =>
                                            setFormState((prev) => ({ ...prev, room: e.target.value }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        {ROOMS.map((room) => (
                                            <option key={room} value={room}>
                                                Phòng {room}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">
                                        Phí khám (VND) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formState.consultationFee}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                consultationFee: parseInt(e.target.value) || 0,
                                            }))
                                        }
                                        placeholder="0"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {formErrors.consultationFee && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.consultationFee}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-900">Trạng thái</label>
                                <select
                                    value={formState.status}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            status: e.target.value as 'active' | 'inactive',
                                        }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                >
                                    <option value="active">Đang làm việc</option>
                                    <option value="inactive">Tạm dừng</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveDoctor}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                {editingDoctorId ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
            {scheduleModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-slate-900">
                                Lịch làm việc - {scheduleModal.doctorName}
                            </h3>
                            <button
                                onClick={() => setScheduleModal({ isOpen: false, doctorId: null, doctorName: '' })}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {SCHEDULE_DAYS.map((day, idx) => (
                                <div
                                    key={day}
                                    className="flex items-center gap-4 rounded-lg border border-slate-200 p-3"
                                >
                                    <div className="w-16">
                                        <span className="font-semibold text-slate-900">{SCHEDULE_DAY_NAMES[idx]}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formState.schedule[day]?.enabled || false}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                schedule: {
                                                    ...prev.schedule,
                                                    [day]: {
                                                        ...prev.schedule[day],
                                                        enabled: e.target.checked,
                                                    },
                                                },
                                            }))
                                        }
                                        className="h-4 w-4"
                                    />
                                    {formState.schedule[day]?.enabled && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-slate-600">Bắt đầu:</label>
                                                <input
                                                    type="time"
                                                    value={formState.schedule[day]?.startTime || '08:00'}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            schedule: {
                                                                ...prev.schedule,
                                                                [day]: {
                                                                    ...prev.schedule[day],
                                                                    startTime: e.target.value,
                                                                },
                                                            },
                                                        }))
                                                    }
                                                    className="rounded border border-slate-200 px-2 py-1 text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-slate-600">Kết thúc:</label>
                                                <input
                                                    type="time"
                                                    value={formState.schedule[day]?.endTime || '17:00'}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            schedule: {
                                                                ...prev.schedule,
                                                                [day]: {
                                                                    ...prev.schedule[day],
                                                                    endTime: e.target.value,
                                                                },
                                                            },
                                                        }))
                                                    }
                                                    className="rounded border border-slate-200 px-2 py-1 text-sm"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setScheduleModal({ isOpen: false, doctorId: null, doctorName: '' })}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveSchedule}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Lưu lịch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}