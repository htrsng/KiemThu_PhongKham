import { NavLink, useLocation, type NavLinkRenderProps } from 'react-router-dom'
import { HeartPulse, LogOut, ChevronRight } from 'lucide-react'
import { navigationItems } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '../lib/formatters'

export function Sidebar() {
    const { currentUser, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const allowedNavItems = navigationItems.filter(
        item => currentUser?.role && item.allowedRoles.includes(currentUser.role)
    )

    const groupedItems = allowedNavItems.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = []
        acc[item.group].push(item)
        return acc
    }, {} as Record<string, typeof allowedNavItems>)

    const groupOrder = ['Chung', 'Lâm sàng', 'Hành chính', 'Hệ thống']

    return (
        <aside className="flex h-full w-64 flex-col bg-white border-r border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">

            {/* ── Logo / Brand ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25">
                    <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-500 dark:text-blue-400">SmileCare</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Nha Khoa</p>
                </div>
            </div>

            {/* ── Navigation ─────────────────────────────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Primary navigation">
                {groupOrder.map((group) => {
                    const items = groupedItems[group]
                    if (!items || items.length === 0) return null

                    return (
                        <div key={group}>
                            {/* Group header */}
                            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-600">
                                {group}
                            </p>

                            {/* Nav items */}
                            <div className="space-y-0.5">
                                {items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = location.pathname === item.path

                                    return (
                                        <NavLink
                                            key={item.id}
                                            to={item.path}
                                            end={item.path === '/'}
                                            data-testid={item.testId}
                                            className={({ isActive }: NavLinkRenderProps) =>
                                                [
                                                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150',
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200',
                                                ].join(' ')
                                            }
                                        >
                                            {/* Active left bar */}
                                            {isActive && (
                                                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-blue-600 dark:bg-blue-400" />
                                            )}

                                            {/* Icon */}
                                            <span className={[
                                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150',
                                                isActive
                                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-300',
                                            ].join(' ')}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </span>

                                            {/* Label */}
                                            <span className={[
                                                'flex-1 text-sm transition-all duration-150',
                                                isActive ? 'font-semibold' : 'font-medium',
                                            ].join(' ')}>
                                                {item.label}
                                            </span>

                                            {/* Hover chevron */}
                                            <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-30 group-hover:translate-x-0" />
                                        </NavLink>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </nav>

            {/* ── User Info / Logout ─────────────────────────────────────────── */}
            {currentUser && (
                <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                        {/* Avatar */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                            {getInitials(currentUser.fullName)}
                        </div>
                        {/* User info */}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                                {currentUser.fullName}
                            </p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{currentUser.role}</p>
                        </div>
                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            title="Đăng xuất"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </aside>
    )
}