import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, X, Plus, Clock, Phone, Mail, Award, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react' // X is used in ScheduleModal
import { PageShell } from '../components/PageShell'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { useAuth } from '../contexts/AuthContext' // Import useAuth
import { formatPhone, getSpecialtyColor, getInitials, formatDate } from '../lib/formatters'
import { EmptyState } from '../components/EmptyState'
import { DoctorFormModal, type DoctorFormData } from '../components/DoctorFormModal'
import { api, type ApiListResponse, type ApiItemResponse, type ApiDeleteResponse } from '../lib/api'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import type { Doctor, DoctorPayload } from '../contexts/DataContext'

const SPECIALTIES: Doctor['specialty'][] = ['Nha khoa tổng quát', 'Niềng răng', 'Implant', 'Nhổ răng', 'Nha chu']
const SCHEDULE_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const SCHEDULE_DAY_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']

function formatDateInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function parseDateInput(value: string): Date {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
}

function getMonday(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayOfWeek = d.getDay() // 0 (CN) ... 6 (T7)
    const diffToMonday = (dayOfWeek + 6) % 7
    d.setDate(d.getDate() - diffToMonday)
    return d
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

export function DoctorManagementPage() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    const { currentUser } = useAuth() // Get current user
    const { confirm } = useConfirm()

    // --- Data Fetching using TanStack Query ---
    const { data: doctors = [], isLoading } = useQuery<Doctor[], Error>({
        queryKey: ['doctors'],
        queryFn: async () => {
            const response = await api.get<ApiListResponse<Doctor>>('/doctors');
            return response.data.data;
        },
    });

    const { data: holidays = [] } = useQuery<{_id: string, date: string, name: string}[], Error>({
        queryKey: ['holidays'],
        queryFn: async () => {
            const response = await api.get('/holidays');
            return response.data.data;
        },
    });

    const { mutate: createDoctor } = useMutation<Doctor, Error, DoctorPayload>({
        mutationFn: async (newDoctor) => {
            const response = await api.post<ApiItemResponse<Doctor>>('/doctors', newDoctor);
            return response.data.data;
        },
        onSuccess: (newDoctor) => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            addToast('success', `Đã tạo bác sĩ mới: ${newDoctor.fullName}`);
            setIsModalOpen(false);
        },
        onError: (error) => {
            addToast('error', `Lỗi khi tạo bác sĩ: ${error.message}`);
        },
    });

    const { mutate: updateDoctor } = useMutation<Doctor, Error, { id: string; data: Partial<DoctorPayload> }>({
        mutationFn: async ({ id, data }) => {
            const response = await api.put<ApiItemResponse<Doctor>>(`/doctors/${id}`, data);
            return response.data.data;
        },
        onSuccess: (updatedDoctor) => {
            queryClient.setQueryData<Doctor[]>(['doctors'], (oldData) =>
                oldData ? oldData.map((d) => (d.id === updatedDoctor.id ? updatedDoctor : d)) : []
            );
            addToast('success', `Đã cập nhật thông tin bác sĩ: ${updatedDoctor.fullName}`);
            setIsModalOpen(false);
        },
        onError: (error) => {
            addToast('error', `Lỗi khi cập nhật bác sĩ: ${error.message}`);
        },
    });

    const { mutate: deleteDoctor } = useMutation<ApiDeleteResponse, Error, string>({
        mutationFn: async (id) => {
            const response = await api.delete<ApiDeleteResponse>(`/doctors/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            addToast('success', `Đã xóa bác sĩ.`);
        },
        onError: (error) => {
            addToast('error', `Lỗi khi xóa bác sĩ: ${error.message}`);
        },
    });

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 3

    const [scheduleWeekStart, setScheduleWeekStart] = useState(() => formatDateInput(getMonday(new Date())))
    const scheduleWeekStartDate = useMemo(() => parseDateInput(scheduleWeekStart), [scheduleWeekStart])

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
    const [scheduleModal, setScheduleModal] = useState<{
        isOpen: boolean,
        doctor: Doctor | null
    }>({ isOpen: false, doctor: null })
    // State for schedule form inside the modal
    const [scheduleForm, setScheduleForm] = useState<Doctor['schedule'] | null>(null)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [specialtyFilter, setSpecialtyFilter] = useState<Doctor['specialty'] | null>(null)
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [sortBy, setSortBy] = useState<'name' | 'fee' | 'experience'>('name')
    const isDoctor = currentUser?.role === 'Doctor';

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

        // If current user is a Doctor, only show their own profile
        if (isDoctor && currentUser?.referenceId) {
            result = result.filter(d => d.id === currentUser.referenceId);
        }

        // Specialty filter
        if (specialtyFilter) {
            result = result.filter((d) => d.specialty === specialtyFilter)
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter((d) => d.status === statusFilter) // Giờ sẽ hoạt động đúng
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'name') return a.fullName.localeCompare(b.fullName)
            if (sortBy === 'fee') return a.consultationFee - b.consultationFee
            if (sortBy === 'experience') return b.experience - a.experience
            return 0
        })

        return result
    }, [doctors, searchTerm, specialtyFilter, statusFilter, sortBy])

    // Pagination
    const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage)
    const paginatedDoctors = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredDoctors.slice(start, start + itemsPerPage)
    }, [filteredDoctors, currentPage])

    // Form functions
    function openCreateModal() {
        setEditingDoctor(null)
        setIsModalOpen(true)
    }

    function openEditModal(doctor: Doctor) {
        setEditingDoctor(doctor)
        setIsModalOpen(true)
    }

    function handleSaveDoctor(data: DoctorFormData, doctorId: string | null) {
        if (doctorId) {
            updateDoctor({ id: doctorId, data });
        } else {
            createDoctor(data as DoctorPayload);
        }
        setEditingDoctor(null)
        setCurrentPage(1)
    }

    async function handleDeleteDoctor(doctor: Doctor) {
        const confirmed = await confirm({
            title: 'Xóa bác sĩ',
            message: `Bạn có chắc muốn xóa bác sĩ "${doctor.fullName}"?`,
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            isDangerous: true,
        })
        if (confirmed) {
            deleteDoctor(doctor.id);
        }
    }

    function openScheduleModal(doctor: Doctor) {
        setScheduleWeekStart(formatDateInput(getMonday(new Date())))
        setScheduleModal({ isOpen: true, doctor })
        setScheduleForm({ ...(doctor.schedule || {}) }) // Copy schedule to edit, with fallback for new doctors
    }

    function handleSaveSchedule() {
        if (!scheduleModal.doctor || !scheduleForm) return

        // Gọi mutation để cập nhật lịch làm việc
        updateDoctor({ id: scheduleModal.doctor.id, data: { schedule: scheduleForm } as Partial<DoctorPayload> });
        // Lưu ý: Cần đảm bảo server của bạn xử lý việc cập nhật `schedule`
        // trong `PUT /api/doctors/:id`

        setScheduleModal({ isOpen: false, doctor: null })
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
                        {/* Only Admin can add new doctors */}
                        {isDoctor ? 'Hồ sơ của tôi' : 'Thêm bác sĩ'}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <select
                        value={specialtyFilter || ''}
                        onChange={(e) => {
                            const nextValue = e.target.value
                            setSpecialtyFilter(
                                nextValue ? (nextValue as Doctor['specialty']) : null
                            )
                            setCurrentPage(1)
                            if (isDoctor) setSpecialtyFilter(null); // Doctors cannot filter by specialty if only seeing their own
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
                            if (isDoctor) setStatusFilter('all'); // Doctors cannot filter by status if only seeing their own
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang làm việc</option>
                        <option value="inactive">Tạm dừng</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                        disabled={isDoctor} // Doctors cannot sort if only seeing their own
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
                            setSortBy('name')
                            setCurrentPage(1)
                            if (isDoctor) { /* No need to clear filters if they are already disabled/filtered */ }
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </div>

            {/* Doctor Cards */}
            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <TableLoadingSkeleton rows={3} />
                </div>
            ) : paginatedDoctors.length === 0 ? (
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
                                        {doctor.status === 'active' ? 'Đang làm việc' : 'Tạm dừng'}
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
                                        onClick={() => openScheduleModal(doctor)} // Doctor can view their own schedule
                                        className="flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        Xem lịch
                                    </button>
                                    <button
                                        onClick={() => openEditModal(doctor)} // Doctor can edit their own profile
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-blue-600"
                                        disabled={isDoctor && doctor.id !== currentUser?.referenceId}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDoctor(doctor)}
                                        disabled={isDoctor} // Doctors cannot delete other doctors
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

            <DoctorFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveDoctor}
                editingDoctor={editingDoctor}
            />

            {/* Schedule Modal */}
            {scheduleModal.isOpen && scheduleModal.doctor && scheduleForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-slate-900">
                                Lịch làm việc - {scheduleModal.doctor.fullName}
                            </h3>
                            <button
                                onClick={() => setScheduleModal({ isOpen: false, doctor: null })}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <label className="block text-sm font-medium text-slate-900">Tuần áp dụng (Thứ 2)</label>
                                <input
                                    type="date"
                                    value={scheduleWeekStart}
                                    onChange={(e) => {
                                        const picked = parseDateInput(e.target.value)
                                        setScheduleWeekStart(formatDateInput(getMonday(picked)))
                                    }}
                                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                />
                            </div>
                            <p className="text-xs text-slate-500">Hiển thị ngày cụ thể theo tuần để dễ đối chiếu.</p>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {SCHEDULE_DAYS.map((day, idx) => {
                                const currentDate = addDays(scheduleWeekStartDate, idx);
                                // Set to beginning of day in local timezone to avoid timezone shift matching
                                const dStr = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                                const isHoliday = holidays.find(h => h.date.startsWith(dStr));

                                return (
                                <div key={day} className={`rounded-xl border border-slate-200 p-4 ${isHoliday ? 'bg-slate-50' : 'bg-white'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className={`font-bold ${isHoliday ? 'text-slate-500' : 'text-slate-900'}`}>{SCHEDULE_DAY_NAMES[idx]}</span>
                                            <div className="text-xs text-slate-500">
                                                {formatDate(currentDate, 'short')}
                                            </div>
                                            {isHoliday && (
                                                <div className="mt-1 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                                    Nghỉ lễ: {isHoliday.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label htmlFor={`enabled-${day}`} className="text-sm font-medium text-slate-700">Làm việc</label>
                                            <input
                                                id={`enabled-${day}`}
                                                type="checkbox"
                                                checked={scheduleForm[day]?.enabled || false}
                                                onChange={(e) =>
                                                    setScheduleForm((prev) => prev && ({
                                                        ...prev,
                                                        [day]: {
                                                            ...(prev[day] || {
                                                                startTime: '08:00',
                                                                endTime: '17:00',
                                                            }),
                                                            enabled: e.target.checked,
                                                        },
                                                    }))
                                                }
                                                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    {scheduleForm?.[day]?.enabled && (
                                        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Bắt đầu</label>
                                                <input
                                                    type="time"
                                                    value={scheduleForm[day]?.startTime || '08:00'}
                                                    onChange={(e) =>
                                                        setScheduleForm((prev) =>
                                                            prev && {
                                                                ...prev,
                                                                [day]: { ...(prev[day] || { enabled: true, endTime: '17:00' }), startTime: e.target.value },
                                                            }
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Kết thúc</label>
                                                <input
                                                    type="time"
                                                    value={scheduleForm[day]?.endTime || '17:00'}
                                                    onChange={(e) =>
                                                        setScheduleForm((prev) =>
                                                            prev && {
                                                                ...prev,
                                                                [day]: { ...(prev[day] || { enabled: true, startTime: '08:00' }), endTime: e.target.value },
                                                            }
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setScheduleModal({ isOpen: false, doctor: null })}
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