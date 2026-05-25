import { NavLink, useLocation, type NavLinkRenderProps } from 'react-router-dom'
import { ChevronRight, HeartPulse } from 'lucide-react'
import { navigationItems } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'

export function Sidebar() {
    const { currentUser } = useAuth()
    const location = useLocation()

    const allowedNavItems = navigationItems.filter(item => currentUser?.role && item.allowedRoles.includes(currentUser.role));

    // Group items
    const groupedItems = allowedNavItems.reduce((acc, item) => {
        if (!acc[item.group]) {
            acc[item.group] = []
        }
        acc[item.group].push(item)
        return acc
    }, {} as Record<string, typeof allowedNavItems>)

    const groupOrder = ['Chung', 'Lâm sàng', 'Hành chính', 'Hệ thống']

    return (
        <aside className="flex h-full w-72 flex-col border-r border-slate-200/80 bg-white/90 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl overflow-y-auto dark:border-slate-800/80 dark:bg-slate-900/90">
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-900 to-slate-700 text-white shadow-lg shadow-blue-950/20 dark:from-blue-600 dark:to-blue-900 dark:shadow-blue-900/40">
                    <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">SmileCare</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Nha Khoa</p>
                </div>
            </div>

            <nav className="flex-1 space-y-6" aria-label="Primary navigation">
                {groupOrder.map((group) => {
                    const items = groupedItems[group]
                    if (!items || items.length === 0) return null

                    return (
                        <div key={group}>
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {group}
                            </h3>
                            <div className="space-y-1">
                                {items.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <NavLink
                                            key={item.id}
                                            to={item.path}
                                            end={item.path === '/'}
                                            data-testid={item.testId}
                                            className={({ isActive }: NavLinkRenderProps) => {
                                                return [
                                                    'group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 border-l-4',
                                                    isActive
                                                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
                                                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200',
                                                ].join(' ')
                                            }}
                                        >
                                            <span className={['flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105', item.path === location.pathname ? 'bg-blue-600 text-white' : 'bg-white ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'].join(' ')}>
                                                <Icon className="h-4 w-4" />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-medium">{item.label}</span>
                                            </span>

                                            <ChevronRight className="h-4 w-4 opacity-0 transition-all duration-200 group-hover:opacity-50 group-hover:translate-x-0.5" />
                                        </NavLink>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </nav>
        </aside>
    )
}