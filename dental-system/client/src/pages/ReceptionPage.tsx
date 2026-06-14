import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Users,
    CalendarHeart,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Search,
    Plus,
    X,
    ChevronRight,
    Stethoscope,
    Tag,
    UserPlus,
    PhoneCall,
    Activity,
    Wallet,
    Info,
    LogIn,
    Printer,
    MoreHorizontal,
    ArrowRight,
    Siren,
    Timer,
    UserCheck,
    TrendingUp,
    Eye,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { api, type ApiListResponse, type ApiItemResponse } from '../lib/api'
import type { Appointment, Doctor, Patient, Service, PricingPolicy } from '../lib/types'
import { formatVND, formatDate } from '../lib/formatters'

// ─── Types ────────────────────────────────────────────────────────────────────
type DoctorShift = {
    id: string
    doctorId: string
    doctorName: string
    date: string       // YYYY-MM-DD
    startTime: string  // HH:mm
    endTime: string    // HH:mm
    coefficient?: number
}

type StatusFilter = 'all' | 'Đã lên lịch' | 'Đã đến' | 'Đang điều trị' | 'Đã hoàn thành'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTodayKey() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function getAvatarGradient(name: string): string {
    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-cyan-500 to-blue-600',
        'from-teal-500 to-emerald-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-fuchsia-500 to-violet-600',
    ]
    const idx = name.charCodeAt(0) % gradients.length
    return gradients[idx]
}

function isLate(apt: Appointment): boolean {
    const now = new Date()
    const start = new Date(apt.startTime)
    return now > start && apt.status === 'Đã lên lịch'
}

function getWaitMinutes(apt: Appointment): number {
    const now = new Date()
    const start = new Date(apt.startTime)
    return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000))
}

function getGreeting(): string {
    const h = new Date().getHours()
    if (h < 12) return 'Chào buổi sáng'
    if (h < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function useLiveClock() {
    const [time, setTime] = useState(new Date())
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(id)
    }, [])
    return time
}

