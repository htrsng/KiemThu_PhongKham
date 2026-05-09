import { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
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
import { useConfirm } from '../contexts/ConfirmContext'
import { EmptyState } from '../components/EmptyState'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { formatDate, formatDateTime, formatPhone, formatVND } from '../lib/formatters'

type SubPage = 'appointments' | 'patients' | 'doctor-schedule' | 'work-shifts' | 'holidays'

const menuItems: { id: SubPage; label: string; icon: React.ElementType }[] = [
    { id: 'appointments', label: 'Lịch hẹn', icon: CalendarIcon },
    { id: 'patients', label: 'Quản lý Bệnh nhân', icon: Users },
    { id: 'doctor-schedule', label: 'Lịch trực bác sĩ', icon: Clock },
    { id: 'work-shifts', label: 'Cài đặt ca làm việc', icon: SlidersHorizontal },
    { id: 'holidays', label: 'Cài đặt ngày nghỉ', icon: CalendarOff },
]

const DOCTOR_SCHEDULE_DAYS = [
    { key: 'T2', label: 'Thứ 2' },
    { key: 'T3', label: 'Thứ 3' },
    { key: 'T4', label: 'Thứ 4' },
    { key: 'T5', label: 'Thứ 5' },
    { key: 'T6', label: 'Thứ 6' },
    { key: 'T7', label: 'Thứ 7' },
    { key: 'CN', label: 'Chủ nhật' },
] as const

type DoctorScheduleDayKey = (typeof DOCTOR_SCHEDULE_DAYS)[number]['key']

type DoctorScheduleState = Record<DoctorScheduleDayKey, { enabled: boolean; startTime: string; endTime: string }>

const createDefaultDoctorSchedule = (): DoctorScheduleState => ({
    T2: { enabled: true, startTime: '08:00', endTime: '17:00' },
    T3: { enabled: true, startTime: '08:00', endTime: '17:00' },
    T4: { enabled: true, startTime: '08:00', endTime: '17:00' },
    T5: { enabled: true, startTime: '08:00', endTime: '17:00' },
    T6: { enabled: true, startTime: '08:00', endTime: '17:00' },
    T7: { enabled: false, startTime: '08:00', endTime: '12:00' },
    CN: { enabled: false, startTime: '08:00', endTime: '12:00' },
})

const cloneDoctorSchedule = (schedule?: MockDoctor['schedule']): DoctorScheduleState => {
    const defaultSchedule = createDefaultDoctorSchedule()

    if (!schedule) {
        return defaultSchedule
    }

    return DOCTOR_SCHEDULE_DAYS.reduce((accumulator, day) => {
        const source = schedule[day.key]
        accumulator[day.key] = source
            ? {
                enabled: source.enabled,
                startTime: source.startTime,
                endTime: source.endTime,
            }
            : defaultSchedule[day.key]
        return accumulator
    }, {} as DoctorScheduleState)
}

const PAGE_SIZE = 10

export function AppointmentManagementPage() {
    const [activeSubPage, setActiveSubPage] = useState<SubPage>('appointments')
    const [isLoading, setIsLoading] = useState(true)

    // Data states
    const [patients, setPatients] = useState<MockPatient[]>([])
    const [appointments, setAppointments] = useState<MockAppointment[]>([])
    const [workShifts, setWorkShifts] = useState<MockWorkShift[]>([])
    const [holidays, setHolidays] = useState<MockClinicHoliday[]>([])
    const [doctors, setDoctors] = useState<MockDoctor[]>([])
    const [services, setServices] = useState<MockService[]>([])

    useEffect(() => {
        const timer = setTimeout(() => {
            setPatients(generateMockPatients(30))
            setAppointments(generateMockAppointments(50))
            setWorkShifts(generateMockWorkShifts())
            setHolidays(generateMockClinicHolidays())
            setDoctors(generateMockDoctors(10))
            setServices(generateMockServices(10))
            setIsLoading(false)
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <TableLoadingSkeleton rows={PAGE_SIZE} />
                </div>
            )
        }

        switch (activeSubPage) {
            case 'patients':
                return <PatientManagementView data={patients} setData={setPatients} />
            case 'doctor-schedule':
                return <DoctorScheduleView data={doctors} setData={setDoctors} />
            case 'work-shifts':
                return <WorkShiftSettingsView data={workShifts} setData={setWorkShifts} />
            case 'holidays':
                return <HolidaySettingsView data={holidays} setData={setHolidays} />
            case 'appointments':
            default:
                return (
                    <AppointmentBookingView
                        appointments={appointments}
                        setAppointments={setAppointments}
                        patients={patients}
                        doctors={doctors}
                        services={services}
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
                        {menuItems.map((item) => (
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
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState({ fullName: '', phone: '', dateOfBirth: '', gender: 'Nam' as const, address: '' })
    const [formErrors, setFormErrors] = useState<Partial<typeof formState>>({})

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
        const errors: Partial<typeof formState> = {}
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
                                    <select value={formState.gender} onChange={e => setFormState(s => ({ ...s, gender: e.target.value as any }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
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
function DoctorScheduleView({ data, setData }: { data: MockDoctor[]; setData: React.Dispatch<React.SetStateAction<MockDoctor[]>> }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState({
        doctorId: '',
        schedule: createDefaultDoctorSchedule(),
    })

    const { addToast } = useToast()

    const filteredDoctors = useMemo(() => {
        return data.filter((doctor) => {
            const searchValue = searchTerm.toLowerCase()
            return (
                doctor.fullName.toLowerCase().includes(searchValue) ||
                doctor.specialty.toLowerCase().includes(searchValue) ||
                doctor.room.toLowerCase().includes(searchValue) ||
                doctor.licenseNumber.toLowerCase().includes(searchValue)
            )
        })
    }, [data, searchTerm])

    const resetModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setFormState({
            doctorId: '',
            schedule: createDefaultDoctorSchedule(),
        })
    }

    const openCreateModal = () => {
        const defaultDoctorId = data.find((doctor) => doctor.status === 'active')?.id ?? data[0]?.id ?? ''
        setEditingId(null)
        setFormState({
            doctorId: defaultDoctorId,
            schedule: createDefaultDoctorSchedule(),
        })
        setIsModalOpen(true)
    }

    const openEditModal = (doctor: MockDoctor) => {
        setEditingId(doctor.id)
        setFormState({
            doctorId: doctor.id,
            schedule: cloneDoctorSchedule(doctor.schedule),
        })
        setIsModalOpen(true)
    }

    const handleSave = () => {
        const targetDoctorId = formState.doctorId || editingId
        if (!targetDoctorId) {
            addToast('error', 'Vui lòng chọn bác sĩ cần đăng ký lịch trực.')
            return
        }

        setData((prev) =>
            prev.map((doctor) =>
                doctor.id === targetDoctorId
                    ? { ...doctor, schedule: cloneDoctorSchedule(formState.schedule) }
                    : doctor
            )
        )

        addToast('success', 'Đăng ký lịch trực bác sĩ thành công')
        resetModal()
    }

    const renderSummary = (schedule: DoctorScheduleState) => {
        const workingDays = DOCTOR_SCHEDULE_DAYS.filter((day) => schedule[day.key].enabled)

        if (workingDays.length === 0) {
            return 'Chưa đăng ký'
        }

        const firstShift = schedule[workingDays[0].key]
        const dayLabels = workingDays.map((day) => day.label).join(', ')

        return `${dayLabels} • ${firstShift.startTime} - ${firstShift.endTime}`
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Tìm theo tên, chuyên khoa, phòng..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm"
                    />
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white"
                >
                    <Plus className="h-4 w-4" /> Đăng ký lịch trực
                </button>
            </div>

            {filteredDoctors.length === 0 ? (
                <EmptyState title="Không tìm thấy bác sĩ" />
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50">
                                <th className="px-4 py-3 font-semibold text-slate-700">Bác sĩ</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Chuyên khoa</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Phòng</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Lịch trực</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">Trạng thái</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredDoctors.map((doctor) => {
                                const activeDays = DOCTOR_SCHEDULE_DAYS.filter((day) => doctor.schedule[day.key]?.enabled).length

                                return (
                                    <tr key={doctor.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{doctor.fullName}</div>
                                            <div className="text-xs text-slate-500">{doctor.licenseNumber} • {formatPhone(doctor.phone)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{doctor.specialty}</td>
                                        <td className="px-4 py-3 text-slate-700">{doctor.room}</td>
                                        <td className="px-4 py-3 text-slate-700">
                                            <div className="max-w-md text-xs leading-5 text-slate-600">
                                                {renderSummary(doctor.schedule as DoctorScheduleState)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${activeDays > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                                {activeDays > 0 ? `Đã đăng ký ${activeDays} ngày` : 'Chưa đăng ký'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(doctor)}
                                                    className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium text-slate-600 hover:text-blue-600"
                                                >
                                                    <Pencil className="h-4 w-4" /> Sửa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
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

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium">Bác sĩ *</label>
                                <select
                                    value={formState.doctorId}
                                    onChange={(event) => setFormState((state) => ({ ...state, doctorId: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border bg-white p-2 text-sm"
                                >
                                    <option value="">Chọn bác sĩ</option>
                                    {data.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.fullName} - {doctor.specialty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3 grid grid-cols-12 gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <div className="col-span-12 md:col-span-3">Ngày</div>
                                    <div className="col-span-12 md:col-span-2">Kích hoạt</div>
                                    <div className="col-span-6 md:col-span-3">Giờ bắt đầu</div>
                                    <div className="col-span-6 md:col-span-3">Giờ kết thúc</div>
                                </div>

                                <div className="space-y-3">
                                    {DOCTOR_SCHEDULE_DAYS.map((day) => {
                                        const dayState = formState.schedule[day.key]

                                        return (
                                            <div key={day.key} className="grid grid-cols-12 gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                <div className="col-span-12 md:col-span-3">
                                                    <div className="font-medium text-slate-900">{day.label}</div>
                                                    <div className="text-xs text-slate-500">{day.key}</div>
                                                </div>
                                                <div className="col-span-12 md:col-span-2 md:flex md:items-center">
                                                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={dayState.enabled}
                                                            onChange={(event) => setFormState((state) => ({
                                                                ...state,
                                                                schedule: {
                                                                    ...state.schedule,
                                                                    [day.key]: {
                                                                        ...state.schedule[day.key],
                                                                        enabled: event.target.checked,
                                                                    },
                                                                },
                                                            }))}
                                                        />
                                                        Có trực
                                                    </label>
                                                </div>
                                                <div className="col-span-6 md:col-span-3">
                                                    <label className="block text-xs font-medium text-slate-500">Bắt đầu</label>
                                                    <input
                                                        type="time"
                                                        value={dayState.startTime}
                                                        disabled={!dayState.enabled}
                                                        onChange={(event) => setFormState((state) => ({
                                                            ...state,
                                                            schedule: {
                                                                ...state.schedule,
                                                                [day.key]: {
                                                                    ...state.schedule[day.key],
                                                                    startTime: event.target.value,
                                                                },
                                                            },
                                                        }))}
                                                        className="mt-1 w-full rounded-lg border p-2 text-sm disabled:bg-slate-100"
                                                    />
                                                </div>
                                                <div className="col-span-6 md:col-span-3">
                                                    <label className="block text-xs font-medium text-slate-500">Kết thúc</label>
                                                    <input
                                                        type="time"
                                                        value={dayState.endTime}
                                                        disabled={!dayState.enabled}
                                                        onChange={(event) => setFormState((state) => ({
                                                            ...state,
                                                            schedule: {
                                                                ...state.schedule,
                                                                [day.key]: {
                                                                    ...state.schedule[day.key],
                                                                    endTime: event.target.value,
                                                                },
                                                            },
                                                        }))}
                                                        className="mt-1 w-full rounded-lg border p-2 text-sm disabled:bg-slate-100"
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
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
type CrudItem = { id: string; [key: string]: any }
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
        const stateToEdit = { ...item }
        delete stateToEdit.id
        fields.forEach(field => {
            if (field.type === 'date' && stateToEdit[field.key]) {
                stateToEdit[field.key] = new Date(stateToEdit[field.key]).toISOString().split('T')[0]
            }
        })
        setFormState(stateToEdit)
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
                                            {col.render ? col.render(item) : item[col.key]}
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
                                                    value={formState[field.key] || ''}
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
    appointments,
    setAppointments,
    patients,
    doctors,
    services,
}: {
    appointments: MockAppointment[]
    setAppointments: React.Dispatch<React.SetStateAction<MockAppointment[]>>
    patients: MockPatient[]
    doctors: MockDoctor[]
    services: MockService[]
}) {
    const [doctorFilter, setDoctorFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

    const { addToast } = useToast()
    const { confirm } = useConfirm()

    const initialFormState = {
        patientId: '',
        doctorId: '',
        serviceId: '',
        startTime: '',
        notes: '',
        status: 'Đã lên lịch' as const,
    }
    const [formState, setFormState] = useState(initialFormState)

    const filteredAppointments = useMemo(() => {
        return appointments
            .filter(a => doctorFilter === 'all' || a.doctorId === doctorFilter)
            .filter(a => statusFilter === 'all' || a.status === statusFilter)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
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
            startTime: formatDateTime(apt.startTime, true),
            notes: apt.notes,
            status: apt.status,
        })
        setIsModalOpen(true)
    }

    const handleDateClick = (arg: { date: Date; allDay: boolean }) => {
        openCreateModal()
        const startTime = new Date(arg.date)
        if (arg.allDay) {
            startTime.setHours(9, 0, 0, 0)
        }
        setFormState(prev => ({
            ...prev,
            startTime: formatDateTime(startTime.toISOString(), true)
        }))
    }

    const handleEventClick = (arg: { event: { extendedProps: MockAppointment } }) => {
        openEditModal(arg.event.extendedProps)
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

        if (editingId) {
            setAppointments(prev => prev.map(apt => apt.id === editingId ? {
                ...apt,
                ...formState,
                patientName: patient.fullName,
                doctorName: doctor.fullName,
                serviceName: service.name,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            } : apt))
            addToast('success', 'Cập nhật lịch hẹn thành công')
        } else {
            const newApt: MockAppointment = {
                id: `apt-${Date.now()}`,
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
            }
            setAppointments(prev => [newApt, ...prev])
            addToast('success', 'Tạo lịch hẹn thành công')
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
            setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status } : a))
            addToast('success', `Đã ${status.toLowerCase()} lịch hẹn.`)
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
                    {paginatedAppointments.length === 0 ? (
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
                                                    {apt.status === 'Đã lên lịch' && (
                                                        <>
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
                                    <label className="block text-sm font-medium">Trạng thái</label>
                                    <select value={formState.status} onChange={e => setFormState(s => ({ ...s, status: e.target.value as any }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
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