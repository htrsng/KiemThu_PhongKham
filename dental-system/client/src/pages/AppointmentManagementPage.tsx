import { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import type { EventClickArg } from '@fullcalendar/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DateClickArg } from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
    Calendar as CalendarIcon,
    Users,
    Clock,
    CalendarOff,
    SlidersHorizontal,
    Plus,
    Trash2,
    Pencil,
    Search,
    X,
    List,
} from 'lucide-react'
import { PageShell } from '../components/PageShell'
import {
    generateMockPatients,
    generateMockAppointments,
    generateMockWorkShifts,
    generateMockClinicHolidays,
    type MockPatient,
    type MockAppointment,
    type MockWorkShift,
    type MockClinicHoliday,
    generateMockDoctors,
    type MockDoctor,
    generateMockServices,
    type MockService,
} from '../lib/mockData'
import { useToast } from '../contexts/ToastContext'
import { api, type ApiListResponse, type ApiItemResponse, type ApiDeleteResponse } from '../lib/api'
import { useConfirm } from '../contexts/ConfirmContext'
import { useAuth } from '../contexts/AuthContext' // Import useAuth
import { EmptyState } from '../components/EmptyState'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { formatDate, formatDateTime, formatDateTimeLocal, formatPhone, formatVND } from '../lib/formatters'

type SubPage = 'appointments' | 'patients' | 'doctor-schedule' | 'work-shifts' | 'holidays'

const menuItems: { id: SubPage; label: string; icon: React.ElementType }[] = [
    { id: 'appointments', label: 'Lịch hẹn', icon: CalendarIcon },
    { id: 'patients', label: 'Quản lý Bệnh nhân', icon: Users },
    { id: 'doctor-schedule', label: 'Lịch trực bác sĩ', icon: Clock },
    { id: 'work-shifts', label: 'Cài đặt ca làm việc', icon: SlidersHorizontal },
    { id: 'holidays', label: 'Cài đặt ngày nghỉ', icon: CalendarOff },
]

type DoctorOnCallShift = {
    id: string // This type is already defined in mockData.ts as MockDoctorShift
    doctorId: string // It's better to use the type from mockData.ts or DataContext.tsx
    doctorName: string // Let's stick to the existing type for consistency.
    // The type `DoctorOnCallShift` is defined here and used locally.
    date: string // YYYY-MM-DD (local)
    startTime: string // HH:mm
    endTime: string // HH:mm
}

const PAGE_SIZE = 10

