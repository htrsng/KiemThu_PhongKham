import { Activity, CalendarDays, ClipboardList, Users, BarChart2, PieChart, LineChart } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { generateMockAccounts, generateMockDoctors, generateMockServices, generateMockActivities } from '../lib/mockData'

const stats = [
    { label: 'Tài khoản đang hoạt động', value: generateMockAccounts().filter(a => a.status === 'Hoat dong').length, icon: Users },
    { label: 'Bác sĩ hoạt động', value: generateMockDoctors().filter(d => d.status === 'Hoat dong').length, icon: Activity },
    { label: 'Dịch vụ trong danh mục', value: generateMockServices().length, icon: ClipboardList },
    { label: 'Ca hẹn hôm nay', value: 28, icon: CalendarDays },
]

export function DashboardPage() {
    // Mock data
    const activities = generateMockActivities(6)
    const doctors = generateMockDoctors()
    const accounts = generateMockAccounts()
    const services = generateMockServices()

    // Simple chart mock (replace with chart lib if needed)
    function StatBar({ value, max, color }: { value: number, max: number, color: string }) {
        return <div className="h-3 rounded bg-slate-100"><div style={{ width: `${(value / max) * 100}%` }} className={`h-3 rounded ${color}`}></div></div>
    }

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
                                    <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>

            {/* Simple Bar Chart (mock) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="h-5 w-5 text-blue-900" />
                    <span className="font-semibold text-slate-800">Số bác sĩ theo chuyên môn</span>
                </div>
                <div className="space-y-3">
                    {Array.from(new Set(doctors.map(d => d.specialty))).map(specialty => {
                        const count = doctors.filter(d => d.specialty === specialty).length
                        return (
                            <div key={specialty} className="flex items-center gap-4">
                                <span className="w-40 text-slate-700">{specialty}</span>
                                <StatBar value={count} max={doctors.length} color="bg-blue-400" />
                                <span className="text-slate-500">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Simple Pie Chart (mock) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <PieChart className="h-5 w-5 text-blue-900" />
                    <span className="font-semibold text-slate-800">Tỉ lệ tài khoản theo vai trò</span>
                </div>
                <div className="flex gap-8 items-end">
                    {Array.from(new Set(accounts.map(a => a.role))).map(role => {
                        const count = accounts.filter(a => a.role === role).length
                        return (
                            <div key={role} className="flex flex-col items-center">
                                <div className="mb-2 h-20 w-20 rounded-full flex items-end justify-center bg-blue-100">
                                    <div style={{ height: `${count / accounts.length * 80}px` }} className="w-12 rounded-b-full bg-blue-500" />
                                </div>
                                <span className="text-slate-700 font-medium">{role}</span>
                                <span className="text-slate-500">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Simple Line Chart (mock) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <LineChart className="h-5 w-5 text-blue-900" />
                    <span className="font-semibold text-slate-800">Hoạt động gần đây</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[400px] w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Thời gian</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Loại</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Mô tả</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((act) => (
                                <tr key={act.id}>
                                    <td className="px-4 py-2 whitespace-nowrap">{new Date(act.timestamp).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{act.type}</td>
                                    <td className="px-4 py-2">{act.description}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{act.performer}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* On-duty doctors */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-blue-900" />
                    <span className="font-semibold text-slate-800">Bác sĩ đang làm việc</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {doctors.filter(d => d.status === 'Hoat dong').slice(0, 6).map(doc => (
                        <div key={doc.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-blue-50 p-4">
                            <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-900">
                                {doc.fullName.split(' ').slice(-1)[0][0]}
                            </div>
                            <div>
                                <div className="font-semibold text-blue-900">{doc.fullName}</div>
                                <div className="text-xs text-slate-500">{doc.specialty} - {doc.degree}</div>
                                <div className="text-xs text-slate-500">{doc.phone}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}