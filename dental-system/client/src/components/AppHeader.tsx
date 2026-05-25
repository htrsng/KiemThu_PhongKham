import { Bell, ChevronRight, LogOut, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { routeTitleMap } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'
import { getInitials } from '../lib/formatters'

function getBreadcrumbItems(pathname: string) {
    if (pathname === '/') {
        return ['Dashboard']
    }
    return ['Dashboard', routeTitleMap[pathname] ?? 'Unknown']
}

export function AppHeader() {
    const { pathname } = useLocation()
    const breadcrumbItems = getBreadcrumbItems(pathname)
    const { currentUser, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Dark Mode Toggle
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    if (!currentUser) return null

    return (
        <header className="flex items-center justify-between gap-6 border-b border-slate-200/80 bg-white/85 px-6 py-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/85">
            <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {breadcrumbItems.map((item, index) => (
                        <span key={item} className="flex items-center gap-2">
                            <span className={index === breadcrumbItems.length - 1 ? 'text-slate-900 dark:text-slate-100' : ''}>{item}</span>
                            {index < breadcrumbItems.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                        </span>
                    ))}
                </div>
                <h1 className="mt-1 truncate text-xl font-semibold text-slate-900 dark:text-white">{breadcrumbItems[breadcrumbItems.length - 1]}</h1>
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label="Toggle Dark Mode"
                >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                <button
                    type="button"
                    data-testid="btn-notifications"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
                </button>

                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>

                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {getInitials(currentUser.fullName)}
                    </div>
                    <div className="hidden flex-col md:flex">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{currentUser.fullName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                    title="Đăng xuất"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Đăng xuất</span>
                </button>
            </div>
        </header>
    )
}