export function AppointmentManagementPage() {
    const [activeSubPage, setActiveSubPage] = useState<SubPage>('doctor-schedule')
    const [isLoading, setIsLoading] = useState(true)
    const { currentUser } = useAuth() // Get current user
    const queryClient = useQueryClient()
    const { addToast } = useToast()

    // --- Server-side data for Appointments ---
    const { data: appointments = [], isLoading: appointmentsIsLoading } = useQuery<MockAppointment[], Error>({
        queryKey: ['appointments'],
        queryFn: async () => (await api.get<ApiListResponse<MockAppointment>>('/appointments')).data.data,
    });

    const { mutate: createAppointment } = useMutation<MockAppointment, Error, Omit<MockAppointment, 'id'>>({
        mutationFn: async (newApt) => (await api.post<ApiItemResponse<MockAppointment>>('/appointments', newApt)).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            addToast('success', 'Tạo lịch hẹn thành công');
        },
        onError: (err) => addToast('error', `Lỗi khi tạo lịch hẹn: ${err.message}`),
    });

    const { mutate: updateAppointment } = useMutation<MockAppointment, Error, { id: string; data: Partial<MockAppointment> }>({
        mutationFn: async ({ id, data }) => (await api.put<ApiItemResponse<MockAppointment>>(`/appointments/${id}`, data)).data.data,
        onSuccess: (updatedApt) => {
            // Optimistically update the cache
            queryClient.setQueryData<MockAppointment[]>(['appointments'], (oldData) => 
                oldData ? oldData.map(apt => apt.id === updatedApt.id ? updatedApt : apt) : []
            );
            addToast('success', 'Cập nhật lịch hẹn thành công');
        },
        onError: (err) => addToast('error', `Lỗi khi cập nhật lịch hẹn: ${err.message}`),
    });

    // Data states
    // --- Server-side data for Doctor Shifts ---
    const { data: doctorShifts = [], isLoading: shiftsIsLoading } = useQuery<DoctorOnCallShift[], Error>({
        queryKey: ['doctorShifts'],
        queryFn: async () => (await api.get<ApiListResponse<DoctorOnCallShift>>('/shifts')).data.data,
    });

    const { mutate: createShift } = useMutation<DoctorOnCallShift, Error, Omit<DoctorOnCallShift, 'id'>>({
        mutationFn: async (newShift) => (await api.post<ApiItemResponse<DoctorOnCallShift>>('/shifts', newShift)).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctorShifts'] });
            addToast('success', 'Đăng ký ca trực thành công');
        },
        onError: (err) => addToast('error', `Lỗi khi đăng ký ca trực: ${err.message}`),
    });

    const { mutate: updateShift } = useMutation<DoctorOnCallShift, Error, { id: string; data: Partial<Omit<DoctorOnCallShift, 'id'>> }>({
        mutationFn: async ({ id, data }) => (await api.put<ApiItemResponse<DoctorOnCallShift>>(`/shifts/${id}`, data)).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctorShifts'] });
            addToast('success', 'Cập nhật ca trực thành công');
        },
        onError: (err) => addToast('error', `Lỗi khi cập nhật ca trực: ${err.message}`),
    });

    const { mutate: deleteShift } = useMutation<ApiDeleteResponse, Error, string>({
        mutationFn: async (id) => (await api.delete<ApiDeleteResponse>(`/shifts/${id}`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctorShifts'] });
            addToast('success', 'Đã xóa ca trực');
        },
        onError: (err) => addToast('error', `Lỗi khi xóa ca trực: ${err.message}`),
    });

    // --- Server-side data for Doctors ---
    const { data: doctors = [], isLoading: doctorsIsLoading } = useQuery<MockDoctor[], Error>({
        queryKey: ['doctors'],
        queryFn: async () => (await api.get<ApiListResponse<MockDoctor>>('/doctors')).data.data,
    });


    // --- Mock data for other modules (will be migrated later) ---
    const [patients, setPatients] = useState<MockPatient[]>([])
    const [workShifts, setWorkShifts] = useState<MockWorkShift[]>([])
    const [holidays, setHolidays] = useState<MockClinicHoliday[]>([])
    const [services, setServices] = useState<MockService[]>([])

    useEffect(() => {
        const timer = setTimeout(() => {
            setPatients(generateMockPatients(30))
            setWorkShifts(generateMockWorkShifts())
            setHolidays(generateMockClinicHolidays())
            setServices(generateMockServices(10))
            setIsLoading(false)
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    // Filter menu items based on user role
    const filteredMenuItems = useMemo(() => {
        if (currentUser?.role === 'Doctor') {
            // Doctors can only see their appointments and schedule
            return menuItems.filter(item => item.id === 'appointments' || item.id === 'doctor-schedule');
        }
        return menuItems;
    }, [currentUser]);

    const renderContent = () => {
        if ((isLoading || doctorsIsLoading) && !['doctor-schedule', 'appointments'].includes(activeSubPage)) {
            return (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <TableLoadingSkeleton rows={PAGE_SIZE} />
                </div>
            )
        }

        switch (activeSubPage) {
            case 'patients': // Only Admin/Reception should see this
                if (currentUser?.role === 'Doctor') return <EmptyState title="Bạn không có quyền truy cập mục này." />
                return <PatientManagementView data={patients} setData={setPatients} />
            case 'doctor-schedule':
                return <DoctorScheduleView 
                    doctors={doctors} 
                    shifts={doctorShifts} 
                    holidays={holidays} 
                    isLoading={shiftsIsLoading}
                    createShift={createShift}
                    updateShift={updateShift}
                    deleteShift={deleteShift}
                    currentUser={currentUser} // Pass currentUser
                />
            case 'work-shifts': // Only Admin/Reception should see this
                if (currentUser?.role === 'Doctor') return <EmptyState title="Bạn không có quyền truy cập mục này." />
                return <WorkShiftSettingsView data={workShifts} setData={setWorkShifts} />
            case 'holidays': // Only Admin/Reception should see this
                if (currentUser?.role === 'Doctor') return <EmptyState title="Bạn không có quyền truy cập mục này." />
                return <HolidaySettingsView data={holidays} setData={setHolidays} />
            case 'appointments':
            default:
                return (
                    <AppointmentBookingView
                        isLoading={appointmentsIsLoading}
                        appointments={appointments}
                        patients={patients}
                        doctors={doctors}
                        services={services}
                        holidays={holidays}
                        doctorShifts={doctorShifts}
                        createAppointment={createAppointment}
                        currentUser={currentUser} // Pass currentUser
                        updateAppointment={updateAppointment}
                    />
                )
        }
    }

    return (
        <section>
            <PageShell
                title="Quản lý Lịch hẹn"
                description="Quản lý lịch hẹn, thông tin bệnh nhân và các cài đặt liên quan đến lịch làm việc."
                testId="page-appointments"
            />

            <div className="mt-6 flex flex-col gap-8 md:flex-row">
                {/* Left Menu */}
                <aside className="w-full md:w-1/4 lg:w-1/5">
                    <nav className="flex flex-col gap-2">
                        {filteredMenuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSubPage(item.id)}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                    activeSubPage === item.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Right Content */}
                <main className="flex-1">{renderContent()}</main>
            </div>
        </section>
    )
}

// #region Patient Management View
function PatientManagementView({ data, setData }: { data: MockPatient[]; setData: React.Dispatch<React.SetStateAction<MockPatient[]>> }) {
    type PatientFormState = {
        fullName: string
        phone: string
        dateOfBirth: string
        gender: MockPatient['gender']
        address: string
    }

    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState<PatientFormState>({ fullName: '', phone: '', dateOfBirth: '', gender: 'Nam', address: '' })
    const [formErrors, setFormErrors] = useState<Partial<PatientFormState>>({})

    const { addToast } = useToast()
    const { confirm } = useConfirm()

    const filteredData = useMemo(() => {
        return data.filter(p => 
            p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone.includes(searchTerm)
        )
    }, [data, searchTerm])

    const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
    const paginatedData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredData.slice(start, start + PAGE_SIZE)
    }, [filteredData, page])

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
        if (!formState.phone.match(/^0\d{9}$/)) errors.phone = 'Số điện thoại không hợp lệ'
        if (!formState.dateOfBirth) errors.dateOfBirth = 'Ngày sinh không được để trống'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSave = () => {
        if (!validate()) return

        if (editingId) {
            setData(prev => prev.map(p => p.id === editingId ? { ...p, ...formState, dateOfBirth: new Date(formState.dateOfBirth).toISOString() } : p))
            addToast('success', 'Cập nhật bệnh nhân thành công')
        } else {
            const newPatient: MockPatient = {
                id: `pat-${Date.now()}`,
                ...formState,
                dateOfBirth: new Date(formState.dateOfBirth).toISOString(),
                createdAt: new Date().toISOString()
            }
            setData(prev => [newPatient, ...prev])
            addToast('success', 'Thêm bệnh nhân thành công')
        }
        resetModal()
    }

    const handleDelete = async (patient: MockPatient) => {
        const confirmed = await confirm({ title: 'Xóa bệnh nhân', message: `Bạn có chắc muốn xóa bệnh nhân "${patient.fullName}"?`, isDangerous: true })
        if (confirmed) {
            setData(prev => prev.filter(p => p.id !== patient.id))
            addToast('success', 'Xóa bệnh nhân thành công')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        placeholder="Tìm theo tên hoặc SĐT..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm"
                    />
                </div>
                <button onClick={openCreateModal} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" /> Thêm bệnh nhân
                </button>
            </div>

            {paginatedData.length === 0 ? (
                <EmptyState title="Không tìm thấy bệnh nhân" />
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50">
                                <th className="px-4 py-3 font-semibold text-slate-700">Họ tên</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Số điện thoại</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Ngày sinh</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Giới tính</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Địa chỉ</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {paginatedData.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{p.fullName}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatPhone(p.phone)}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatDate(p.dateOfBirth)}</td>
                                    <td className="px-4 py-3 text-slate-700">{p.gender}</td>
                                    <td className="px-4 py-3 text-slate-700 truncate max-w-xs">{p.address}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEditModal(p)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(p)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
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
                <span className="text-slate-600">Trang {page}/{totalPages} - Tổng {filteredData.length} bệnh nhân</span>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border px-3 py-2 disabled:opacity-50">Trước</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border px-3 py-2 disabled:opacity-50">Tiếp</button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold">{editingId ? 'Sửa thông tin bệnh nhân' : 'Thêm bệnh nhân mới'}</h3>
                            <button onClick={resetModal} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Họ tên *</label>
                                <input type="text" value={formState.fullName} onChange={e => setFormState(s => ({ ...s, fullName: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                                {formErrors.fullName && <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Số điện thoại *</label>
                                <input type="text" value={formState.phone} onChange={e => setFormState(s => ({ ...s, phone: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                                {formErrors.phone && <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Ngày sinh *</label>
                                    <input type="date" value={formState.dateOfBirth} onChange={e => setFormState(s => ({ ...s, dateOfBirth: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                                    {formErrors.dateOfBirth && <p className="mt-1 text-xs text-rose-600">{formErrors.dateOfBirth}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Giới tính</label>
                                    <select
                                        value={formState.gender}
                                        onChange={(e) =>
                                            setFormState((s) => ({
                                                ...s,
                                                gender: e.target.value as MockPatient['gender'],
                                            }))
                                        }
                                        className="mt-1 w-full rounded-lg border bg-white p-2 text-sm"
                                    >
                                        <option>Nam</option>
                                        <option>Nữ</option>
                                        <option>Khác</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Địa chỉ</label>
                                <input type="text" value={formState.address} onChange={e => setFormState(s => ({ ...s, address: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={resetModal} className="rounded-lg border px-4 py-2 text-sm font-medium">Hủy</button>
                            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
// #endregion

// #region Doctor Schedule View
function DoctorScheduleView({
    doctors,
    shifts,
    holidays,
    isLoading,
    createShift,
    updateShift,
    deleteShift,
    currentUser, // Accept currentUser prop
}: {
    doctors: MockDoctor[]
    shifts: DoctorOnCallShift[]
    holidays: MockClinicHoliday[]
    isLoading: boolean
    createShift: (data: Omit<DoctorOnCallShift, 'id'>) => void
    updateShift: (params: { id: string; data: Partial<Omit<DoctorOnCallShift, 'id'>> }) => void
    deleteShift: (id: string) => void
    currentUser: MockAccount | null
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState<{
        doctorId: string
        date: string
        startTime: string
        endTime: string
    }>({
        doctorId: '',
        date: '',
        startTime: '08:00',
        endTime: '17:00',
    })

    // Initialize formState.doctorId based on currentUser if Doctor
    useEffect(() => {
        if (currentUser?.role === 'Doctor' && currentUser.referenceId) {
            setFormState(prev => ({ ...prev, doctorId: currentUser.referenceId }));
        }
    }, [currentUser]);

    const { addToast } = useToast()
    const { confirm } = useConfirm()
    const isDoctor = currentUser?.role === 'Doctor';

    const toMinutes = (value: string) => {
        const [hh, mm] = value.split(':').map(Number)
        return (hh ?? 0) * 60 + (mm ?? 0)
    }

    const isHolidayKey = (dateKey: string) => {
        return holidays.find((h) => {
            if (h.isRecurring) {
                return h.date.slice(5) === dateKey.slice(5)
            }
            return h.date === dateKey
        })
    }

    const filteredShifts = useMemo(() => {
        const searchValue = searchTerm.trim().toLowerCase()
        if (!searchValue) {
            return shifts
        }
        return shifts.filter((shift) => {
            const doctor = doctors.find((d) => d.id === shift.doctorId)
            const doctorText = doctor
                ? `${doctor.fullName} ${doctor.specialty} ${doctor.room} ${doctor.licenseNumber}`.toLowerCase()
                : shift.doctorName.toLowerCase()
            return doctorText.includes(searchValue) || shift.date.includes(searchValue)
        })
    }, [doctors, shifts, searchTerm])

    const sortedShifts = useMemo(() => {
        let resultShifts = filteredShifts;
        if (isDoctor && currentUser?.referenceId) {
            resultShifts = resultShifts.filter(shift => shift.doctorId === currentUser.referenceId);
        }
        return [...resultShifts].sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date)
            if (dateCompare !== 0) {
                return dateCompare
            }
            const doctorCompare = a.doctorName.localeCompare(b.doctorName)
            if (doctorCompare !== 0) {
                return doctorCompare
            }
            return a.startTime.localeCompare(b.startTime)
        })
    }, [filteredShifts])

    const sortedHolidays = useMemo(() => {
        return [...holidays].sort((a, b) => a.date.localeCompare(b.date))
    }, [holidays])

    const resetModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormState({ doctorId: '', date: '', startTime: '08:00', endTime: '17:00' })
    }

    const openCreateModal = () => {
        setEditingId(null)
        const defaultDoctorId = isDoctor && currentUser?.referenceId
            ? currentUser.referenceId
            : doctors.find((doctor) => doctor.status === 'active')?.id ?? doctors[0]?.id ?? '';

        setFormState({ doctorId: defaultDoctorId, date: '', startTime: '08:00', endTime: '17:00' })
        setIsModalOpen(true)
    }

    const openEditModal = (shift: DoctorOnCallShift) => {
        setEditingId(shift.id)
        setFormState({
            doctorId: shift.doctorId,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
        })
        setIsModalOpen(true)
    }

    const handleSave = () => {
        const doctor = doctors.find((d) => d.id === formState.doctorId)
        if (!doctor || !formState.date || !formState.startTime || !formState.endTime) {
            addToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc.')
            return
        }

        const holiday = isHolidayKey(formState.date)
        if (holiday) {
            addToast('error', `Không thể đăng ký lịch trực vào ngày nghỉ: ${holiday.name} (${formatDate(formState.date)}).`)
            return
        }

        const startMinutes = toMinutes(formState.startTime)
        const endMinutes = toMinutes(formState.endTime)
        if (endMinutes <= startMinutes) {
            addToast('error', 'Giờ kết thúc phải sau giờ bắt đầu.')
            return
        }

        const overlaps = shifts.some((shift) => {
            if (editingId && shift.id === editingId) {
                return false
            }
            if (shift.doctorId !== formState.doctorId || shift.date !== formState.date) {
                return false
            }
            const existingStart = toMinutes(shift.startTime)
            const existingEnd = toMinutes(shift.endTime)
            return startMinutes < existingEnd && endMinutes > existingStart
        })

        if (overlaps) {
            addToast('error', 'Ca trực bị trùng với ca trực khác của bác sĩ trong ngày này.')
            return
        }

        if (editingId) {
            updateShift({
                id: editingId,
                data: {
                    doctorId: doctor.id,
                    doctorName: doctor.fullName,
                    date: formState.date,
                    startTime: formState.startTime,
                    endTime: formState.endTime,
                }
            })
        } else {
            createShift({
                doctorId: doctor.id,
                doctorName: doctor.fullName,
                date: formState.date,
                startTime: formState.startTime,
                endTime: formState.endTime,
            })
        }
        resetModal()
    }

    const handleDelete = async (shift: DoctorOnCallShift) => {
        const confirmed = await confirm({
            title: 'Xóa ca trực',
            message: `Bạn có chắc muốn xóa ca trực của "${shift.doctorName}" ngày ${formatDate(shift.date)}?`,
            isDangerous: true,
        })
        if (!confirmed) {
            return
        }
        deleteShift(shift.id)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <div className="font-semibold text-slate-900">Ngày nghỉ phòng khám</div>
                {sortedHolidays.length === 0 ? (
                    <div className="mt-1 text-slate-600">Chưa có ngày nghỉ. Vui lòng cấu hình ở mục "Cài đặt ngày nghỉ".</div>
                ) : (
                    <div className="mt-2 space-y-1 text-slate-700">
                        {sortedHolidays.slice(0, 6).map((h) => (
                            <div key={h.id} className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium">{h.name}</span>
                                <span className="text-slate-600">{formatDate(h.date)}{h.isRecurring ? ' (lặp lại)' : ''}</span>
                            </div>
                        ))}
                        {sortedHolidays.length > 6 ? (
                            <div className="pt-1 text-xs text-slate-500">+{sortedHolidays.length - 6} ngày nghỉ khác</div>
                        ) : null}
                        <div className="pt-2 text-xs text-slate-500">
                            Lưu ý: Ngày nghỉ là nghỉ toàn phòng khám; lịch trực theo thứ vẫn giữ nguyên nhưng các ngày nghỉ sẽ được loại trừ khi đặt lịch hẹn.
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={isDoctor ? "Tìm theo ngày (YYYY-MM-DD)" : "Tìm theo tên bác sĩ hoặc ngày (YYYY-MM-DD)"}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm"
                    />
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white"
                    disabled={isDoctor && !currentUser?.referenceId} // Disable if doctor and no referenceId
                >
                    <Plus className="h-4 w-4" /> Đăng ký lịch trực
                </button>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6"><TableLoadingSkeleton rows={10} /></div>
            ) : sortedShifts.length === 0 ? (
                <EmptyState title="Chưa có ca trực" />
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50">
                                <th className="px-4 py-3 font-semibold text-slate-700">Ngày</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Bác sĩ</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Giờ trực</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {sortedShifts.map((shift) => (
                                <tr key={shift.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-700">
                                        <div className="font-medium text-slate-900">{formatDate(shift.date)}</div>
                                        <div className="text-xs text-slate-500">{shift.date}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{shift.doctorName}</div>
                                        {(() => {
                                            const doctor = doctors.find((d) => d.id === shift.doctorId)
                                            if (!doctor) {
                                                return null
                                            }
                                            return <div className="text-xs text-slate-500">{doctor.specialty} • {doctor.room} • {formatPhone(doctor.phone)}</div>
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{shift.startTime} - {shift.endTime}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(shift)} // Doctor can edit their own shifts
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:text-blue-600"
                                                title="Sửa"
                                                disabled={isDoctor && shift.doctorId !== currentUser?.referenceId}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => void handleDelete(shift)}
                                                disabled={isDoctor && shift.doctorId !== currentUser?.referenceId} // Doctor can delete their own shifts
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:text-rose-600"
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

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold">{editingId ? 'Sửa lịch trực bác sĩ' : 'Đăng ký lịch trực bác sĩ'}</h3>
                            <button onClick={resetModal} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>

                        {sortedHolidays.length > 0 ? (
                            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-sm font-semibold text-slate-900">Ngày nghỉ phòng khám (tham chiếu)</div>
                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    {sortedHolidays.slice(0, 4).map((h) => (
                                        <div key={h.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                                            <div className="font-medium text-slate-900">{h.name}</div>
                                            <div className="mt-0.5 text-slate-600">{formatDate(h.date)}{h.isRecurring ? ' (lặp lại)' : ''}</div>
                                        </div>
                                    ))}
                                </div>
                                {sortedHolidays.length > 4 ? (
                                    <div className="mt-2 text-xs text-slate-500">+{sortedHolidays.length - 4} ngày nghỉ khác</div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium">Bác sĩ *</label>
                                <select
                                    value={formState.doctorId}
                                    onChange={(event) => setFormState((state) => ({ ...state, doctorId: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border bg-white p-2 text-sm"
                                    disabled={isDoctor} // Disable doctor selection for doctors
                                >
                                    <option value="">Chọn bác sĩ</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.fullName} - {doctor.specialty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium">Ngày trực *</label>
                                    <input
                                        type="date"
                                        value={formState.date}
                                        onChange={(event) => setFormState((state) => ({ ...state, date: event.target.value }))}
                                        className="mt-1 w-full rounded-lg border p-2 text-sm"
                                    />
                                    <div className="mt-1 text-xs text-slate-500">Lưu theo ngày cụ thể; không tự lặp tuần sau.</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium">Giờ bắt đầu *</label>
                                        <input
                                            type="time"
                                            value={formState.startTime}
                                            onChange={(event) => setFormState((state) => ({ ...state, startTime: event.target.value }))}
                                            className="mt-1 w-full rounded-lg border p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Giờ kết thúc *</label>
                                        <input
                                            type="time"
                                            value={formState.endTime}
                                            onChange={(event) => setFormState((state) => ({ ...state, endTime: event.target.value }))}
                                            className="mt-1 w-full rounded-lg border p-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={resetModal} className="rounded-lg border px-4 py-2 text-sm font-medium">Hủy</button>
                            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                                {editingId ? 'Cập nhật' : 'Đăng ký'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
// #endregion

// #region Simple CRUD View (for Shifts and Holidays)
type CrudItem = { id: string; [key: string]: unknown }
type FieldConfig = {
    key: string
    label: string
    type: 'text' | 'time' | 'date' | 'checkbox'
    placeholder?: string
}

function SimpleCrudView<T extends CrudItem>({
    title,
    data,
    setData,
    columns,
    fields,
    initialFormState,
}: {
    title: string
    data: T[]
    setData: React.Dispatch<React.SetStateAction<T[]>>
    columns: { key: keyof T; label: string; render?: (item: T) => React.ReactNode }[]
    fields: FieldConfig[]
    initialFormState: Omit<T, 'id'>
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState<Omit<T, 'id'>>(initialFormState)

    const { addToast } = useToast()
    const { confirm } = useConfirm()

    const resetModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormState(initialFormState)
    }

    const openCreateModal = () => {
        resetModal()
        setIsModalOpen(true)
    }

    const openEditModal = (item: T) => {
        setEditingId(item.id)
        const { id: _id, ...rest } = item as unknown as { id: string } & Record<string, unknown>
        void _id
        const stateToEdit: Record<string, unknown> = { ...rest }
        fields.forEach((field) => {
            if (field.type === 'date' && stateToEdit[field.key]) {
                const raw = stateToEdit[field.key]
                if (typeof raw === 'string' || typeof raw === 'number' || raw instanceof Date) {
                    stateToEdit[field.key] = new Date(raw).toISOString().split('T')[0]
                }
            }
        })
        setFormState(stateToEdit as Omit<T, 'id'>)
        setIsModalOpen(true)
    }

    const handleSave = () => {
        if (editingId) {
            setData(prev => prev.map(item => item.id === editingId ? { ...item, ...formState } : item))
            addToast('success', `Cập nhật ${title.toLowerCase()} thành công`)
        } else {
            const newItem = { id: `${title.toLowerCase()}-${Date.now()}`, ...formState } as T
            setData(prev => [newItem, ...prev])
            addToast('success', `Thêm ${title.toLowerCase()} thành công`)
        }
        resetModal()
    }

    const handleDelete = async (item: T) => {
        const confirmed = await confirm({ title: `Xóa ${title}`, message: `Bạn có chắc muốn xóa "${item.name || item.id}"?`, isDangerous: true })
        if (confirmed) {
            setData(prev => prev.filter(d => d.id !== item.id))
            addToast('success', `Xóa ${title.toLowerCase()} thành công`)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={openCreateModal} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" /> Thêm {title}
                </button>
            </div>

            {data.length === 0 ? (
                <EmptyState title={`Chưa có ${title.toLowerCase()}`} />
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50">
                                {columns.map(col => <th key={String(col.key)} className="px-4 py-3 font-semibold text-slate-700">{col.label}</th>)}
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {data.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    {columns.map(col => (
                                        <td key={`${item.id}-${String(col.key)}`} className="px-4 py-3 text-slate-700">
                                            {col.render ? col.render(item) : String(item[col.key] ?? '')}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEditModal(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold">{editingId ? `Sửa ${title}` : `Thêm ${title}`}</h3>
                            <button onClick={resetModal} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            {fields.map(field => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium">
                                        {field.type === 'checkbox' ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!!formState[field.key]}
                                                    onChange={e => setFormState(s => ({ ...s, [field.key]: e.target.checked }))}
                                                />
                                                <span>{field.label}</span>
                                            </div>
                                        ) : (
                                            <>
                                                {field.label}
                                                <input
                                                    type={field.type}
                                                    value={String(formState[field.key] ?? '')}
                                                    onChange={e => setFormState(s => ({ ...s, [field.key]: e.target.value }))}
                                                    className="mt-1 w-full rounded-lg border p-2 text-sm"
                                                    placeholder={field.placeholder}
                                                />
                                            </>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={resetModal} className="rounded-lg border px-4 py-2 text-sm font-medium">Hủy</button>
                            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function WorkShiftSettingsView({ data, setData }: { data: MockWorkShift[]; setData: React.Dispatch<React.SetStateAction<MockWorkShift[]>> }) {
    return (
        <SimpleCrudView<MockWorkShift>
            title="Ca làm việc"
            data={data}
            setData={setData}
            columns={[
                { key: 'name', label: 'Tên ca' },
                { key: 'startTime', label: 'Giờ bắt đầu' },
                { key: 'endTime', label: 'Giờ kết thúc' },
            ]}
            fields={[
                { key: 'name', label: 'Tên ca', type: 'text' },
                { key: 'startTime', label: 'Giờ bắt đầu', type: 'time' },
                { key: 'endTime', label: 'Giờ kết thúc', type: 'time' },
            ]}
            initialFormState={{ name: '', startTime: '08:00', endTime: '17:00' }}
        />
    )
}

function HolidaySettingsView({ data, setData }: { data: MockClinicHoliday[]; setData: React.Dispatch<React.SetStateAction<MockClinicHoliday[]>> }) {
    return (
        <SimpleCrudView<MockClinicHoliday>
            title="Ngày nghỉ"
            data={data}
            setData={setData}
            columns={[
                { key: 'name', label: 'Tên ngày nghỉ' },
                { key: 'date', label: 'Ngày', render: (item) => formatDate(item.date) },
                { key: 'isRecurring', label: 'Lặp lại hàng năm', render: (item) => item.isRecurring ? 'Có' : 'Không' },
            ]}
            fields={[
                { key: 'name', label: 'Tên ngày nghỉ', type: 'text' },
                { key: 'date', label: 'Ngày', type: 'date' },
                { key: 'isRecurring', label: 'Lặp lại hàng năm', type: 'checkbox' },
            ]}
            initialFormState={{ name: '', date: new Date().toISOString().split('T')[0], isRecurring: false }}
        />
    )
}
// #endregion

// #region Appointment Booking View
function AppointmentBookingView({
    isLoading,
    appointments,
    patients,
    doctors,
    services,
    holidays,
    doctorShifts,
    createAppointment,
    updateAppointment,
    currentUser, // Accept currentUser prop
}: {
    isLoading: boolean
    appointments: MockAppointment[]
    patients: MockPatient[]
    doctors: MockDoctor[]
    services: MockService[]
    holidays: MockClinicHoliday[]
    doctorShifts: DoctorOnCallShift[]
    createAppointment: (data: Omit<MockAppointment, 'id'>) => void
    updateAppointment: (params: { id: string; data: Partial<MockAppointment> }) => void
    currentUser: MockAccount | null
}) {
    const [doctorFilter, setDoctorFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

    const { addToast } = useToast()
    const { confirm } = useConfirm()
    const isDoctor = currentUser?.role === 'Doctor';

    type AppointmentFormState = {
        patientId: string
        doctorId: string
        serviceId: string
        startTime: string
        notes: string
        status: MockAppointment['status']
    }

    const initialFormState: AppointmentFormState = {
        patientId: '',
        doctorId: '',
        serviceId: '',
        startTime: '',
        notes: '',
        status: 'Đã lên lịch',
    }

    // Initialize formState.doctorId based on currentUser if Doctor
    useEffect(() => {
        if (isDoctor && currentUser?.referenceId) {
            setFormState(prev => ({ ...prev, doctorId: currentUser.referenceId }));
        }
    }, [isDoctor, currentUser]);
    const [formState, setFormState] = useState<AppointmentFormState>(initialFormState)

    const isClinicHoliday = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateKey = `${year}-${month}-${day}`

        return holidays.find((h) => {
            if (h.isRecurring) {
                return h.date.slice(5) === dateKey.slice(5)
            }
            return h.date === dateKey
        })
    }

    const getLocalDateKey = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const toMinutes = (value: string) => {
        const [hh, mm] = value.split(':').map(Number)
        return (hh ?? 0) * 60 + (mm ?? 0)
    }

    const getTimeKey = (date: Date) => {
        const hh = String(date.getHours()).padStart(2, '0')
        const mm = String(date.getMinutes()).padStart(2, '0')
        return `${hh}:${mm}`
    }

    const isWithinDoctorShift = (doctorId: string, startTime: Date, endTime: Date) => {
        const dateKey = getLocalDateKey(startTime)
        const startMinutes = toMinutes(getTimeKey(startTime))
        const endMinutes = toMinutes(getTimeKey(endTime))

        const candidates = doctorShifts.filter((shift) => shift.doctorId === doctorId && shift.date === dateKey)
        return candidates.some((shift) => {
            const shiftStart = toMinutes(shift.startTime)
            const shiftEnd = toMinutes(shift.endTime)
            return startMinutes >= shiftStart && endMinutes <= shiftEnd
        })
    }

    const filteredAppointments = useMemo(() => {
        let result = appointments
            .filter(a => doctorFilter === 'all' || a.doctorId === doctorFilter)
            .filter(a => statusFilter === 'all' || a.status === statusFilter)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

        if (isDoctor && currentUser?.referenceId) {
            result = result.filter(apt => apt.doctorId === currentUser.referenceId);
        }

        return result;
    }, [appointments, doctorFilter, statusFilter])

    const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE))
    const paginatedAppointments = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredAppointments.slice(start, start + PAGE_SIZE)
    }, [filteredAppointments, page])

    const calendarEvents = useMemo(() => {
        return filteredAppointments.map(apt => {
            let color = '#3b82f6' // blue-500 for 'Đã lên lịch'
            let textColor = '#ffffff'
            if (apt.status === 'Đã hoàn thành') {
                color = '#10b981' // emerald-500
            }
            if (apt.status === 'Đã hủy') {
                color = '#fecaca' // rose-200
                textColor = '#991b1b' // rose-800
            }
            
            return {
                id: apt.id,
                title: `${apt.patientName} - ${apt.serviceName}`,
                start: apt.startTime,
                end: apt.endTime,
                backgroundColor: color,
                borderColor: color,
                textColor: textColor,
                extendedProps: apt,
            }
        })
    }, [filteredAppointments])

    const getStatusBadgeClass = (status: MockAppointment['status']) => {
        switch (status) {
            case 'Đã hoàn thành': return 'bg-emerald-100 text-emerald-900'
            case 'Đã hủy': return 'bg-rose-100 text-rose-900'
            case 'Đã lên lịch':
            default:
                return 'bg-blue-100 text-blue-900'
        }
    }

    const resetModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormState(initialFormState)
    }

    const openCreateModal = () => {
        resetModal()
        setIsModalOpen(true)
    }

    const openEditModal = (apt: MockAppointment) => {
        setEditingId(apt.id)
        setFormState({
            patientId: apt.patientId,
            doctorId: apt.doctorId,
            serviceId: apt.serviceId,
            startTime: formatDateTimeLocal(apt.startTime),
            notes: apt.notes,
            status: apt.status,
        })
        setIsModalOpen(true)
    }

    const handleDateClick = (arg: DateClickArg) => {
        const holiday = isClinicHoliday(arg.date)
        if (holiday) {
            addToast('error', `Ngày ${formatDate(arg.date)} là ngày nghỉ: ${holiday.name}. Vui lòng chọn ngày khác.`)
            return
        }

        openCreateModal()
        const startTime = new Date(arg.date)
        if (arg.allDay) {
            startTime.setHours(9, 0, 0, 0)
        }
        setFormState(prev => ({
            ...prev,
            startTime: formatDateTimeLocal(startTime)
        }))
    }

    const handleEventClick = (arg: EventClickArg) => {
        openEditModal(arg.event.extendedProps as unknown as MockAppointment)
    }

    const handleSave = () => {
        const patient = patients.find(p => p.id === formState.patientId)
        const doctor = doctors.find(d => d.id === formState.doctorId)
        const service = services.find(s => s.id === formState.serviceId)

        if (!patient || !doctor || !service || !formState.startTime) {
            addToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc.')
            return
        }

        const startTime = new Date(formState.startTime)
        const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000)

        const original = editingId ? appointments.find((a) => a.id === editingId) : undefined
        const scheduleInputsChanged = !original
            ? true
            : (
                original.doctorId !== formState.doctorId ||
                original.serviceId !== formState.serviceId ||
                formatDateTimeLocal(original.startTime) !== formState.startTime
            )

        if (scheduleInputsChanged) {
            const holiday = isClinicHoliday(startTime)
            if (holiday) {
                addToast('error', `Không thể đặt lịch vào ngày nghỉ: ${holiday.name} (${formatDate(startTime)}).`)
                return
            }

            if (!isWithinDoctorShift(doctor.id, startTime, endTime)) {
                addToast('error', `Bác sĩ chưa đăng ký ca trực cho ${formatDate(startTime)} (khung giờ ${getTimeKey(startTime)}-${getTimeKey(endTime)}).`)
                return
            }

            const hasOverlap = appointments.some((apt) => {
                if (editingId && apt.id === editingId) {
                    return false
                }
                if (apt.doctorId !== doctor.id || apt.status === 'Đã hủy') {
                    return false
                }
                const existingStart = new Date(apt.startTime)
                const existingEnd = new Date(apt.endTime)
                return startTime < existingEnd && endTime > existingStart
            })

            if (hasOverlap) {
                addToast('error', 'Lịch hẹn bị trùng giờ với lịch hẹn khác của bác sĩ.')
                return
            }
        }

        if (editingId) {
            updateAppointment({ id: editingId, data: {
                ...formState,
                patientName: patient.fullName,
                doctorName: doctor.fullName,
                serviceName: service.name,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            }})
        } else {
            createAppointment({
                patientId: patient.id,
                patientName: patient.fullName,
                doctorId: doctor.id,
                doctorName: doctor.fullName,
                serviceId: service.id,
                serviceName: service.name,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                notes: formState.notes,
                status: 'Đã lên lịch',
            })
        }
        resetModal()
    }

    const handleUpdateStatus = async (apt: MockAppointment, status: MockAppointment['status']) => {
        const confirmed = await confirm({
            title: `${status} lịch hẹn`,
            message: `Bạn có chắc muốn ${status.toLowerCase()} lịch hẹn cho "${apt.patientName}"?`,
            isDangerous: status === 'Đã hủy',
        })
        if (confirmed) {
            updateAppointment({ id: apt.id, data: { status } })
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-3 text-sm font-medium text-slate-700"
                        title={viewMode === 'calendar' ? 'Chuyển sang dạng danh sách' : 'Chuyển sang dạng lịch'}
                    >
                        {viewMode === 'calendar' ? <List className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                        <span className="hidden sm:inline">{viewMode === 'calendar' ? 'Dạng danh sách' : 'Dạng lịch'}</span>
                    </button>

                    <select
                        value={doctorFilter}
                        onChange={e => { setDoctorFilter(e.target.value); setPage(1); }}
                        className="h-10 rounded-xl border bg-white px-3 text-sm"
                        disabled={isDoctor} // Disable doctor filter for doctors
                    >
                        <option value="all">Tất cả bác sĩ</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="h-10 rounded-xl border bg-white px-3 text-sm"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option>Đã lên lịch</option>
                        <option>Đã hoàn thành</option>
                        <option>Đã hủy</option>
                    </select>
                </div>
                <button onClick={openCreateModal} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" /> Tạo lịch hẹn
                    {/* Doctors can create appointments for their own schedule */}
                </button>
            </div>

            {viewMode === 'calendar' ? (
                 <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={calendarEvents}
                        locale="vi"
                        buttonText={{
                            today: 'Hôm nay',
                            month: 'Tháng',
                            week: 'Tuần',
                            day: 'Ngày',
                        }}
                        allDaySlot={false}
                        slotMinTime="07:00:00"
                        slotMaxTime="21:00:00"
                        editable={true}
                        selectable={true}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        height="auto"
                    />
                </div>
            ) : (
                <>
                    {isLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6"><TableLoadingSkeleton rows={PAGE_SIZE} /></div>
                    ) : paginatedAppointments.length === 0 ? (
                        <EmptyState title="Không có lịch hẹn" />
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b bg-slate-50">
                                        <th className="px-4 py-3 font-semibold">Thời gian</th>
                                        <th className="px-4 py-3 font-semibold">Bệnh nhân</th>
                                        <th className="px-4 py-3 font-semibold">Bác sĩ</th>
                                        <th className="px-4 py-3 font-semibold">Dịch vụ</th>
                                        <th className="px-4 py-3 font-semibold">Trạng thái</th>
                                        <th className="px-4 py-3 text-right font-semibold">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paginatedAppointments.map(apt => (
                                        <tr key={apt.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{formatDateTime(apt.startTime)}</td>
                                            <td className="px-4 py-3">{apt.patientName}</td>
                                            <td className="px-4 py-3">{apt.doctorName}</td>
                                            <td className="px-4 py-3">{apt.serviceName}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(apt.status)}`}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditModal(apt)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                                    {/* Doctors can only update status for their own appointments */}
                                                    {apt.status === 'Đã lên lịch' && (!isDoctor || apt.doctorId === currentUser?.referenceId) && (
                                                        <>
                                                            {/* Only Admin/Reception or the doctor themselves can mark as complete/cancel */}
                                                            <button onClick={() => handleUpdateStatus(apt, 'Đã hoàn thành')} className="inline-flex h-8 items-center rounded-lg border bg-emerald-50 px-2 text-xs text-emerald-700">Hoàn thành</button>
                                                            <button onClick={() => handleUpdateStatus(apt, 'Đã hủy')} className="inline-flex h-8 items-center rounded-lg border bg-rose-50 px-2 text-xs text-rose-700">Hủy</button>
                                                        </>
                                                    )}
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
                        <span className="text-slate-600">Trang {page}/{totalPages} - Tổng {filteredAppointments.length} lịch hẹn</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border px-3 py-2 disabled:opacity-50">Trước</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border px-3 py-2 disabled:opacity-50">Tiếp</button>
                        </div>
                    </div>
                </>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold">{editingId ? 'Sửa lịch hẹn' : 'Tạo lịch hẹn mới'}</h3>
                            <button onClick={resetModal} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Bệnh nhân *</label>
                                <select value={formState.patientId} onChange={e => setFormState(s => ({ ...s, patientId: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
                                    <option value="">Chọn bệnh nhân</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Dịch vụ *</label>
                                <select value={formState.serviceId} onChange={e => setFormState(s => ({ ...s, serviceId: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
                                    <option value="">Chọn dịch vụ</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({formatVND(s.basePrice)})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bác sĩ *</label>
                                <select value={formState.doctorId} onChange={e => setFormState(s => ({ ...s, doctorId: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
                                    <option value="">Chọn bác sĩ</option>
                                    {/* If doctor, only show their own ID */}
                                    {doctors.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.fullName} ({d.specialty})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Ngày & Giờ hẹn *</label>
                                <input type="datetime-local" value={formState.startTime} onChange={e => setFormState(s => ({ ...s, startTime: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Ghi chú</label>
                                <textarea value={formState.notes} onChange={e => setFormState(s => ({ ...s, notes: e.target.value }))} rows={3} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                            </div>
                            {editingId && (
                                <div>
                                    {/* Only Admin/Reception or the doctor themselves can change status */}
                                    <label className="block text-sm font-medium">Trạng thái</label>
                                    <select
                                        value={formState.status}
                                        onChange={(e) =>
                                            setFormState((s) => ({
                                                ...s,
                                                status: e.target.value as MockAppointment['status'],
                                            }))
                                        }
                                        className="mt-1 w-full rounded-lg border bg-white p-2 text-sm"
                                    >
                                        <option>Đã lên lịch</option>
                                        <option>Đã hoàn thành</option>
                                        <option>Đã hủy</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={resetModal} className="rounded-lg border px-4 py-2 text-sm font-medium">Hủy</button>
                            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
// #endregion