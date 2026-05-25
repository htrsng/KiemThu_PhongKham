import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import type { EventClickArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import {
    Plus,
    Trash2,
    Pencil,
    X,
    Users,
    AlertTriangle,
    Search,
    CalendarHeart,
    Clock,
    Wallet
} from 'lucide-react'
import { PageShell } from '../components/PageShell'
import type { MockAppointment, MockPatient, MockDoctor, MockService, MockClinicHoliday, MockAccount } from '../lib/mockData'
import { useToast } from '../contexts/ToastContext'
import { api, type ApiListResponse, type ApiItemResponse, type ApiDeleteResponse } from '../lib/api'
import { useConfirm } from '../contexts/ConfirmContext'
import { useAuth } from '../contexts/AuthContext' // Import useAuth
import { EmptyState } from '../components/EmptyState'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { formatDate, formatDateTime, formatDateTimeLocal, formatVND } from '../lib/formatters'


const PAGE_SIZE = 10;

type DoctorOnCallShift = {
    id: string 
    doctorId: string 
    doctorName: string 
    date: string 
    startTime: string 
    endTime: string 
    status: 'Đã đăng ký' | 'Đã hủy'
}

export function AppointmentManagementPage() {

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

    const { mutate: checkInAppointment } = useMutation<MockAppointment, Error, string>({
        mutationFn: async (id) => (await api.patch<ApiItemResponse<MockAppointment>>(`/appointments/${id}/checkin`)).data.data,
        onSuccess: (updatedApt) => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            addToast('success', `Đã check-in cho bệnh nhân ${updatedApt.patientName}.`);
        },
        onError: (err) => addToast('error', `Lỗi khi check-in: ${err.message}`),
    });

    const { mutate: createWalkIn } = useMutation<MockAppointment, Error, any>({
        mutationFn: async (data) => (await api.post<ApiItemResponse<MockAppointment>>(`/appointments/walk-in`, data)).data.data,
        onSuccess: (updatedApt) => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['patients'] }); // Refresh patients in case new one was created
            addToast('success', `Đã tiếp nhận và check-in cho khách vãng lai: ${updatedApt.patientName}.`);
        },
        onError: (err) => addToast('error', `Lỗi tạo vãng lai: ${err.message}`),
    });

    const { mutate: deleteAppointment } = useMutation<ApiDeleteResponse, Error, string>({
        mutationFn: async (id) => (await api.delete<ApiDeleteResponse>(`/appointments/${id}`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            addToast('success', 'Đã xóa vĩnh viễn lịch hẹn.');
        },
        onError: (err) => {
            addToast('error', `Lỗi khi xóa lịch hẹn: ${err.message}`);
        },
    });


    const { mutate: createInvoice } = useMutation<any, Error, any>({
        mutationFn: async (invoiceData) => (await api.post('/invoices', invoiceData)).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            addToast('info', 'Đã tạo hóa đơn chờ thanh toán.');
        },
        onError: (err) => {
            addToast('error', `Lỗi tạo hóa đơn: ${err.message}`);
        },
    });


    // Data states
    // --- Server-side data for Doctor Shifts ---
    const { data: doctorShifts = [], isLoading: shiftsIsLoading } = useQuery<DoctorOnCallShift[], Error>({
        queryKey: ['doctorShifts'],
        queryFn: async () => (await api.get<ApiListResponse<DoctorOnCallShift>>('/shifts')).data.data,
    });

    const { data: doctors = [], isLoading: doctorsIsLoading } = useQuery<MockDoctor[], Error>({
        queryKey: ['doctors'],
        queryFn: async () => (await api.get<ApiListResponse<MockDoctor>>('/doctors')).data.data,
    });

    const { data: patients = [], isLoading: patientsIsLoading } = useQuery<MockPatient[], Error>({
        queryKey: ['patients'],
        queryFn: async () => (await api.get<ApiListResponse<MockPatient>>('/patients')).data.data,
    });

    const { data: services = [], isLoading: servicesIsLoading } = useQuery<MockService[], Error>({
        queryKey: ['services'],
        queryFn: async () => (await api.get<ApiListResponse<MockService>>('/services')).data.data,
    });

    const { data: holidays = [], isLoading: holidaysIsLoading } = useQuery<MockClinicHoliday[], Error>({
        queryKey: ['holidays'],
        queryFn: async () => (await api.get<ApiListResponse<MockClinicHoliday>>('/holidays')).data.data,
    });

    return (
        <section>
            <PageShell
                title="Quản lý Lịch hẹn"
                description="Quản lý lịch hẹn và các cài đặt liên quan đến lịch làm việc."
                testId="page-appointments"
            />
            <div className="mt-6">
                <AppointmentBookingView
                    isLoading={appointmentsIsLoading || patientsIsLoading || doctorsIsLoading || servicesIsLoading || holidaysIsLoading || shiftsIsLoading}
                    appointments={appointments}
                    patients={patients}
                    doctors={doctors}
                    services={services}
                    holidays={holidays}
                    doctorShifts={doctorShifts}
                    createAppointment={createAppointment}
                    currentUser={currentUser}
                    updateAppointment={updateAppointment}
                    checkInAppointment={checkInAppointment}
                    createWalkIn={createWalkIn}
                    createInvoice={createInvoice}
                    deleteAppointment={deleteAppointment}
                />
            </div>
        </section>
    )
}

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
    checkInAppointment,
    currentUser, // Accept currentUser prop
    createWalkIn,
    createInvoice,
    deleteAppointment,
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
    checkInAppointment: (id: string) => void
    currentUser: MockAccount | null
    createWalkIn: (data: any) => void
    createInvoice: (data: any) => void
    deleteAppointment: (id: string) => void
}) {
    const [doctorFilter, setDoctorFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [page, setPage] = useState(1)

    // Walk-in modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const initialWalkInState = {
        patientPhone: '',
        patientName: '',
        patientAge: '',
        allergiesRaw: '',
        doctorId: '',
        serviceId: ''
    }
    const [walkInState, setWalkInState] = useState(initialWalkInState)

    // Auto fill walk in name if phone exists
    useEffect(() => {
        if (walkInState.patientPhone && walkInState.patientPhone.length >= 10) {
            const foundPat = patients.find(p => p.phone === walkInState.patientPhone)
            if (foundPat) {
                setWalkInState(s => ({
                    ...s,
                    patientName: foundPat.fullName,
                    patientAge: new Date().getFullYear() - new Date(foundPat.dateOfBirth).getFullYear() + '',
                    allergiesRaw: foundPat.allergies ? foundPat.allergies.join(', ') : ''
                }))
            }
        }
    }, [walkInState.patientPhone, patients])
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
        difficulty: number
        status: MockAppointment['status']
    }

    const initialFormState: AppointmentFormState = {
        patientId: '',
        doctorId: '',
        serviceId: '',
        startTime: '',
        notes: '',
        difficulty: 0,
        status: 'Đã lên lịch',
    }

    // Initialize formState.doctorId based on currentUser if Doctor
    useEffect(() => {
        if (isDoctor && currentUser?.referenceId) {
            setFormState(prev => ({ ...prev, doctorId: currentUser.referenceId || '' }));
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

    const isWithinDoctorShift = (doctor: MockDoctor, startTime: Date, endTime: Date) => {
        const dateKey = getLocalDateKey(startTime)
        const startMinutes = toMinutes(getTimeKey(startTime))
        const endMinutes = toMinutes(getTimeKey(endTime))

        // 1. Check for specific, registered shifts first (these can override the recurring schedule)
        const specificShifts = doctorShifts.filter((shift) => shift.doctorId === doctor.id && shift.date === dateKey)
        if (specificShifts.length > 0) {
            return specificShifts.some((shift) => {
                const shiftStart = toMinutes(shift.startTime)
                const shiftEnd = toMinutes(shift.endTime)
                return startMinutes >= shiftStart && endMinutes <= shiftEnd
            })
        }

        // 2. If no specific shift, check the doctor's recurring weekly schedule from DoctorManagementPage
        if (!doctor.schedule) {
            return false; // No recurring schedule defined
        }

        const dayKeys = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayKeyOfWeek = dayKeys[startTime.getDay()];
        const recurringShift = doctor.schedule[dayKeyOfWeek];

        if (recurringShift?.enabled) {
            const shiftStart = toMinutes(recurringShift.startTime);
            const shiftEnd = toMinutes(recurringShift.endTime);
            return startMinutes >= shiftStart && endMinutes <= shiftEnd;
        }

        return false // Not available in specific shifts or recurring schedule
    }

    const filteredAppointments = useMemo(() => {
        let result = appointments
            .filter(a => {
                if (dateFilter === 'today') {
                    const today = new Date();
                    const aptDate = new Date(a.startTime);
                    return today.getDate() === aptDate.getDate() &&
                           today.getMonth() === aptDate.getMonth() &&
                           today.getFullYear() === aptDate.getFullYear();
                }
                return true;
            })
            .filter(a => statusFilter === 'all' || a.status === statusFilter)
            .filter(a => {
                if (!searchTerm) return true;
                const lowerSearch = searchTerm.toLowerCase();
                return a.patientName.toLowerCase().includes(lowerSearch) || 
                       a.serviceName.toLowerCase().includes(lowerSearch);
            })
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

        if (isDoctor && currentUser?.referenceId) {
            result = result.filter(apt => apt.doctorId === currentUser.referenceId);
        }

        return result;
    }, [appointments, doctorFilter, statusFilter, dateFilter, isDoctor, currentUser])

    const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE))
    const paginatedAppointments = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredAppointments.slice(start, start + PAGE_SIZE)
    }, [filteredAppointments, page])

    const calendarEvents = useMemo(() => {
        return filteredAppointments.map(apt => {
            // Base colors by Status
            let color = '#f0fdfa' // teal-50 (Khám tổng quát/Mặc định)
            let textColor = '#0f766e' // teal-700
            let borderColor = '#ccfbf1' // teal-100
            
            // Override colors by Service (categorization)
            if (apt.serviceName.includes('Implant') || apt.serviceName.includes('Nhổ')) {
                color = '#fff1f2' // rose-50
                textColor = '#be123c' // rose-700
                borderColor = '#ffe4e6'
            } else if (apt.serviceName.includes('Niềng') || apt.serviceName.includes('Chỉnh nha')) {
                color = '#fdf4ff' // fuchsia-50
                textColor = '#a21caf' // fuchsia-700
                borderColor = '#fae8ff'
            } else if (apt.serviceName.includes('Tẩy trắng') || apt.serviceName.includes('Thẩm mỹ')) {
                color = '#f0f9ff' // sky-50
                textColor = '#0369a1' // sky-700
                borderColor = '#e0f2fe'
            }

            // Status overrides color if completed or cancelled
            if (apt.status === 'Đã hoàn thành') {
                color = '#f8fafc' // slate-50
                textColor = '#475569' // slate-600
                borderColor = '#e2e8f0'
            } else if (apt.status === 'Đã hủy') {
                color = '#fef2f2' // red-50
                textColor = '#b91c1c' // red-700
                borderColor = '#fee2e2'
            }

            return {
                id: apt.id,
                title: `${apt.patientName} - ${apt.serviceName}`,
                start: apt.startTime,
                end: apt.endTime,
                backgroundColor: color,
                borderColor: borderColor,
                textColor: textColor,
                extendedProps: apt,
            }
        })
    }, [filteredAppointments])

    function renderEventContent(eventInfo: any) {
        const apt = eventInfo.event.extendedProps;
        const patient = patients.find(p => p.id === apt.patientId);
        const hasAllergy = patient?.allergies && patient.allergies.length > 0;
        const title = eventInfo.event.title + (hasAllergy && patient?.allergies ? ' (Dị ứng: ' + patient.allergies.join(', ') + ')' : '');

        return (
            <div 
                className="group relative flex h-full flex-col overflow-hidden rounded-xl border p-1.5 text-xs shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md dark:border-slate-700 dark:bg-slate-800" 
                style={{ 
                    borderColor: eventInfo.event.borderColor, 
                    backgroundColor: eventInfo.event.backgroundColor,
                    color: eventInfo.event.textColor
                }}
                title={title}
            >
                <div className="flex items-start justify-between gap-1">
                    <div className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                        {apt.patientName}
                    </div>
                    {hasAllergy && <AlertTriangle className="h-3 w-3 text-rose-500 flex-shrink-0" />}
                </div>
                <div className="whitespace-nowrap overflow-hidden text-ellipsis opacity-90 mt-0.5">{apt.serviceName}</div>
                <div className="mt-auto truncate text-[10px] font-medium opacity-80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eventInfo.event.textColor }}></span>
                    {apt.status}
                </div>
            </div>
        )
    }

    const getStatusBadgeClass = (status: MockAppointment['status']) => {
        switch (status) {
            case 'Đã hoàn thành': return 'bg-emerald-100 text-emerald-900'
            case 'Đã đến': return 'bg-sky-100 text-sky-900'
            case 'Đang điều trị': return 'bg-amber-100 text-amber-900'
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
            notes: apt.notes || '',
            difficulty: apt.difficulty || 0,
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

            if (!isWithinDoctorShift(doctor, startTime, endTime)) {
                addToast('error', `Bác sĩ không có lịch làm việc hoặc ca trực cho ${formatDate(startTime)} (khung giờ ${getTimeKey(startTime)}-${getTimeKey(endTime)}).`)
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
            updateAppointment({
                id: editingId, data: {
                    ...formState,
                    patientName: patient.fullName,
                    doctorName: doctor.fullName,
                    serviceName: service.name,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    difficulty: formState.difficulty,
                }
            })

            const statusChangedToCompleted = original?.status !== 'Đã hoàn thành' && formState.status === 'Đã hoàn thành';
            if (statusChangedToCompleted) {
                const amount = service ? service.basePrice : 0;

                if (amount > 0) {
                    createInvoice({
                        appointmentId: editingId,
                        patientId: patient.id,
                        patientName: patient.fullName,
                        doctorId: doctor.id,
                        doctorName: doctor.fullName,
                        serviceIds: [service.id],
                        totalAmount: amount,
                        status: 'Chưa thanh toán',
                    });
                } else {
                    addToast('warning', 'Không thể tạo hóa đơn vì không tìm thấy giá dịch vụ.');
                }
            }

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
                difficulty: formState.difficulty,
                status: 'Đã lên lịch',
            })
        }
        resetModal()
    }

    const handleSaveWalkIn = () => {
        if (!walkInState.patientPhone || !walkInState.patientName || !walkInState.doctorId || !walkInState.serviceId) {
            addToast('error', 'Vui lòng điền SĐT, Tên, Bác sĩ và Dịch vụ.');
            return;
        }
        const dataToSend = {
            ...walkInState,
            allergies: walkInState.allergiesRaw.split(',').map(s => s.trim()).filter(Boolean)
        };
        createWalkIn(dataToSend);
        setIsWalkInModalOpen(false);
    };

    const handleUpdateStatus = async (apt: MockAppointment, status: MockAppointment['status']) => {
        const confirmed = await confirm({
            title: `${status} lịch hẹn`,
            message: `Bạn có chắc muốn ${status.toLowerCase()} lịch hẹn cho "${apt.patientName}"?`,
            isDangerous: status === 'Đã hủy',
        })
        if (confirmed) {
            updateAppointment({ id: apt.id, data: { status } })

            if (status === 'Đã hoàn thành') {
                const service = services.find(s => s.id === apt.serviceId);
                const amount = service ? service.basePrice : 0;

                if (amount > 0) {
                    createInvoice({
                        appointmentId: apt.id,
                        patientId: apt.patientId,
                        patientName: apt.patientName,
                        doctorId: apt.doctorId,
                        doctorName: apt.doctorName,
                        serviceIds: [apt.serviceId],
                        totalAmount: amount,
                        status: 'Chưa thanh toán',
                    });
                } else {
                    addToast('warning', 'Không thể tạo hóa đơn vì không tìm thấy giá dịch vụ.');
                }
            }
        }
    }

    const handleDeleteAppointment = async (apt: MockAppointment) => {
        const confirmed = await confirm({
            title: 'Xóa vĩnh viễn lịch hẹn',
            message: `Bạn có chắc muốn xóa vĩnh viễn lịch hẹn của "${apt.patientName}"? Hành động này không thể hoàn tác.`,
            isDangerous: true,
        });
        if (confirmed) {
            deleteAppointment(apt.id);
        }
    };

    // Calculate Quick Stats
    const todayAppointments = useMemo(() => {
        const today = new Date().setHours(0,0,0,0);
        return appointments.filter(a => new Date(a.startTime).setHours(0,0,0,0) === today);
    }, [appointments]);

    const newPatientsCount = todayAppointments.length; // Simplified
    const pendingAppointments = appointments.filter(a => a.status === 'Đã lên lịch').length;
    const todayRevenue = todayAppointments.filter(a => a.status === 'Đã hoàn thành').reduce((acc, apt) => {
        const svc = services.find(s => s.id === apt.serviceId);
        return acc + (svc ? svc.basePrice : 0);
    }, 0);

    return (
        <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <CalendarHeart className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lịch hẹn hôm nay</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{todayAppointments.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bệnh nhân hôm nay</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{newPatientsCount}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lịch chờ xử lý</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingAppointments}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Doanh thu dự kiến (HN)</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatVND(todayRevenue)}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative max-w-xs flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm bệnh nhân, dịch vụ..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full rounded-xl border-slate-200 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                        />
                    </div>
                    
                    <button
                        onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        title={viewMode === 'calendar' ? 'Chuyển sang dạng danh sách' : 'Chuyển sang dạng lịch'}
                    >
                        <span className="hidden sm:inline">{viewMode === 'calendar' ? 'Dạng danh sách' : 'Dạng lịch'}</span>
                    </button>

                    <button
                        onClick={() => setDateFilter(dateFilter === 'all' ? 'today' : 'all')}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium ${dateFilter === 'today' ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-700'}`}
                    >
                        {dateFilter === 'today' ? 'Lịch hẹn hôm nay' : 'Tất cả lịch hẹn'}
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
                        <option>Đã đến</option>
                        <option>Đang điều trị</option>
                        <option>Đã hoàn thành</option>
                        <option>Đã hủy</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsWalkInModalOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-4 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-500 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-blue-900/30">
                        <Users className="h-4 w-4" /> Khách vãng lai
                    </button>
                    <button onClick={openCreateModal} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95">
                        <Plus className="h-5 w-5" /> Tạo lịch hẹn
                    </button>
                </div>
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
                        locale={viLocale}
                        eventContent={renderEventContent}
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
                                            <td className="px-4 py-3 font-medium text-slate-900">{formatDateTime(apt.startTime)}</td><td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span>{apt.patientName}</span>
                                                    {patients.find(p => p.id === apt.patientId)?.allergies && (patients.find(p => p.id === apt.patientId)?.allergies?.length || 0) > 0 && (
                                                        <span title={`Dị ứng: ${patients.find(p => p.id === apt.patientId)?.allergies?.join(', ')}`}>
                                                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
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
                                                    {apt.status === 'Đã lên lịch' && !isDoctor && (
                                                        <button onClick={() => checkInAppointment(apt.id)} className="inline-flex h-8 items-center rounded-lg border bg-sky-50 px-2 text-xs text-sky-700">
                                                            Check-in
                                                        </button>
                                                    )}
                                                    {apt.status === 'Đã đến' && (
                                                        <span className="text-xs text-slate-500">
                                                            Đến lúc: {formatDateTime(apt.checkInTime || '')}
                                                        </span>
                                                    )}
                                                    {/* Complete Button */}
                                                    {['Đã lên lịch', 'Đã đến', 'Đang điều trị'].includes(apt.status) && (!isDoctor || apt.doctorId === currentUser?.referenceId) && (
                                                        <button onClick={() => handleUpdateStatus(apt, 'Đã hoàn thành')} className="inline-flex h-8 items-center rounded-lg border bg-emerald-50 px-2 text-xs text-emerald-700">Hoàn thành</button>
                                                    )}
                                                    {['Đã lên lịch', 'Đã đến'].includes(apt.status) && (!isDoctor || apt.doctorId === currentUser?.referenceId) && (
                                                        <button onClick={() => handleUpdateStatus(apt, 'Đã hủy')} className="inline-flex h-8 items-center rounded-lg border bg-rose-50 px-2 text-xs text-rose-700">Hủy</button>
                                                    )}
                                                    {/* Delete Button for cancelled appointments */}
                                                    {apt.status === 'Đã hủy' && (
                                                        <button
                                                            onClick={() => handleDeleteAppointment(apt)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                                            title="Xóa vĩnh viễn"
                                                        ><Trash2 className="h-4 w-4" /></button>
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
                                <select value={formState.serviceId} onChange={e => {
                                    const serviceId = e.target.value;
                                    const selectedService = services.find(s => s.id === serviceId);
                                    setFormState(s => ({ 
                                        ...s, 
                                        serviceId,
                                        difficulty: selectedService?.difficulty || 0 
                                    }))
                                }} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
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
                                <label className="block text-sm font-medium">Mức độ khó (Hệ số bệnh nhân)</label>
                                <input type="number" step="0.1" min="0" max="1" value={formState.difficulty} onChange={e => setFormState(s => ({ ...s, difficulty: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
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
                                        <option>Đã đến</option>
                                        <option>Đang điều trị</option>
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

            {/* Walk-in Modal */}
            {isWalkInModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold">Tiếp nhận khách vãng lai</h3>
                            <button onClick={() => setIsWalkInModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Số điện thoại *</label>
                                <input type="tel" value={walkInState.patientPhone} onChange={e => setWalkInState(s => ({ ...s, patientPhone: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" placeholder="Nhập SĐT để tìm hoặc tạo mới..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Họ tên bệnh nhân *</label>
                                <input type="text" value={walkInState.patientName} onChange={e => setWalkInState(s => ({ ...s, patientName: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Tuổi (ước tính)</label>
                                    <input type="number" value={walkInState.patientAge} onChange={e => setWalkInState(s => ({ ...s, patientAge: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Dị ứng (cách nhau bởi dấu phẩy)</label>
                                    <input type="text" value={walkInState.allergiesRaw} onChange={e => setWalkInState(s => ({ ...s, allergiesRaw: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Dịch vụ khám *</label>
                                <select value={walkInState.serviceId} onChange={e => setWalkInState(s => ({ ...s, serviceId: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
                                    <option value="">Chọn dịch vụ</option>
                                    {services.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bác sĩ khám *</label>
                                <select value={walkInState.doctorId} onChange={e => setWalkInState(s => ({ ...s, doctorId: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
                                    <option value="">Chọn bác sĩ</option>
                                    {doctors.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setIsWalkInModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium">Hủy</button>
                            <button onClick={handleSaveWalkIn} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Tiếp nhận & Check-in</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
// #endregion
