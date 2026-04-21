import { Activity, CalendarDays, ClipboardList, Users } from 'lucide-react'
import { PageShell } from '../components/PageShell'

const stats = [
    { label: 'Tài khoản đang hoạt động', value: '126', icon: Users },
    { label: 'Bác sĩ nội trú', value: '18', icon: Activity },
    { label: 'Dịch vụ trong danh mục', value: '42', icon: ClipboardList },
    { label: 'Ca hẹn hôm nay', value: '28', icon: CalendarDays },
]

export function DashboardPage() {
    return (
        <div className="space-y-6">
            <PageShell
                title="Dashboard"
                description="Tổng quan vận hành của SmileCare: theo dõi tài khoản, bác sĩ, dịch vụ và trạng thái hệ thống từ một giao diện thống nhất."
                testId="page-dashboard"
            />

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
        </div>
    )
}