import { Bell, ChevronRight, CircleUserRound } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { routeTitleMap } from '../config/navigation'

function getBreadcrumbItems(pathname: string) {
    if (pathname === '/') {
        return ['Dashboard']
    }

    return ['Dashboard', routeTitleMap[pathname] ?? 'Unknown']
}

export function AppHeader() {
    const { pathname } = useLocation()
    const breadcrumbItems = getBreadcrumbItems(pathname)

    return (
        <header className="flex items-center justify-between gap-6 border-b border-slate-200/80 bg-white/85 px-6 py-4 backdrop-blur-xl">
            <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    {breadcrumbItems.map((item, index) => (
                        <span key={item} className="flex items-center gap-2">
                            <span className={index === breadcrumbItems.length - 1 ? 'text-slate-900' : ''}>{item}</span>
                            {index < breadcrumbItems.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                        </span>
                    ))}
                </div>
                <h1 className="mt-1 truncate text-xl font-semibold text-slate-900">SmileCare Dental Clinic</h1>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    data-testid="btn-notifications"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                </button>

                <button
                    type="button"
                    data-testid="btn-user-profile"
                    className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-slate-300"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white">
                        <CircleUserRound className="h-5 w-5" />
                    </span>
                    <span className="hidden min-w-0 sm:block">
                        <span className="block text-sm font-semibold text-slate-900">Admin</span>
                        <span className="block text-xs text-slate-500">Quản trị hệ thống</span>
                    </span>
                </button>
            </div>
        </header>
    )
}