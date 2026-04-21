import type { NavLinkRenderProps } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { ChevronRight, HeartPulse } from 'lucide-react'
import { navigationItems } from '../config/navigation'

export function Sidebar() {
    return (
        <aside className="flex h-full w-80 flex-col border-r border-slate-200/80 bg-white/90 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-900 to-slate-700 text-white shadow-lg shadow-blue-950/20">
                    <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">SmileCare</p>
                    <p className="text-sm font-semibold text-slate-900">Dental Clinic Management</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2" aria-label="Primary navigation">
                {navigationItems.map((item) => {
                    const Icon = item.icon

                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            end={item.path === '/'}
                            data-testid={item.testId}
                            className={({ isActive }: NavLinkRenderProps) => {
                                return [
                                    'group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200',
                                    isActive
                                        ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                                ].join(' ')
                            }}
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15 transition-transform duration-200 group-hover:scale-[1.03]">
                                <Icon className="h-4 w-4" />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold">{item.label}</span>
                                <span className="block text-xs text-slate-500">{item.description}</span>
                            </span>

                            <ChevronRight className="h-4 w-4 opacity-50 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </NavLink>
                    )
                })}
            </nav>

            <div className="mt-6 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 p-4 text-white shadow-lg shadow-slate-950/20">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">System Status</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                    Frontend shell đã sẵn sàng cho các module quản trị phòng khám.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Mock data enabled
                </div>
            </div>
        </aside>
    )
}