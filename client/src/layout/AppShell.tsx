import { AppHeader } from '../components/AppHeader'
import { Sidebar } from '../components/Sidebar'
import { Outlet } from 'react-router-dom'

export function AppShell() {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                <AppHeader />
                <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
            </div>
        </div>
    )
}