// ─── Context Menu Hook ────────────────────────────────────────────────────────
function useContextMenu() {
    const [openId, setOpenId] = useState<string | null>(null)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpenId(null)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])
    return { openId, setOpenId, ref }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ReceptionPage() {
    const { currentUser } = useAuth()
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    const navigate = useNavigate()
    const now = useLiveClock()
    const { openId, setOpenId, ref: menuRef } = useContextMenu()

    // ── Server Data ────────────────────────────────────────────────────────────
    const { data: appointments = [], isLoading: aptsLoading } = useQuery<Appointment[]>({
        queryKey: ['appointments'],
        queryFn: async () => (await api.get<ApiListResponse<Appointment>>('/appointments')).data.data,
        refetchInterval: 30_000,
    })

    const { data: doctors = [], isLoading: doctorsLoading } = useQuery<Doctor[]>({
        queryKey: ['doctors'],
        queryFn: async () => (await api.get<ApiListResponse<Doctor>>('/doctors')).data.data,
    })

    const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
        queryKey: ['patients'],
        queryFn: async () => (await api.get<ApiListResponse<Patient>>('/patients')).data.data,
    })

    const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
        queryKey: ['services'],
        queryFn: async () => (await api.get<ApiListResponse<Service>>('/services')).data.data,
    })

    const { data: shifts = [], isLoading: shiftsLoading } = useQuery<DoctorShift[]>({
        queryKey: ['doctorShifts'],
        queryFn: async () => (await api.get<ApiListResponse<DoctorShift>>('/shifts')).data.data,
    })

    const { data: pricingPolicies = [] } = useQuery<PricingPolicy[]>({
        queryKey: ['pricing-policies'],
        queryFn: async () => (await api.get<ApiListResponse<PricingPolicy>>('/pricing-policies')).data.data,
    })

    // ── Mutations ──────────────────────────────────────────────────────────────
    const { mutate: checkIn, isPending: checkingIn } = useMutation<Appointment, Error, string>({
        mutationFn: async (id) => (await api.patch<ApiItemResponse<Appointment>>(`/appointments/${id}/checkin`)).data.data,
        onSuccess: (apt) => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            addToast('success', `✅ Đã check-in: ${apt.patientName}`)
        },
        onError: (err: any) => addToast('error', err?.response?.data?.error || err.message),
    })

    const { mutate: createWalkIn, isPending: creatingWalkIn } = useMutation<Appointment, Error, any>({
        mutationFn: async (data) => (await api.post<ApiItemResponse<Appointment>>('/appointments/walk-in', data)).data.data,
        onSuccess: (apt) => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            addToast('success', `✅ Tiếp nhận vãng lai: ${apt.patientName}`)
        },
        onError: (err: any) => addToast('error', err?.response?.data?.error || err.message),
    })

    const { mutate: createAppointment, isPending: creatingApt } = useMutation<Appointment, Error, any>({
        mutationFn: async (data) => (await api.post<ApiItemResponse<Appointment>>('/appointments', data)).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            addToast('success', 'Đặt lịch hẹn thành công!')
        },
        onError: (err: any) => addToast('error', err?.response?.data?.error || err.message),
    })

    const { mutate: switchDoctor, isPending: switchingDoctor } = useMutation<any, Error, { id: string, doctorId: string, doctorName: string }>({
        mutationFn: async ({ id, doctorId, doctorName }) => (await api.patch(`/appointments/${id}`, { doctorId, doctorName })).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            addToast('success', 'Đã chuyển bác sĩ thành công')
            setShowSwitchDoctor(null)
        },
        onError: (err: any) => addToast('error', err?.response?.data?.error || err.message)
    })

    const { mutate: rescheduleApt, isPending: rescheduling } = useMutation<any, Error, { id: string, startTime: string, endTime: string }>({
        mutationFn: async ({ id, startTime, endTime }) => (await api.patch(`/appointments/${id}`, { startTime, endTime })).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            addToast('success', 'Đã đổi lịch hẹn thành công')
            setShowReschedule(null)
        },
        onError: (err: any) => addToast('error', err?.response?.data?.error || err.message)
    })

    // ── Derived Data ───────────────────────────────────────────────────────────
    const todayKey = getTodayKey()

    const todayShifts = useMemo(() =>
        shifts.filter(s => s.date === todayKey),
        [shifts, todayKey]
    )

    const todayDoctorIds = useMemo(() =>
        new Set(todayShifts.map(s => s.doctorId)),
        [todayShifts]
    )

    const todayAppointments = useMemo(() => {
        return appointments
            .filter(a => {
                const d = new Date(a.startTime)
                const y = d.getFullYear()
                const mo = String(d.getMonth() + 1).padStart(2, '0')
                const dy = String(d.getDate()).padStart(2, '0')
                return `${y}-${mo}-${dy}` === todayKey
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    }, [appointments, todayKey])

    const stats = useMemo(() => ({
        total:     todayAppointments.length,
        waiting:   todayAppointments.filter(a => a.status === 'Đã lên lịch').length,
        checkedIn: todayAppointments.filter(a => a.status === 'Đã đến' || a.status === 'Đang điều trị').length,
        done:      todayAppointments.filter(a => a.status === 'Đã hoàn thành').length,
        late:      todayAppointments.filter(a => isLate(a)).length,
    }), [todayAppointments])

    // ── UI State ───────────────────────────────────────────────────────────────
    const [doctorFilter, setDoctorFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [showWalkIn, setShowWalkIn] = useState(false)
    const [showBooking, setShowBooking] = useState(false)
    const [showSwitchDoctor, setShowSwitchDoctor] = useState<string | null>(null)
    const [showReschedule, setShowReschedule] = useState<string | null>(null)
    const [showPrint, setShowPrint] = useState<Appointment | null>(null)

    const isLoading = aptsLoading || doctorsLoading || patientsLoading || servicesLoading || shiftsLoading

    const filtered = useMemo(() => {
        return todayAppointments
            .filter(a => doctorFilter === 'all' || a.doctorId === doctorFilter)
            .filter(a => statusFilter === 'all' || a.status === statusFilter)
            .filter(a => {
                if (!searchTerm) return true
                const q = searchTerm.toLowerCase()
                const patient = patients.find(p => p.id === a.patientId)
                return (
                    a.patientName.toLowerCase().includes(q) ||
                    a.serviceName.toLowerCase().includes(q) ||
                    (patient?.phone || '').includes(q)
                )
            })
    }, [todayAppointments, doctorFilter, statusFilter, searchTerm, patients])

    const activePolicies = useMemo(() =>
        pricingPolicies.filter(p => p.status === 'active' && p.type === 'Ưu đãi'),
        [pricingPolicies]
    )

    const todayDoctors = useMemo(() =>
        doctors.filter(d => todayDoctorIds.has(d.id)),
        [doctors, todayDoctorIds]
    )

    // Format clock
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = formatDate(now)

    // Handlers
    const handleViewPatient = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId)
        if (patient) navigate('/patients', { state: { searchTerm: patient.phone } })
        else addToast('error', 'Không tìm thấy bệnh nhân')
    }

    const handleQuickPayment = (patientName: string) => {
        navigate('/payment', { state: { searchTerm: patientName } })
    }

    const handleCallPatient = (patientName: string) => {
        addToast('success', `🔊 Đang gọi bệnh nhân: ${patientName}`)
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <section data-testid="page-reception" className="space-y-5">

            {/* ══════════════════════════════════════════════════════════════════
                HEADER BANNER
            ══════════════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-5 shadow-lg shadow-blue-900/20">
                {/* Background decoration */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
                    <div className="absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-cyan-400/10" />
                    <div className="absolute left-1/3 -top-8 h-24 w-24 rounded-full bg-indigo-300/10" />
                </div>

                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-live" />
                            <span className="text-xs font-medium text-blue-200">Hệ thống đang hoạt động</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">{getGreeting()}, {currentUser?.fullName?.split(' ').pop() ?? 'Lễ tân'} 👋</h1>
                        <p className="mt-0.5 text-sm text-blue-200">
                            Quầy lễ tân · {dateStr}
                            {stats.late > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-200">
                                    <Siren className="h-3 w-3" />
                                    {stats.late} trễ giờ
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Live Clock */}
                        <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm border border-white/15">
                            <div className="font-mono text-2xl font-bold tracking-wider text-white leading-none">{timeStr}</div>
                            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-blue-200">Live</div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col gap-2">
                            <button
                                id="btn-walk-in"
                                onClick={() => setShowWalkIn(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm border border-white/20 transition hover:bg-white/25 active:scale-95"
                            >
                                <UserPlus className="h-4 w-4" />
                                Vãng lai
                            </button>
                            <button
                                id="btn-book-appointment"
                                onClick={() => setShowBooking(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow transition hover:bg-blue-50 active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                Đặt lịch hẹn
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                KPI STAT CARDS
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                    icon={<CalendarHeart className="h-6 w-6" />}
                    label="Lịch hẹn hôm nay"
                    value={stats.total}
                    color="blue"
                    sub={`${todayDoctors.length} bác sĩ trực`}
                />
                <StatCard
                    icon={<Clock className="h-6 w-6" />}
                    label="Chờ tiếp nhận"
                    value={stats.waiting}
                    color="amber"
                    sub={stats.late > 0 ? `${stats.late} trễ giờ` : 'Đúng giờ'}
                    alert={stats.late > 0}
                />
                <StatCard
                    icon={<Activity className="h-6 w-6" />}
                    label="Đang khám"
                    value={stats.checkedIn}
                    color="sky"
                    sub="Realtime"
                    pulse
                />
                <StatCard
                    icon={<CheckCircle2 className="h-6 w-6" />}
                    label="Đã hoàn thành"
                    value={stats.done}
                    color="emerald"
                    sub={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}% hoàn thành` : '—'}
                />
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                PATIENT FLOW VISUALIZATION
            ══════════════════════════════════════════════════════════════════ */}
            <PatientFlowStrip appointments={todayAppointments} />

            {/* ══════════════════════════════════════════════════════════════════
                MAIN CONTENT (List + Doctor Panel)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-5 xl:flex-row">

                {/* ─── LEFT: Appointment List ─────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-4">

                    {/* Toolbar */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        {/* Search + Doctor Filter Row */}
                        <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:flex-row sm:items-center">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-blue-500" />
                                <input
                                    id="reception-search"
                                    type="text"
                                    placeholder="Tìm tên, SĐT, dịch vụ..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="peer w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Doctor Filter */}
                            <div className="flex items-center gap-2">
                                <select
                                    id="reception-doctor-filter"
                                    value={doctorFilter}
                                    onChange={e => setDoctorFilter(e.target.value)}
                                    className="h-10 rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="all">Tất cả bác sĩ</option>
                                    {todayDoctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.fullName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-thin">
                            {([
                                { key: 'all',          label: 'Tất cả',      count: todayAppointments.length },
                                { key: 'Đã lên lịch',  label: 'Chờ tiếp nhận', count: stats.waiting },
                                { key: 'Đã đến',       label: 'Đã đến',      count: todayAppointments.filter(a => a.status === 'Đã đến').length },
                                { key: 'Đang điều trị',label: 'Đang khám',   count: todayAppointments.filter(a => a.status === 'Đang điều trị').length },
                                { key: 'Đã hoàn thành',label: 'Hoàn thành',  count: stats.done },
                            ] as { key: StatusFilter; label: string; count: number }[]).map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={[
                                        'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap',
                                        statusFilter === tab.key
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
                                    ].join(' ')}
                                >
                                    {tab.label}
                                    <span className={[
                                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                        statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                                    ].join(' ')}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Appointment Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" ref={menuRef}>
                        {isLoading ? (
                            <LoadingRows />
                        ) : filtered.length === 0 ? (
                            <EmptyList />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:border-slate-800 dark:from-slate-800/80 dark:to-slate-800/40">
                                            <th className="sticky top-0 px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Giờ hẹn</th>
                                            <th className="sticky top-0 px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Bệnh nhân</th>
                                            <th className="sticky top-0 px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">Dịch vụ</th>
                                            <th className="sticky top-0 px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">Bác sĩ</th>
                                            <th className="sticky top-0 px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Trạng thái</th>
                                            <th className="sticky top-0 px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                                        {filtered.map(apt => {
                                            const patient = patients.find(p => p.id === apt.patientId)
                                            const hasAllergy = patient?.allergies && patient.allergies.length > 0
                                            const late = isLate(apt)
                                            const waitMin = late ? getWaitMinutes(apt) : 0
                                            const initials = apt.patientName.split(' ').slice(-2).map(w => w[0]).join('')

                                            // Row styling based on patient state
                                            let rowClass = 'apt-row'
                                            let rowStyle = {}
                                            if (hasAllergy && apt.status !== 'Đã hoàn thành') {
                                                rowClass += ' border-l-4 border-rose-400'
                                                rowStyle = { backgroundColor: 'rgba(254,242,242,0.5)' }
                                            } else if (apt.status === 'Đang điều trị') {
                                                rowClass += ' border-l-4 border-blue-400'
                                                rowStyle = { backgroundColor: 'rgba(239,246,255,0.4)' }
                                            } else if (apt.status === 'Đã hoàn thành') {
                                                rowStyle = { backgroundColor: 'rgba(240,253,244,0.3)' }
                                            } else if (late) {
                                                rowClass += ' border-l-4 border-amber-400'
                                                rowStyle = { backgroundColor: 'rgba(255,251,235,0.5)' }
                                            }

                                            return (
                                                <tr
                                                    key={apt.id}
                                                    data-testid={`apt-row-${apt.id}`}
                                                    className={rowClass}
                                                    style={rowStyle}
                                                >
                                                    {/* Time */}
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                                                            {new Date(apt.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            → {new Date(apt.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        {late && (
                                                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                                                <Timer className="h-2.5 w-2.5" />
                                                                Trễ {waitMin}p
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Patient */}
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {/* Avatar */}
                                                            <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(apt.patientName)} text-sm font-bold text-white shadow-sm`}>
                                                                {initials || '?'}
                                                                {hasAllergy && (
                                                                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">!</span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[120px]">
                                                                        {apt.patientName}
                                                                    </span>
                                                                </div>
                                                                {patient?.phone && (
                                                                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                                                        <PhoneCall className="h-2.5 w-2.5" />
                                                                        {patient.phone}
                                                                    </div>
                                                                )}
                                                                {hasAllergy && (
                                                                    <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                                                                        <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                                                        <span className="truncate max-w-[130px]">DỊ ỨNG: {patient!.allergies!.slice(0,2).join(', ')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Service */}
                                                    <td className="px-4 py-4 hidden md:table-cell">
                                                        <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{apt.serviceName}</div>
                                                        <div className="text-[11px] text-slate-400 mt-0.5">
                                                            {services.find(s => s.id === apt.serviceId)?.duration ?? '—'} phút
                                                        </div>
                                                    </td>

                                                    {/* Doctor */}
                                                    <td className="px-4 py-4 hidden lg:table-cell">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                                                <Stethoscope className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <span className="text-sm text-slate-700 dark:text-slate-300">{apt.doctorName}</span>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-4">
                                                        <StatusBadge status={apt.status} />
                                                        {apt.status === 'Đã đến' && apt.checkInTime && (
                                                            <div className="mt-1 text-[10px] text-slate-400">
                                                                Check-in {new Date(apt.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Primary action */}
                                                            {apt.status === 'Đã lên lịch' && (
                                                                <button
                                                                    id={`btn-checkin-${apt.id}`}
                                                                    onClick={() => checkIn(apt.id)}
                                                                    disabled={checkingIn}
                                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md active:scale-95 disabled:opacity-60"
                                                                >
                                                                    <LogIn className="h-3.5 w-3.5" />
                                                                    Check-in
                                                                </button>
                                                            )}
                                                            {apt.status === 'Đã đến' && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800">
                                                                    <UserCheck className="h-3.5 w-3.5" />
                                                                    Đã tiếp nhận
                                                                </span>
                                                            )}
                                                            {apt.status === 'Đang điều trị' && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                                                                    <Activity className="h-3.5 w-3.5 animate-pulse-slow" />
                                                                    Đang khám
                                                                </span>
                                                            )}
                                                            {apt.status === 'Đã hoàn thành' && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    Hoàn thành
                                                                </span>
                                                            )}

                                                            {/* Secondary icon actions — visible on hover */}
                                                            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <ActionIconBtn icon={<Eye className="h-3.5 w-3.5" />} label="Xem hồ sơ" onClick={() => handleViewPatient(apt.patientId)} />
                                                                <ActionIconBtn icon={<Printer className="h-3.5 w-3.5" />} label="In phiếu" onClick={() => setShowPrint(apt)} />
                                                                <ActionIconBtn icon={<PhoneCall className="h-3.5 w-3.5" />} label="Gọi BN" onClick={() => handleCallPatient(apt.patientName)} />
                                                            </div>

                                                            {/* Context Menu */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setOpenId(openId === apt.id ? null : apt.id)}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </button>
                                                                {openId === apt.id && (
                                                                    <ContextMenu
                                                                        onClose={() => setOpenId(null)}
                                                                        items={[
                                                                            { icon: <Eye className="h-3.5 w-3.5" />, label: 'Xem hồ sơ bệnh nhân', onClick: () => handleViewPatient(apt.patientId) },
                                                                            { icon: <Printer className="h-3.5 w-3.5" />, label: 'In phiếu khám', onClick: () => setShowPrint(apt) },
                                                                            { icon: <PhoneCall className="h-3.5 w-3.5" />, label: 'Gọi bệnh nhân', onClick: () => handleCallPatient(apt.patientName) },
                                                                            { icon: <Stethoscope className="h-3.5 w-3.5" />, label: 'Chuyển bác sĩ', onClick: () => setShowSwitchDoctor(apt.id) },
                                                                            { icon: <CalendarHeart className="h-3.5 w-3.5" />, label: 'Đổi lịch hẹn', onClick: () => setShowReschedule(apt.id) },
                                                                            { icon: <Wallet className="h-3.5 w-3.5" />, label: 'Thanh toán nhanh', onClick: () => handleQuickPayment(apt.patientName), highlight: true },
                                                                        ]}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Table Footer */}
                        {!isLoading && filtered.length > 0 && (
                            <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                                <p className="text-xs text-slate-400">
                                    Hiển thị <span className="font-semibold text-slate-600 dark:text-slate-300">{filtered.length}</span> / {todayAppointments.length} lịch hẹn hôm nay
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── RIGHT: Doctor Panel ────────────────────────────────────── */}
                <div className="w-full xl:w-72 shrink-0 space-y-4">

                    {/* Doctor Status Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                        {/* Card Header */}
                        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 px-4 py-3 dark:border-slate-800 dark:from-slate-800/50 dark:to-blue-900/10">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <Stethoscope className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Bác sĩ trực</h3>
                                <p className="text-[10px] text-slate-400">{todayShifts.length} ca hôm nay</p>
                            </div>
                            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                        </div>

                        {/* Doctor List */}
                        <div className="p-3 space-y-2.5">
                            {shiftsLoading || doctorsLoading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-20 rounded-xl animate-shimmer" />
                                ))
                            ) : todayShifts.length === 0 ? (
                                <div className="rounded-xl bg-slate-50 py-8 text-center dark:bg-slate-800/40">
                                    <Stethoscope className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-400">Chưa có ca trực hôm nay</p>
                                </div>
                            ) : (
                                todayShifts.map(shift => {
                                    const doc = doctors.find(d => d.id === shift.doctorId)
                                    const docApts = todayAppointments.filter(a => a.doctorId === shift.doctorId)
                                    const done = docApts.filter(a => a.status === 'Đã hoàn thành').length
                                    const total = docApts.length
                                    const progress = total > 0 ? Math.round((done / total) * 100) : 0
                                    const busy = docApts.some(a => a.status === 'Đang điều trị')
                                    const waiting = docApts.filter(a => a.status === 'Đã lên lịch' || a.status === 'Đã đến').length

                                    return (
                                        <div
                                            key={shift.id}
                                            data-testid={`doctor-panel-${shift.doctorId}`}
                                            className={[
                                                'rounded-xl border p-3 transition',
                                                busy
                                                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-900/10'
                                                    : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {/* Doctor Avatar */}
                                                <div className={[
                                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white',
                                                    busy ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600',
                                                ].join(' ')}>
                                                    {(doc?.fullName ?? shift.doctorName).split(' ').pop()?.charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                                                            {doc?.fullName ?? shift.doctorName}
                                                        </p>
                                                        <DoctorStatusBadge busy={busy} />
                                                    </div>
                                                    <p className="text-[10px] text-slate-400">{shift.startTime} – {shift.endTime}</p>
                                                </div>
                                            </div>

                                            {/* Stats row */}
                                            <div className="mt-2.5 flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{waiting}</span> đang chờ
                                                </span>
                                                <span className="text-slate-500">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{done}</span>/{total} ca
                                                </span>
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">{progress}%</span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                                <div
                                                    className={[
                                                        'h-full rounded-full transition-all duration-700',
                                                        busy ? 'bg-amber-500' : 'bg-blue-500',
                                                    ].join(' ')}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            {/* Specialty */}
                                            {doc?.specialty && (
                                                <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                                    {doc.specialty}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Quick Tip Card */}
                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50/50 p-4 dark:border-blue-900/30 dark:from-blue-900/10 dark:to-cyan-900/5">
                        <div className="flex gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <p className="font-semibold">Hướng dẫn nhanh</p>
                                <p>Nhấn <strong>Check-in</strong> khi bệnh nhân đến quầy.</p>
                                <p>Dùng <strong>Vãng lai</strong> cho khách chưa có lịch hẹn.</p>
                                <p>Nhấn <strong>···</strong> để xem thêm hành động.</p>
                            </div>
                        </div>
                    </div>

                    {/* Today Summary */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Tóm tắt hôm nay
                        </h4>
                        <div className="space-y-2">
                            {[
                                { label: 'Tổng lịch hẹn', value: stats.total, color: 'text-blue-600' },
                                { label: 'Chờ tiếp nhận', value: stats.waiting, color: 'text-amber-600' },
                                { label: 'Đang điều trị', value: stats.checkedIn, color: 'text-sky-600' },
                                { label: 'Hoàn thành', value: stats.done, color: 'text-emerald-600' },
                                ...(stats.late > 0 ? [{ label: 'Trễ giờ', value: stats.late, color: 'text-rose-600' }] : []),
                            ].map(row => (
                                <div key={row.label} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                                    <span className={`font-bold ${row.color}`}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                MODALS
            ══════════════════════════════════════════════════════════════════ */}
            {showWalkIn && (
                <WalkInModal
                    patients={patients}
                    doctors={doctors.filter(d => todayDoctorIds.has(d.id))}
                    services={services}
                    activePolicies={activePolicies}
                    todayShifts={todayShifts}
                    onClose={() => setShowWalkIn(false)}
                    onSubmit={(data) => { createWalkIn(data); setShowWalkIn(false) }}
                    isSubmitting={creatingWalkIn}
                />
            )}

            {showBooking && (
                <BookingModal
                    patients={patients}
                    doctors={doctors}
                    services={services}
                    appointments={appointments}
                    shifts={shifts}
                    activePolicies={activePolicies}
                    onClose={() => setShowBooking(false)}
                    onSubmit={(data) => { createAppointment(data); setShowBooking(false) }}
                    isSubmitting={creatingApt}
                />
            )}

            {showSwitchDoctor && appointments.find(a => a.id === showSwitchDoctor) && (
                <SwitchDoctorModal
                    appointment={appointments.find(a => a.id === showSwitchDoctor)!}
                    doctors={doctors}
                    todayShifts={todayShifts}
                    onClose={() => setShowSwitchDoctor(null)}
                    onSubmit={switchDoctor}
                    isSubmitting={switchingDoctor}
                />
            )}

            {showReschedule && appointments.find(a => a.id === showReschedule) && (
                <RescheduleModal
                    appointment={appointments.find(a => a.id === showReschedule)!}
                    onClose={() => setShowReschedule(null)}
                    onSubmit={rescheduleApt}
                    isSubmitting={rescheduling}
                />
            )}

            {showPrint && (
                <PrintSlipModal
                    appointment={showPrint}
                    onClose={() => setShowPrint(null)}
                />
            )}
        </section>
    )
}

// ─── Switch Doctor Modal ───────────────────────────────────────────────────────
function SwitchDoctorModal({ appointment, doctors, todayShifts, onClose, onSubmit, isSubmitting }: any) {
    const { addToast } = useToast()
    const [doctorId, setDoctorId] = useState(appointment.doctorId)

    const todayDoctorIds = new Set(todayShifts.map((s: any) => s.doctorId))
    const availableDoctors = doctors.filter((d: any) => todayDoctorIds.has(d.id))

    const handleSubmit = () => {
        if (!doctorId) {
            addToast('error', 'Vui lòng chọn bác sĩ mới.')
            return
        }
        const doctor = doctors.find((d: any) => d.id === doctorId)
        onSubmit({ id: appointment.id, doctorId, doctorName: doctor?.fullName })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">Chuyển Bác Sĩ</h3>
                    <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <FormField label="Bác sĩ hiện tại">
                        <input type="text" value={appointment.doctorName} disabled className="field-input cursor-not-allowed bg-slate-50" />
                    </FormField>
                    <FormField label="Bác sĩ mới *">
                        <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="field-input">
                            <option value="">Chọn bác sĩ</option>
                            {availableDoctors.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.fullName}</option>
                            ))}
                        </select>
                    </FormField>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
                    <button onClick={handleSubmit} disabled={isSubmitting || doctorId === appointment.doctorId} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">Xác nhận chuyển</button>
                </div>
            </div>
        </div>
    )
}

// ─── Reschedule Modal ──────────────────────────────────────────────────────────
function RescheduleModal({ appointment, onClose, onSubmit, isSubmitting }: any) {
    const { addToast } = useToast()
    const [startTime, setStartTime] = useState(new Date(appointment.startTime).toISOString().slice(0, 16))

    const handleSubmit = () => {
        if (!startTime) {
            addToast('error', 'Vui lòng chọn thời gian mới.')
            return
        }
        const startDt = new Date(startTime)
        const diff = new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()
        const endDt = new Date(startDt.getTime() + diff)
        onSubmit({ id: appointment.id, startTime: startDt.toISOString(), endTime: endDt.toISOString() })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">Đổi Lịch Hẹn</h3>
                    <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <FormField label="Thời gian cũ">
                        <input type="text" value={new Date(appointment.startTime).toLocaleString('vi-VN')} disabled className="field-input cursor-not-allowed bg-slate-50" />
                    </FormField>
                    <FormField label="Thời gian mới *">
                        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="field-input" />
                    </FormField>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">Lưu thay đổi</button>
                </div>
            </div>
        </div>
    )
}

// ─── Print Slip Modal ──────────────────────────────────────────────────────────
function PrintSlipModal({ appointment, onClose }: any) {
    const handlePrint = () => window.print()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:bg-white print:p-0">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl print:shadow-none print:w-full print:max-w-full">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 print:hidden">
                    <h3 className="text-base font-bold text-slate-800">In Phiếu Khám</h3>
                    <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
                </div>
                
                {/* Printable Content */}
                <div className="p-8 print:p-0">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-black text-blue-900 print:text-black">NHA KHOA SMILE</h1>
                        <p className="text-sm text-slate-500 print:text-black">123 Đường Răng Sứ, Quận Smile, TP HCM</p>
                        <h2 className="text-xl font-bold mt-4 print:text-black">PHIẾU KHÁM BỆNH</h2>
                    </div>
                    
                    <div className="space-y-3 text-sm print:text-black">
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Mã KH:</span> <span className="font-bold">{appointment.patientId.slice(0, 8).toUpperCase()}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Tên bệnh nhân:</span> <span className="font-bold text-lg">{appointment.patientName}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Bác sĩ phụ trách:</span> <span className="font-semibold">{appointment.doctorName}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Dịch vụ đăng ký:</span> <span>{appointment.serviceName}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Ngày giờ hẹn:</span> <span>{new Date(appointment.startTime).toLocaleString('vi-VN')}</span></div>
                    </div>

                    <div className="mt-8 text-center text-xs text-slate-500 italic print:text-black">
                        Vui lòng mang theo phiếu này khi đến khám. Chúc quý khách sức khỏe!
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 print:hidden">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Đóng</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900">
                        <Printer className="h-4 w-4" /> In Phiếu
                    </button>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    .print\\:bg-white, .print\\:bg-white * { visibility: visible; }
                    .print\\:hidden { display: none !important; }
                    .print\\:bg-white { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}} />
        </div>
    )
}

// ─── Patient Flow Strip ────────────────────────────────────────────────────────
function PatientFlowStrip({ appointments }: { appointments: Appointment[] }) {
    const steps = [
        { label: 'Đã lên lịch', icon: <CalendarHeart className="h-4 w-4" />, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800', bar: 'bg-slate-300', count: appointments.filter(a => a.status === 'Đã lên lịch').length },
        { label: 'Đã đến',      icon: <UserPlus className="h-4 w-4" />,      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40',   bar: 'bg-blue-500',  count: appointments.filter(a => a.status === 'Đã đến').length },
        { label: 'Đang khám',   icon: <Stethoscope className="h-4 w-4" />,   color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40', bar: 'bg-amber-500', count: appointments.filter(a => a.status === 'Đang điều trị').length },
        { label: 'Hoàn thành',  icon: <CheckCircle2 className="h-4 w-4" />,  color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40', bar: 'bg-emerald-500', count: appointments.filter(a => a.status === 'Đã hoàn thành').length },
    ]
    return (
        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-slate-400 mr-1">Luồng bệnh nhân</span>
            {steps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${step.color}`}>
                        {step.icon}
                        <div>
                            <div className="text-[10px] font-medium opacity-70 leading-none">{step.label}</div>
                            <div className="text-base font-black leading-tight">{step.count}</div>
                        </div>
                    </div>
                    {i < steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub, pulse, alert }: {
    icon: React.ReactNode
    label: string
    value: number
    color: 'blue' | 'amber' | 'sky' | 'emerald'
    sub?: string
    pulse?: boolean
    alert?: boolean
}) {
    const map = {
        blue:    { icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',     bar: 'bg-blue-500',    num: 'text-blue-700 dark:text-blue-300' },
        amber:   { icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400', bar: 'bg-amber-500',   num: 'text-amber-700 dark:text-amber-300' },
        sky:     { icon: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',         bar: 'bg-sky-500',     num: 'text-sky-700 dark:text-sky-300' },
        emerald: { icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400', bar: 'bg-emerald-500', num: 'text-emerald-700 dark:text-emerald-300' },
    }
    const c = map[color]
    return (
        <div className="card-hover relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${c.icon}`}>
                    {pulse ? <span className="animate-pulse-slow">{icon}</span> : icon}
                </div>
                {alert && (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse-slow" />
                )}
            </div>
            <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">{label}</p>
                <p className={`mt-1 text-4xl font-black leading-none ${c.num}`}>{value}</p>
                {sub && (
                    <p className={`mt-1.5 text-[11px] font-medium ${alert ? 'text-rose-500' : 'text-slate-400'}`}>{sub}</p>
                )}
            </div>
            <div className={`stat-accent ${c.bar} opacity-70`} />
        </div>
    )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Appointment['status'] }) {
    const map: Record<string, { cls: string; dot?: string }> = {
        'Đã lên lịch':   { cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
        'Đã đến':        { cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800' },
        'Đang điều trị': { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', dot: 'bg-amber-500 animate-pulse-slow' },
        'Đã hoàn thành': { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' },
        'Đã hủy':        { cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' },
    }
    const s = map[status] ?? { cls: 'bg-slate-100 text-slate-600 border-slate-200' }
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>
            {s.dot && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
            {status}
        </span>
    )
}

// ─── Doctor Status Badge ───────────────────────────────────────────────────────
function DoctorStatusBadge({ busy }: { busy: boolean }) {
    return busy ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse-slow" />
            Đang khám
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Rảnh
        </span>
    )
}

// ─── Action Icon Button ────────────────────────────────────────────────────────
function ActionIconBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            title={label}
            onClick={onClick}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
            {icon}
        </button>
    )
}

// ─── Context Menu ──────────────────────────────────────────────────────────────
function ContextMenu({ items, onClose }: {
    items: { icon: React.ReactNode; label: string; onClick: () => void; highlight?: boolean }[]
    onClose: () => void
}) {
    return (
        <div className="absolute right-0 top-8 z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {items.map((item, i) => (
                <button
                    key={i}
                    onClick={() => { item.onClick(); onClose() }}
                    className={[
                        'flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800',
                        item.highlight ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300',
                    ].join(' ')}
                >
                    <span className={item.highlight ? 'text-blue-500' : 'text-slate-400'}>{item.icon}</span>
                    {item.label}
                </button>
            ))}
        </div>
    )
}

// ─── Loading Rows ──────────────────────────────────────────────────────────────
function LoadingRows() {
    return (
        <div className="space-y-0 divide-y divide-slate-50 dark:divide-slate-800">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-10 w-10 rounded-xl animate-shimmer" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-2/5 rounded-full animate-shimmer" />
                        <div className="h-2.5 w-1/4 rounded-full animate-shimmer" />
                    </div>
                    <div className="h-6 w-20 rounded-full animate-shimmer" />
                    <div className="h-8 w-20 rounded-xl animate-shimmer" />
                </div>
            ))}
        </div>
    )
}

// ─── Empty List ────────────────────────────────────────────────────────────────
function EmptyList() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <CalendarHeart className="h-8 w-8 opacity-40" />
            </div>
            <p className="text-base font-semibold text-slate-500 dark:text-slate-400">Không có lịch hẹn</p>
            <p className="mt-1 text-sm text-slate-400">Hôm nay chưa có bệnh nhân nào trong danh sách này</p>
        </div>
    )
}

// ─── Walk-in Modal ─────────────────────────────────────────────────────────────
function WalkInModal({ patients, doctors, services, activePolicies, todayShifts, onClose, onSubmit, isSubmitting }: {
    patients: Patient[]
    doctors: Doctor[]
    services: Service[]
    activePolicies: PricingPolicy[]
    todayShifts: DoctorShift[]
    onClose: () => void
    onSubmit: (data: any) => void
    isSubmitting: boolean
}) {
    const { addToast } = useToast()
    const [form, setForm] = useState({
        patientPhone: '',
        patientName: '',
        patientAge: '',
        allergiesRaw: '',
        doctorId: '',
        serviceId: '',
        discountPolicyId: '',
    })

    useEffect(() => {
        if (form.patientPhone.length >= 10) {
            const found = patients.find(p => p.phone === form.patientPhone)
            if (found) {
                const age = new Date().getFullYear() - new Date(found.dateOfBirth).getFullYear()
                setForm(s => ({
                    ...s,
                    patientName: found.fullName,
                    patientAge: String(age),
                    allergiesRaw: found.allergies?.join(', ') ?? '',
                }))
            }
        }
    }, [form.patientPhone, patients])

    const selectedService = services.find(s => s.id === form.serviceId)
    const selectedPolicy = activePolicies.find(p => p.id === form.discountPolicyId && p.serviceId === form.serviceId)
    const originalPrice = selectedService?.basePrice ?? 0
    const discountedPrice = selectedPolicy ? selectedPolicy.price : originalPrice

    const handleSubmit = () => {
        if (!form.patientPhone || !form.patientName || !form.doctorId || !form.serviceId) {
            addToast('error', 'Vui lòng điền đủ: SĐT, Tên, Bác sĩ, Dịch vụ.')
            return
        }
        onSubmit({
            ...form,
            allergies: form.allergiesRaw.split(',').map(s => s.trim()).filter(Boolean),
            discountPolicyId: form.discountPolicyId || undefined,
        })
    }

    const shiftDoctorIds = new Set(todayShifts.map(s => s.doctorId))
    const availableDoctors = doctors.filter(d => shiftDoctorIds.has(d.id))
    const relevantPolicies = activePolicies.filter(p => !form.serviceId || p.serviceId === form.serviceId)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900" id="modal-walk-in">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/30">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">Tiếp nhận Vãng lai</h3>
                            <p className="text-xs text-slate-500">Bệnh nhân chưa có lịch hẹn</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
                    {/* Phone */}
                    <FormField label="Số điện thoại *" icon={<PhoneCall className="h-3.5 w-3.5" />}>
                        <input
                            id="walkin-phone"
                            type="tel"
                            value={form.patientPhone}
                            onChange={e => setForm(s => ({ ...s, patientPhone: e.target.value }))}
                            placeholder="0xxxxxxxxx"
                            className="field-input"
                        />
                    </FormField>

                    {/* Name + Age */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <FormField label="Họ tên *">
                                <input
                                    id="walkin-name"
                                    type="text"
                                    value={form.patientName}
                                    onChange={e => setForm(s => ({ ...s, patientName: e.target.value }))}
                                    placeholder="Nguyễn Văn A"
                                    className="field-input"
                                />
                            </FormField>
                        </div>
                        <div>
                            <FormField label="Tuổi">
                                <input
                                    id="walkin-age"
                                    type="number"
                                    value={form.patientAge}
                                    onChange={e => setForm(s => ({ ...s, patientAge: e.target.value }))}
                                    placeholder="30"
                                    className="field-input"
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Allergies */}
                    <FormField label="Dị ứng (nếu có)" icon={<AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}>
                        <input
                            id="walkin-allergies"
                            type="text"
                            value={form.allergiesRaw}
                            onChange={e => setForm(s => ({ ...s, allergiesRaw: e.target.value }))}
                            placeholder="Penicillin, Aspirin..."
                            className="field-input"
                        />
                    </FormField>

                    {/* Doctor + Service */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Bác sĩ *" icon={<Stethoscope className="h-3.5 w-3.5" />}>
                            <select
                                id="walkin-doctor"
                                value={form.doctorId}
                                onChange={e => setForm(s => ({ ...s, doctorId: e.target.value }))}
                                className="field-input"
                            >
                                <option value="">Chọn bác sĩ</option>
                                {availableDoctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.fullName}</option>
                                ))}
                            </select>
                            {availableDoctors.length === 0 && (
                                <p className="mt-1 text-[10px] text-amber-600">⚠ Chưa có bác sĩ trực hôm nay</p>
                            )}
                        </FormField>
                        <FormField label="Dịch vụ *">
                            <select
                                id="walkin-service"
                                value={form.serviceId}
                                onChange={e => setForm(s => ({ ...s, serviceId: e.target.value, discountPolicyId: '' }))}
                                className="field-input"
                            >
                                <option value="">Chọn dịch vụ</option>
                                {services.filter(s => s.status === 'active').map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    {/* Discount Policy */}
                    <FormField label="Ưu đãi / Giảm giá" icon={<Tag className="h-3.5 w-3.5 text-violet-500" />}>
                        <select
                            id="walkin-discount"
                            value={form.discountPolicyId}
                            onChange={e => setForm(s => ({ ...s, discountPolicyId: e.target.value }))}
                            className="field-input"
                            disabled={relevantPolicies.length === 0}
                        >
                            <option value="">Không áp dụng ưu đãi</option>
                            {relevantPolicies.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.serviceName} — {formatVND(p.price)} (đến {formatDate(p.expiryDate)})
                                </option>
                            ))}
                        </select>
                    </FormField>

                    {/* Price Preview */}
                    {selectedService && (
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-3.5 dark:border-slate-700 dark:from-slate-800/50 dark:to-blue-900/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Wallet className="h-4 w-4 text-blue-500" />
                                    <span>Giá dịch vụ</span>
                                </div>
                                <div className="text-right">
                                    {selectedPolicy ? (
                                        <>
                                            <span className="text-xs text-slate-400 line-through mr-2">{formatVND(originalPrice)}</span>
                                            <span className="font-bold text-emerald-600">{formatVND(discountedPrice)}</span>
                                        </>
                                    ) : (
                                        <span className="font-bold text-slate-800 dark:text-white">{formatVND(originalPrice)}</span>
                                    )}
                                </div>
                            </div>
                            {selectedPolicy && (
                                <div className="mt-1 text-[11px] text-emerald-600 font-semibold text-right">
                                    Tiết kiệm {formatVND(originalPrice - discountedPrice)} ({Math.round((1 - discountedPrice / originalPrice) * 100)}%)
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        Hủy
                    </button>
                    <button
                        id="btn-walkin-submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-60"
                    >
                        <LogIn className="h-4 w-4" />
                        {isSubmitting ? 'Đang tiếp nhận...' : 'Tiếp nhận & Check-in'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ patients, doctors, services, appointments, shifts, activePolicies, onClose, onSubmit, isSubmitting }: {
    patients: Patient[]
    doctors: Doctor[]
    services: Service[]
    appointments: Appointment[]
    shifts: DoctorShift[]
    activePolicies: PricingPolicy[]
    onClose: () => void
    onSubmit: (data: any) => void
    isSubmitting: boolean
}) {
    const { addToast } = useToast()
    const [patientSearch, setPatientSearch] = useState('')
    const [form, setForm] = useState({
        patientId: '',
        doctorId: '',
        serviceId: '',
        startTime: '',
        notes: '',
        discountPolicyId: '',
    })
    const [conflictWarning, setConflictWarning] = useState('')

    const filteredPatients = useMemo(() => {
        if (!patientSearch || form.patientId) return []
        const q = patientSearch.toLowerCase()
        return patients.filter(p =>
            p.fullName.toLowerCase().includes(q) || p.phone.includes(q)
        ).slice(0, 8)
    }, [patientSearch, form.patientId, patients])

    const selectedPatient = patients.find(p => p.id === form.patientId)
    const selectedService = services.find(s => s.id === form.serviceId)
    const selectedPolicy = activePolicies.find(p => p.id === form.discountPolicyId && p.serviceId === form.serviceId)
    const originalPrice = selectedService?.basePrice ?? 0
    const discountedPrice = selectedPolicy ? selectedPolicy.price : originalPrice

    // Conflict check
    useEffect(() => {
        setConflictWarning('')
        if (!form.doctorId || !form.startTime || !selectedService) return
        const startDt = new Date(form.startTime)
        const endDt = new Date(startDt.getTime() + selectedService.duration * 60_000)
        const conflict = appointments.find(a => {
            if (a.doctorId !== form.doctorId || a.status === 'Đã hủy') return false
            const aStart = new Date(a.startTime)
            const aEnd = new Date(a.endTime)
            return startDt < aEnd && endDt > aStart
        })
        if (conflict) {
            setConflictWarning(`Trùng lịch với: ${conflict.patientName} (${new Date(conflict.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`)
        }
    }, [form.doctorId, form.startTime, form.serviceId, appointments, selectedService])

    const getDateKey = (dt: Date) => {
        const y = dt.getFullYear()
        const m = String(dt.getMonth() + 1).padStart(2, '0')
        const d = String(dt.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }
    const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
    }
    const isDoctorAvailable = (doctorId: string): boolean => {
        if (!form.startTime || !selectedService) return true
        const startDt = new Date(form.startTime)
        const endDt = new Date(startDt.getTime() + selectedService.duration * 60_000)
        const dateKey = getDateKey(startDt)
        const startMin = toMinutes(`${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`)
        const endMin = toMinutes(`${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`)
        const docShifts = shifts.filter(s => s.doctorId === doctorId && s.date === dateKey)
        if (docShifts.length === 0) return false
        return docShifts.some(s => startMin >= toMinutes(s.startTime) && endMin <= toMinutes(s.endTime))
    }

    const relevantPolicies = activePolicies.filter(p => !form.serviceId || p.serviceId === form.serviceId)

    const handleSubmit = () => {
        if (!form.patientId || !form.doctorId || !form.serviceId || !form.startTime) {
            addToast('error', 'Vui lòng điền đủ: Bệnh nhân, Bác sĩ, Dịch vụ, Thời gian.')
            return
        }
        if (conflictWarning) {
            addToast('error', 'Bác sĩ đã có lịch hẹn trùng giờ. Vui lòng chọn giờ khác.')
            return
        }
        const patient = patients.find(p => p.id === form.patientId)!
        const doctor = doctors.find(d => d.id === form.doctorId)!
        const startDt = new Date(form.startTime)
        const endDt = new Date(startDt.getTime() + (selectedService?.duration ?? 30) * 60_000)
        onSubmit({
            patientId: patient.id,
            patientName: patient.fullName,
            doctorId: doctor.id,
            doctorName: doctor.fullName,
            serviceId: selectedService!.id,
            serviceName: selectedService!.name,
            startTime: startDt.toISOString(),
            endTime: endDt.toISOString(),
            notes: form.notes,
            status: 'Đã lên lịch',
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900" id="modal-booking">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
                            <CalendarHeart className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">Đặt lịch hẹn</h3>
                            <p className="text-xs text-slate-500">Lên lịch khám cho bệnh nhân</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
                    {/* Patient search */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            <Users className="inline h-3.5 w-3.5 mr-1" />Bệnh nhân *
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                id="booking-patient-search"
                                type="text"
                                value={patientSearch}
                                onChange={e => { setPatientSearch(e.target.value); setForm(s => ({ ...s, patientId: '' })) }}
                                placeholder="Tìm theo tên hoặc SĐT..."
                                className="field-input pl-10"
                            />
                        </div>
                        {patientSearch && !form.patientId && (
                            <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                {filteredPatients.length === 0 ? (
                                    <div className="py-3 text-center text-xs text-slate-400">Không tìm thấy bệnh nhân</div>
                                ) : (
                                    filteredPatients.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setForm(s => ({ ...s, patientId: p.id })); setPatientSearch(p.fullName) }}
                                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition"
                                        >
                                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white bg-gradient-to-br ${getAvatarGradient(p.fullName)}`}>
                                                {p.fullName.split(' ').pop()?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800 dark:text-white">{p.fullName}</div>
                                                <div className="text-[11px] text-slate-400">{p.phone}</div>
                                            </div>
                                            <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                        {selectedPatient && (
                            <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    {selectedPatient.fullName} · {selectedPatient.phone}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Doctor + Service */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Bác sĩ *" icon={<Stethoscope className="h-3.5 w-3.5" />}>
                            <select
                                id="booking-doctor"
                                value={form.doctorId}
                                onChange={e => setForm(s => ({ ...s, doctorId: e.target.value }))}
                                className="field-input"
                            >
                                <option value="">Chọn bác sĩ</option>
                                {doctors.map(d => {
                                    const available = !form.startTime || isDoctorAvailable(d.id)
                                    return (
                                        <option key={d.id} value={d.id}>
                                            {d.fullName}{!available && form.startTime ? ' (không có ca)' : ''}
                                        </option>
                                    )
                                })}
                            </select>
                        </FormField>
                        <FormField label="Dịch vụ *">
                            <select
                                id="booking-service"
                                value={form.serviceId}
                                onChange={e => setForm(s => ({ ...s, serviceId: e.target.value, discountPolicyId: '' }))}
                                className="field-input"
                            >
                                <option value="">Chọn dịch vụ</option>
                                {services.filter(s => s.status === 'active').map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.duration} phút)</option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    {/* Start time */}
                    <FormField label="Thời gian hẹn *" icon={<Clock className="h-3.5 w-3.5" />}>
                        <input
                            id="booking-starttime"
                            type="datetime-local"
                            value={form.startTime}
                            onChange={e => setForm(s => ({ ...s, startTime: e.target.value }))}
                            className="field-input"
                        />
                        {conflictWarning && (
                            <div className="mt-1.5 flex items-start gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                {conflictWarning}
                            </div>
                        )}
                        {form.doctorId && form.startTime && selectedService && !conflictWarning && (
                            isDoctorAvailable(form.doctorId) ? (
                                <div className="mt-1.5 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Bác sĩ có lịch trực vào khung giờ này
                                </div>
                            ) : (
                                <div className="mt-1.5 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                    Bác sĩ không có lịch trực vào khung giờ này
                                </div>
                            )
                        )}
                    </FormField>

                    {/* Discount */}
                    <FormField label="Ưu đãi / Giảm giá" icon={<Tag className="h-3.5 w-3.5 text-violet-500" />}>
                        <select
                            id="booking-discount"
                            value={form.discountPolicyId}
                            onChange={e => setForm(s => ({ ...s, discountPolicyId: e.target.value }))}
                            className="field-input"
                            disabled={relevantPolicies.length === 0}
                        >
                            <option value="">Không áp dụng ưu đãi</option>
                            {relevantPolicies.map(p => (
                                <option key={p.id} value={p.id}>{p.serviceName} — {formatVND(p.price)}</option>
                            ))}
                        </select>
                    </FormField>

                    {/* Notes */}
                    <FormField label="Ghi chú">
                        <textarea
                            id="booking-notes"
                            value={form.notes}
                            onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
                            rows={2}
                            placeholder="Ghi chú thêm về tình trạng bệnh nhân..."
                            className="field-input resize-none"
                        />
                    </FormField>

                    {/* Price summary */}
                    {selectedService && (
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/30 px-4 py-3.5 dark:border-slate-700 dark:from-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Wallet className="h-4 w-4 text-indigo-500" />
                                    <span>Giá dịch vụ</span>
                                </div>
                                <div className="text-right">
                                    {selectedPolicy ? (
                                        <>
                                            <span className="text-xs text-slate-400 line-through mr-2">{formatVND(originalPrice)}</span>
                                            <span className="font-bold text-emerald-600">{formatVND(discountedPrice)}</span>
                                        </>
                                    ) : (
                                        <span className="font-bold text-slate-800 dark:text-white">{formatVND(originalPrice)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        Hủy
                    </button>
                    <button
                        id="btn-booking-submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !!conflictWarning}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 active:scale-95 disabled:opacity-60"
                    >
                        <CalendarHeart className="h-4 w-4" />
                        {isSubmitting ? 'Đang lưu...' : 'Xác nhận đặt lịch'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Form Field Wrapper ────────────────────────────────────────────────────────
function FormField({ label, icon, children }: {
    label: string
    icon?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {icon && <span className="mr-1 inline">{icon}</span>}
                {label}
            </label>
            {children}
        </div>
    )
}
