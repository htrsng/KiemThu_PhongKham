import { useMemo } from 'react'
import {
    Activity,
    CalendarDays,
    ClipboardList,
    Users,
    UserCheck,
    DollarSign,
    UserPlus,
    CalendarX2,
    TrendingUp,
    PieChart,
    BarChart,
} from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { useAuth } from '../contexts/AuthContext'
import { getInitials, formatVND } from '../lib/formatters'
import { useNavigate } from 'react-router-dom'
import {
    ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line, CartesianGrid
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { api, type ApiListResponse } from '../lib/api'
import type { MockDoctor as Doctor, MockAppointment as Appointment, MockPatient as Patient, MockService as Service, MockActivity } from '../lib/mockData'


export function DashboardPage() {
    const { currentUser, logout } = useAuth() // Lấy hàm logout

    // Lấy dữ liệu thật từ API
    const { data: doctors = [] } = useQuery<Doctor[], Error>({ queryKey: ['doctors'], queryFn: async () => (await api.get<ApiListResponse<Doctor>>('/doctors')).data.data });
    const { data: appointments = [] } = useQuery<Appointment[], Error>({ queryKey: ['appointments'], queryFn: async () => (await api.get<ApiListResponse<Appointment>>('/appointments')).data.data });
    const { data: patients = [] } = useQuery<Patient[], Error>({ queryKey: ['patients'], queryFn: async () => (await api.get<ApiListResponse<Patient>>('/patients')).data.data });
    const { data: services = [] } = useQuery<Service[], Error>({ queryKey: ['services'], queryFn: async () => (await api.get<ApiListResponse<Service>>('/services')).data.data });
    // Dữ liệu hoạt động vẫn dùng mock vì chưa có API
    const activities = useMemo(() => [], []);

    const navigate = useNavigate() // Khởi tạo hàm navigate

    const analytics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // New patients this month
        const newPatientsThisMonth = patients.filter((p: Patient) => {
            const createdAt = new Date(p.createdAt);
            return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
        }).length;

        const monthAppointments = appointments.filter(a => {
            const startTime = new Date(a.startTime);
            return startTime.getMonth() === currentMonth && startTime.getFullYear() === currentYear;
        });

        // Total revenue this month
        const totalRevenueThisMonth = monthAppointments
            .filter(a => a.status === 'Đã hoàn thành')
            .reduce((sum, apt) => {
                const service = services.find((s: Service) => s.id === apt.serviceId);
                return sum + (service?.basePrice || 0);
            }, 0);

        // Cancellation rate
        const cancelledCount = monthAppointments.filter(a => a.status === 'Đã hủy').length;
        const cancellationRate = monthAppointments.length > 0 ? (cancelledCount / monthAppointments.length) * 100 : 0;

        // 7-day visit trends
        const visitTrends = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateString = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const count = appointments.filter(a => new Date(a.startTime).toDateString() === date.toDateString()).length;
            return { name: dateString, "Lượt khám": count };
        }).reverse();

        // Service distribution
        const serviceDistributionMap = new Map<string, number>();
        appointments.filter(a => a.status === 'Đã hoàn thành').forEach(apt => {
            serviceDistributionMap.set(apt.serviceName, (serviceDistributionMap.get(apt.serviceName) || 0) + 1);
        });
        const serviceDistribution = Array.from(serviceDistributionMap.entries()).map(([name, value]) => ({ name, value }));

        return { newPatientsThisMonth, totalRevenueThisMonth, cancellationRate, visitTrends, serviceDistribution };
    }, [appointments, patients, services]);

    // Render Doctor's Dashboard
    if (currentUser?.role === 'Doctor') {
        const myAppointments = useMemo(() => {
            if (!currentUser?.referenceId) return [];
            return appointments.filter(apt => apt.doctorId === currentUser.referenceId);
        }, [appointments, currentUser]);

        const todayAppointments = myAppointments.filter(
            (apt: Appointment) => new Date(apt.startTime).toDateString() === new Date().toDateString() && apt.status === 'Đã lên lịch'
        )

        return (
            <div className="space-y-8">
                <PageShell
                    title={`Chào mừng trở lại, Bác sĩ ${currentUser.fullName}!`}
                    description="Đây là tổng quan lịch làm việc và các hoạt động của bạn hôm nay."
                    testId="page-dashboard-doctor"
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Lịch hẹn hôm nay</p>
                                <p className="mt-3 text-3xl font-semibold text-slate-900">{todayAppointments.length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                        </div>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Bệnh nhân đã hoàn thành</p>
                                <p className="mt-3 text-3xl font-semibold text-slate-900">{myAppointments.filter(a => a.status === 'Đã hoàn thành').length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900">
                                <UserCheck className="h-5 w-5" />
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        )
    }

    const stats = useMemo(() => [
        { label: 'Doanh thu tháng', value: formatVND(analytics.totalRevenueThisMonth), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Bệnh nhân mới', value: analytics.newPatientsThisMonth, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Tỉ lệ hủy hẹn', value: `${analytics.cancellationRate.toFixed(1)}%`, icon: CalendarX2, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Bác sĩ hoạt động', value: doctors.filter(d => d.status === 'active').length, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
    ], [analytics, doctors])

    const PIE_CHART_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];


    // Render Admin's Dashboard
    return (
        <div className="space-y-8">
            <PageShell
                title="Dashboard"
                description="Tổng quan vận hành của SmileCare: theo dõi tài khoản, bác sĩ, dịch vụ và trạng thái hệ thống từ một giao diện thống nhất."
                testId="page-dashboard"
            />

            {/* Stat cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <article key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">{stat.label}</p>
                                    <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* 7-day visit trends */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-blue-900" />
                        <span className="font-semibold text-slate-800">Lượt khám trong 7 ngày qua</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={analytics.visitTrends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} />
                            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                            <Line type="monotone" dataKey="Lượt khám" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                </div>

                {/* Service Distribution */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="h-5 w-5 text-blue-900" />
                        <span className="font-semibold text-slate-800">Phân bổ dịch vụ</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={analytics.serviceDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelStyle={{ fontSize: '0.75rem', fill: '#475569' }}
                            >
                                {analytics.serviceDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} lượt`} />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-blue-900" />
                    <span className="font-semibold text-slate-800">Hoạt động gần đây</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[400px] w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Thời gian</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Loại</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Mô tả</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((act) => (
                                <tr key={act.id}>
                                    <td className="px-4 py-3 whitespace-nowrap">{new Date(act.timestamp).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{act.type}</td>
                                    <td className="px-4 py-3">{act.description}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{act.performer}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* On-Duty Doctors */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="h-5 w-5 text-blue-900" />
                    <span className="font-semibold text-slate-800">Bác sĩ đang làm việc</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {doctors.filter(d => d.status === 'active').slice(0, 6).map(doc => (
                        <div key={doc.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md">
                            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-900">{getInitials(doc.fullName)}</div>
                            <div>
                                <div className="font-semibold text-blue-900">{doc.fullName}</div>
                                <div className="text-xs text-slate-500">{doc.specialty} - {doc.degree}</div>
                                <button 
                                    onClick={() => navigate('/doctors')}
                                    className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    Xem lịch
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}