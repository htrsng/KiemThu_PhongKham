import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { Sidebar } from '../components/Sidebar'

export function AppShell() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto flex min-h-screen max-w-[1920px]">
                <div className="hidden lg:block">
                    <Sidebar />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <AppHeader />

                    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
                        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6 lg:p-8">
                            <div className="mb-6 lg:hidden">
                                <Sidebar />
                            </div>

                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}