import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import type { EventClickArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import { PageShell } from '../components/PageShell'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { api, type ApiListResponse, type ApiItemResponse } from '../lib/api'
import type { MockDoctor, MockClinicHoliday, MockWorkShift } from '../lib/mockData'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../lib/formatters'

type DoctorOnCallShift = {
    id: string
    doctorId: string
    doctorName: string
    date: string
    startTime: string
    endTime: string
    coefficient?: number
    status: 'Đã đăng ký' | 'Đã hủy'
}

type SubPage = 'doctor-schedule' | 'work-shifts' | 'holidays'

export function ScheduleManagementPage() {
    const [activeSubPage, setActiveSubPage] = useState<SubPage>('doctor-schedule')
    const { currentUser } = useAuth()
    const queryClient = useQueryClient()
    const { addToast } = useToast()

    // --- Server-side Data ---
    const { data: doctors = [], isLoading: doctorsIsLoading } = useQuery<MockDoctor[], Error>({
        queryKey: ['doctors'],
        queryFn: async () => (await api.get<ApiListResponse<MockDoctor>>('/doctors')).data.data,
    })

    const { data: holidays = [], isLoading: holidaysIsLoading } = useQuery<MockClinicHoliday[], Error>({
        queryKey: ['holidays'],
        queryFn: async () => (await api.get<ApiListResponse<MockClinicHoliday>>('/holidays')).data.data,
    })

    const { data: workShifts = [], isLoading: workShiftsIsLoading } = useQuery<MockWorkShift[], Error>({
        queryKey: ['work-shifts'],
        queryFn: async () => (await api.get<ApiListResponse<MockWorkShift>>('/work-shifts')).data.data,
    })

    const { data: doctorShifts = [], isLoading: shiftsIsLoading } = useQuery<DoctorOnCallShift[], Error>({
        queryKey: ['shifts'],
        queryFn: async () => (await api.get<ApiListResponse<DoctorOnCallShift>>('/shifts')).data.data,
    })

    // --- Mutations ---
    // Holidays
    const { mutate: saveHoliday } = useMutation<MockClinicHoliday, Error, { id?: string; data: Omit<MockClinicHoliday, 'id'> }>({
        mutationFn: async ({ id, data }) => {
            if (id) return (await api.put<ApiItemResponse<MockClinicHoliday>>(`/holidays/${id}`, data)).data.data
            return (await api.post<ApiItemResponse<MockClinicHoliday>>('/holidays', data)).data.data
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); addToast('success', 'Đã lưu ngày nghỉ') },
        onError: (err) => addToast('error', `Lỗi lưu ngày nghỉ: ${err.message}`),
    })

    const { mutate: deleteHoliday } = useMutation<any, Error, string>({
        mutationFn: async (id) => (await api.delete(`/holidays/${id}`)).data,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); addToast('success', 'Đã xóa ngày nghỉ') },
    })

    // Work Shifts
    const { mutate: saveWorkShift } = useMutation<MockWorkShift, Error, { id?: string; data: Omit<MockWorkShift, 'id'> }>({
        mutationFn: async ({ id, data }) => {
            if (id) return (await api.put<ApiItemResponse<MockWorkShift>>(`/work-shifts/${id}`, data)).data.data
            return (await api.post<ApiItemResponse<MockWorkShift>>('/work-shifts', data)).data.data
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-shifts'] }); addToast('success', 'Đã lưu ca làm việc') },
        onError: (err) => addToast('error', `Lỗi lưu ca làm việc: ${err.message}`),
    })

    const { mutate: deleteWorkShift } = useMutation<any, Error, string>({
        mutationFn: async (id) => (await api.delete(`/work-shifts/${id}`)).data,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-shifts'] }); addToast('success', 'Đã xóa ca làm việc') },
    })

    // Doctor Shifts
    const { mutate: createShift } = useMutation<DoctorOnCallShift, Error, Omit<DoctorOnCallShift, 'id'>>({
        mutationFn: async (newShift) => (await api.post<ApiItemResponse<DoctorOnCallShift>>('/shifts', newShift)).data.data,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shifts'] }); addToast('success', 'Đăng ký lịch trực thành công') },
        onError: (err: any) => {
            const msg = err?.response?.data?.error || err.message
            addToast('error', msg)
        },
    })

    const { mutate: updateShift } = useMutation<DoctorOnCallShift, Error, { id: string; data: Partial<DoctorOnCallShift> }>({
        mutationFn: async ({ id, data }) => (await api.patch<ApiItemResponse<DoctorOnCallShift>>(`/shifts/${id}`, data)).data.data,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shifts'] }); addToast('success', 'Cập nhật lịch trực thành công') },
        onError: (err: any) => {
            const msg = err?.response?.data?.error || err.message
            addToast('error', msg)
        },
    })

    const { mutate: deleteShift } = useMutation<any, Error, string>({
        mutationFn: async (id) => (await api.delete(`/shifts/${id}`)).data,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shifts'] }); addToast('success', 'Đã xóa lịch trực') },
        onError: (err) => addToast('error', `Lỗi xóa lịch trực: ${err.message}`),
    })

    // ── Derive conflicting shift IDs for visual indicator ─────────────────
    const conflictingShiftIds = useMemo(() => {
        const conflictSet = new Set<string>()
        const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
        for (let i = 0; i < doctorShifts.length; i++) {
            for (let j = i + 1; j < doctorShifts.length; j++) {
                const a = doctorShifts[i]
                const b = doctorShifts[j]
                if (a.doctorId !== b.doctorId || a.date !== b.date) continue
                const aStart = toMin(a.startTime), aEnd = toMin(a.endTime)
                const bStart = toMin(b.startTime), bEnd = toMin(b.endTime)
                if (aStart < bEnd && aEnd > bStart) {
                    conflictSet.add(a.id)
                    conflictSet.add(b.id)
                }
            }
        }
        return conflictSet
    }, [doctorShifts])

    const isLoading = doctorsIsLoading || holidaysIsLoading || workShiftsIsLoading || shiftsIsLoading

    return (
        <PageShell title="Quản lý Lịch làm việc">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-64 shrink-0 space-y-1">
                    <button
                        onClick={() => setActiveSubPage('doctor-schedule')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                            activeSubPage === 'doctor-schedule' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Lịch trực bác sĩ
                    </button>
                    {currentUser?.role !== 'Doctor' && (
                        <>
                            <button
                                onClick={() => setActiveSubPage('work-shifts')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                    activeSubPage === 'work-shifts' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                Cài đặt ca làm việc
                            </button>
                            <button
                                onClick={() => setActiveSubPage('holidays')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                    activeSubPage === 'holidays' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                Cài đặt ngày nghỉ
                            </button>
                        </>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {activeSubPage === 'doctor-schedule' && (
                        <DoctorScheduleView
                            doctors={doctors}
                            shifts={doctorShifts}
                            holidays={holidays}
                            isLoading={isLoading}
                            createShift={createShift}
                            updateShift={updateShift}
                            deleteShift={deleteShift}
                            currentUser={currentUser}
                            conflictingShiftIds={conflictingShiftIds}
                        />
                    )}
                    {activeSubPage === 'work-shifts' && currentUser?.role !== 'Doctor' && (
                        <WorkShiftSettingsView
                            data={workShifts}
                            isLoading={isLoading}
                            saveWorkShift={saveWorkShift}
                            deleteWorkShift={deleteWorkShift}
                        />
                    )}
                    {activeSubPage === 'holidays' && currentUser?.role !== 'Doctor' && (
                        <HolidaySettingsView
                            data={holidays}
                            isLoading={isLoading}
                            saveHoliday={saveHoliday}
                            deleteHoliday={deleteHoliday}
                        />
                    )}
                </div>
            </div>
        </PageShell>
    )
}

// --- Views Components ---

function DoctorScheduleView({ doctors, shifts, holidays, createShift, updateShift, deleteShift, currentUser, conflictingShiftIds }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState({ doctorId: '', date: '', startTime: '08:00', endTime: '17:00', coefficient: 1.0, status: 'Đã đăng ký' as any })
    const [doctorFilter, setDoctorFilter] = useState<string>('all')

    const { addToast } = useToast()
    const { confirm } = useConfirm()
    const isDoctor = currentUser?.role === 'Doctor'

    useEffect(() => {
        if (currentUser?.role === 'Doctor' && currentUser.referenceId) {
            setFormState(prev => ({ ...prev, doctorId: currentUser.referenceId }))
        }
    }, [currentUser])

    const isHolidayKey = (dateKey: string) => {
        return holidays.find((h: MockClinicHoliday) => h.isRecurring ? h.date.slice(5) === dateKey.slice(5) : h.date === dateKey)
    }

    const calendarEvents = useMemo(() => {
        let shiftsToDisplay = shifts
        if (isDoctor && currentUser?.referenceId) {
            shiftsToDisplay = shifts.filter((s: any) => s.doctorId === currentUser.referenceId)
        } else if (doctorFilter !== 'all') {
            shiftsToDisplay = shifts.filter((s: any) => s.doctorId === doctorFilter)
        }

        const colors = [
            { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af' }, // blue pastel
            { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' }, // green pastel
            { bg: '#f3e8ff', border: '#e9d5ff', text: '#6b21a8' }, // purple pastel
            { bg: '#fef9c3', border: '#fef08a', text: '#854d0e' }, // yellow pastel
        ]
        return shiftsToDisplay.map((shift: any, i: number) => {
            const isCancelled = shift.status === 'Đã hủy'
            const isConflict = conflictingShiftIds?.has(shift.id)
            const color = colors[i % colors.length]
            return {
                id: shift.id,
                title: shift.doctorName,
                start: `${shift.date}T${shift.startTime}`,
                end: `${shift.date}T${shift.endTime}`,
                backgroundColor: isCancelled ? '#f1f5f9' : isConflict ? '#fee2e2' : color.bg,
                borderColor: isCancelled ? '#e2e8f0' : isConflict ? '#fca5a5' : color.border,
                textColor: isCancelled ? '#475569' : isConflict ? '#991b1b' : color.text,
                extendedProps: { ...shift, isConflict },
            }
        })
    }, [shifts, isDoctor, currentUser, doctorFilter])

    const globalCalendarEvents = useMemo(() => {
        const typeColors: any = {
            HOLIDAY: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
            MAINTENANCE: { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
            TRAINING: { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
            SYSTEM_CLOSED: { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' }
        };

        return holidays.map((h: MockClinicHoliday) => {
            const color = typeColors[h.type || 'HOLIDAY'] || typeColors.HOLIDAY;
            return {
                id: h.id,
                title: h.name,
                start: h.date,
                allDay: true,
                backgroundColor: color.bg,
                borderColor: color.border,
                textColor: color.text,
                extendedProps: h,
            }
        });
    }, [holidays])

    const [globalSelectedDate, setGlobalSelectedDate] = useState<string | null>(null)

    const resetModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        const defaultDoctorId = isDoctor && currentUser?.referenceId ? currentUser.referenceId : ''
        setFormState({ doctorId: defaultDoctorId, date: '', startTime: '08:00', endTime: '17:00', coefficient: 1.0, status: 'Đã đăng ký' })
    }

    const handleGlobalDateClick = (arg: DateClickArg) => {
        const dateStr = arg.dateStr.split('T')[0]
        setGlobalSelectedDate(dateStr)
    }

    const handleDateClick = (arg: DateClickArg) => {
        const dateStr = arg.dateStr.split('T')[0]
        const holiday = isHolidayKey(dateStr)
        if (holiday) {
            addToast('error', `Ngày ${formatDate(dateStr)} là ngày nghỉ: ${holiday.name}.`)
            return
        }
        resetModal()
        setFormState(prev => ({ ...prev, date: dateStr }))
        setIsModalOpen(true)
    }

    const handleEventClick = (arg: EventClickArg) => {
        const shift = arg.event.extendedProps as DoctorOnCallShift
        setEditingId(shift.id)
        setFormState({ doctorId: shift.doctorId, date: shift.date, startTime: shift.startTime, endTime: shift.endTime, coefficient: shift.coefficient || 1.0, status: shift.status })
        setIsModalOpen(true)
    }

    const handleSave = () => {
        const doctor = doctors.find((d: any) => d.id === formState.doctorId)
        if (!doctor || !formState.date || !formState.startTime || !formState.endTime) {
            addToast('error', 'Vui lòng điền đủ thông tin.')
            return
        }

        const holiday = isHolidayKey(formState.date)
        if (holiday) {
            addToast('error', `Ngày ${formatDate(formState.date)} là sự kiện toàn hệ thống: ${holiday.name}. Không thể đăng ký lịch.`)
            return
        }
        
        const toMinutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; }
        if (toMinutes(formState.endTime) <= toMinutes(formState.startTime)) {
            addToast('error', 'Giờ kết thúc phải sau giờ bắt đầu.')
            return
        }

        if (editingId) {
            updateShift({ id: editingId, data: { ...formState, doctorName: doctor.fullName } })
        } else {
            createShift({ ...formState, doctorName: doctor.fullName })
        }
        resetModal()
    }

    const handleCancelShift = async () => {
        if (await confirm({ title: 'Hủy ca', message: 'Bạn có chắc muốn hủy ca trực này?', isDangerous: true, confirmLabel: 'Hủy ca' })) {
            updateShift({ id: editingId!, data: { status: 'Đã hủy' } })
            resetModal()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between shadow-sm">
                <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} className="h-10 rounded-xl border px-3 text-sm" disabled={isDoctor}>
                    <option value="all">Tất cả bác sĩ</option>
                    {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
                <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white" disabled={isDoctor && !currentUser?.referenceId}>
                    <Plus className="h-4 w-4" /> Đăng ký lịch trực
                </button>
            </div>
            
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
                    allDaySlot={false}
                    slotMinTime="07:00:00"
                    slotMaxTime="21:00:00"
                    selectable={true}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    height="auto"
                    eventContent={(eventInfo) => {
                        const { isConflict } = eventInfo.event.extendedProps;
                        return (
                            <div className="flex h-full flex-col overflow-hidden p-1 text-xs" title={eventInfo.event.title}>
                                <div className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1">
                                    {isConflict && <span title="Xung đột ca!">⚠️</span>}
                                    {eventInfo.event.title}
                                </div>
                                {isConflict && (
                                    <div className="text-[9px] font-bold uppercase tracking-wide opacity-90">XUNG ĐỘT GIỜ</div>
                                )}
                            </div>
                        )
                    }}
                />
            </div>

            {/* Global Calendar */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-rose-500 rounded-full inline-block"></span>
                    Lịch hệ thống (Global Calendar)
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm relative z-0">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth'
                        }}
                        events={globalCalendarEvents}
                        locale={viLocale}
                        height="auto"
                        dateClick={handleGlobalDateClick}
                        eventContent={(eventInfo) => {
                            return (
                                <div className="flex h-full flex-col overflow-hidden p-1 text-xs" title={eventInfo.event.title}>
                                    <div className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                                        {eventInfo.event.title}
                                    </div>
                                </div>
                            )
                        }}
                    />
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-semibold">{editingId ? 'Sửa lịch trực' : 'Đăng ký lịch trực'}</h3><button onClick={resetModal} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Bác sĩ</label>
                                <select value={formState.doctorId} onChange={e => setFormState(s => ({ ...s, doctorId: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm bg-white" disabled={isDoctor && !editingId}>
                                    <option value="">Chọn bác sĩ</option>
                                    {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Ngày trực</label>
                                <input type="date" value={formState.date} onChange={e => setFormState(s => ({ ...s, date: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium">Giờ bắt đầu</label><input type="time" value={formState.startTime} onChange={e => setFormState(s => ({ ...s, startTime: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></div>
                                <div><label className="block text-sm font-medium">Giờ kết thúc</label><input type="time" value={formState.endTime} onChange={e => setFormState(s => ({ ...s, endTime: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></div>
                                <div><label className="block text-sm font-medium">Hệ số ca</label><input type="number" step="0.1" value={formState.coefficient} onChange={e => setFormState(s => ({ ...s, coefficient: parseFloat(e.target.value) || 1.0 }))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={resetModal} className="rounded-lg border px-4 py-2 text-sm font-medium">Hủy</button>
                            {editingId && formState.status === 'Đã đăng ký' && <button onClick={handleCancelShift} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white">Hủy ca trực</button>}
                            {editingId && currentUser?.role === 'Admin' && <button onClick={() => { deleteShift(editingId); resetModal(); }} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Xóa hẳn</button>}
                            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">{editingId ? 'Lưu' : 'Đăng ký'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Selected Date Modal */}
            {globalSelectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold">Lịch trực ngày {formatDate(globalSelectedDate)}</h3>
                            <button onClick={() => setGlobalSelectedDate(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {shifts.filter((s: any) => s.date === globalSelectedDate).length > 0 ? (
                                shifts.filter((s: any) => s.date === globalSelectedDate).map((shift: any) => (
                                    <div key={shift.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-slate-50 transition-colors">
                                        <div>
                                            <div className="font-semibold text-sm">{shift.doctorName}</div>
                                            <div className="text-xs text-slate-500">{shift.startTime} - {shift.endTime}</div>
                                        </div>
                                        <div className={`px-2 py-1 text-[10px] font-semibold rounded-full ${shift.status === 'Đã đăng ký' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {shift.status}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                                    Không có lịch trực nào trong ngày này.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SimpleCrudView({ title, data, isLoading, saveMutation, deleteMutation, columns, fields, initialFormState }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formState, setFormState] = useState(initialFormState)
    const { confirm } = useConfirm()

    const resetModal = () => { setIsModalOpen(false); setEditingId(null); setFormState(initialFormState); }

    const handleSave = () => {
        saveMutation(editingId ? { id: editingId, data: formState } : { data: formState })
        resetModal()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end"><button onClick={() => setIsModalOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Thêm {title}</button></div>
            {isLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-6"><TableLoadingSkeleton rows={5} /></div> : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50"><tr className="border-b">{columns.map((c: any, idx: number) => <th key={c.key || idx} className="px-4 py-3 font-semibold text-slate-700">{c.label}</th>)}<th className="px-4 py-3 text-right">Hành động</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{data.map((item: any, idx: number) => {
                            const itemId = item.id || item._id || idx;
                            return (
                            <tr key={itemId} className="hover:bg-slate-50">
                                {columns.map((c: any, cIdx: number) => <td key={c.key || cIdx} className="px-4 py-3">{c.render ? c.render(item) : item[c.key]}</td>)}
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => { setEditingId(item.id || item._id); setFormState({ ...item }); setIsModalOpen(true); }} className="mr-2 text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4 inline" /></button>
                                    <button onClick={async () => { if (await confirm({ title: 'Xóa', message: 'Bạn có chắc chắn?', isDangerous: true })) deleteMutation(item.id || item._id) }} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4 inline" /></button>
                                </td>
                            </tr>
                        )})}</tbody>
                    </table>
                </div>
            )}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6"><h3 className="text-xl font-semibold mb-4">{editingId ? `Sửa ${title}` : `Thêm ${title}`}</h3>
                        <div className="space-y-4">
                            {fields.map((f: any) => (
                                <div key={f.key}>
                                    <label className="block text-sm font-medium">{f.label}</label>
                                    {f.type === 'checkbox' ? (
                                        <input type="checkbox" checked={!!formState[f.key]} onChange={e => setFormState((s: any) => ({ ...s, [f.key]: e.target.checked }))} className="mt-1" />
                                    ) : f.type === 'select' ? (
                                        <select value={formState[f.key] || ''} onChange={e => setFormState((s: any) => ({ ...s, [f.key]: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm bg-white">
                                            {f.options?.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    ) : (
                                        <input type={f.type} value={formState[f.key] || ''} onChange={e => setFormState((s: any) => ({ ...s, [f.key]: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end gap-3"><button onClick={resetModal} className="rounded-lg border px-4 py-2 text-sm font-medium">Hủy</button><button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Lưu</button></div>
                    </div>
                </div>
            )}
        </div>
    )
}

function WorkShiftSettingsView({ data, isLoading, saveWorkShift, deleteWorkShift }: any) {
    return <SimpleCrudView title="Ca làm việc" data={data} isLoading={isLoading} saveMutation={saveWorkShift} deleteMutation={deleteWorkShift} columns={[{ key: 'name', label: 'Tên ca' }, { key: 'startTime', label: 'Bắt đầu' }, { key: 'endTime', label: 'Kết thúc' }]} fields={[{ key: 'name', label: 'Tên ca', type: 'text' }, { key: 'startTime', label: 'Bắt đầu', type: 'time' }, { key: 'endTime', label: 'Kết thúc', type: 'time' }]} initialFormState={{ name: '', startTime: '08:00', endTime: '17:00' }} />
}

function HolidaySettingsView({ data, isLoading, saveHoliday, deleteHoliday }: any) {
    const columns = [
        { key: 'name', label: 'Tên ngày nghỉ' },
        { key: 'date', label: 'Ngày', render: (i: any) => formatDate(i.date) },
        { key: 'type', label: 'Loại', render: (i: any) => {
            const types: any = { HOLIDAY: 'Nghỉ lễ', MAINTENANCE: 'Bảo trì', TRAINING: 'Đào tạo', SYSTEM_CLOSED: 'Khác' };
            return types[i.type] || 'Nghỉ lễ';
        }},
        { key: 'isRecurring', label: 'Lặp lại', render: (i: any) => i.isRecurring ? 'Có' : 'Không' }
    ];
    const fields = [
        { key: 'name', label: 'Tên ngày nghỉ', type: 'text' },
        { key: 'date', label: 'Ngày', type: 'date' },
        { key: 'type', label: 'Phân loại', type: 'select', options: [
            { value: 'HOLIDAY', label: 'Nghỉ lễ' },
            { value: 'MAINTENANCE', label: 'Bảo trì' },
            { value: 'TRAINING', label: 'Đào tạo' },
            { value: 'SYSTEM_CLOSED', label: 'Khác' }
        ]},
        { key: 'isRecurring', label: 'Lặp lại hàng năm', type: 'checkbox' }
    ];
    return <SimpleCrudView title="Ngày nghỉ / Sự kiện" data={data} isLoading={isLoading} saveMutation={saveHoliday} deleteMutation={deleteHoliday} columns={columns} fields={fields} initialFormState={{ name: '', date: new Date().toISOString().split('T')[0], type: 'HOLIDAY', isRecurring: false }} />
}
