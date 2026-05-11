import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { motion, AnimatePresence } from 'framer-motion'

import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AccountManagementPage } from './pages/AccountManagementPage'
import { DoctorManagementPage } from './pages/DoctorManagementPage'
import { AppointmentManagementPage } from './pages/AppointmentManagementPage'
import { ServiceCategoryPage } from './pages/ServiceCategoryPage'
import { PermissionManagementPage } from './pages/PermissionManagementPage'
import { GeneralSettingsPage } from './pages/GeneralSettingsPage'

import { navigationItems } from './config/navigation'
import { Stethoscope, LogOut } from 'lucide-react'

// Cấu trúc Giao diện chính (Sidebar + Nội dung)
function MainLayout() {
    const { currentUser, logout } = useAuth()
    const location = useLocation()

    if (!currentUser) {
        // Should not happen if PrivateRoute is working, but as a safeguard
        return <Navigate to="/login" replace />
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar Menu */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 flex items-center gap-3 font-bold text-xl text-blue-900 border-b border-slate-200">
                    <Stethoscope className="h-8 w-8 text-blue-600" />
                    SmileCare
                </div>
                
                <nav className="flex-1 p-4 space-y-1">
                    {navigationItems
                        .filter(item => item.allowedRoles.includes(currentUser.role))
                        .map(item => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                    isActive 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Thông tin User & Nút Đăng xuất */}
                {currentUser && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                            <p className="text-xs text-slate-500">{currentUser.role}</p>
                        </div>
                        <button 
                            onClick={logout}
                            title="Đăng xuất"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition shrink-0"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </aside>
            
            {/* Vùng hiển thị nội dung trang */}
            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 p-8 overflow-y-auto h-screen"
                >
                    <Outlet />
                </motion.main>
            </AnimatePresence>
        </div>
    )
}

// Chặn truy cập nếu chưa đăng nhập
function PrivateRoute() {
    const { isAuthenticated } = useAuth()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    return <MainLayout />
}

// Chặn truy cập dựa trên vai trò
function RoleBasedRoute({ allowedRoles }: { allowedRoles: ('Admin' | 'Doctor' | 'Reception')[] }) {
    const { currentUser } = useAuth()

    if (!currentUser) {
        return <Navigate to="/login" replace />
    }

    if (!allowedRoles.includes(currentUser.role)) {
        // Người dùng không có quyền, chuyển hướng về trang chủ
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <ConfirmProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            
                            {/* Nhóm các Route cần bảo vệ */}
                            <Route element={<PrivateRoute />}>
                                <Route path="/" element={<DashboardPage />} /> {/* Dành cho tất cả mọi người */}
                                
                                {/* Admin-only routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['Admin']} />}>
                                    <Route path="/accounts" element={<AccountManagementPage />} />
                                    <Route path="/permissions" element={<PermissionManagementPage />} />
                                    <Route path="/settings" element={<GeneralSettingsPage />} />
                                </Route>

                                <Route path="/doctors" element={<DoctorManagementPage />} />
                                <Route path="/appointments" element={<AppointmentManagementPage />} />
                                <Route path="/services" element={<ServiceCategoryPage />} />
                            </Route>
                        </Routes>
                    </ConfirmProvider>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}