import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AccountManagementPage } from '../pages/AccountManagementPage'
import { DashboardPage } from '../pages/DashboardPage'
import { AppointmentManagementPage } from '../pages/AppointmentManagementPage'
import { DoctorManagementPage } from '../pages/DoctorManagementPage'
import { DoctorPayrollPage } from '../pages/DoctorPayrollPage'
import { GeneralSettingsPage } from '../pages/GeneralSettingsPage'
import { PermissionManagementPage } from '../pages/PermissionManagementPage'
import { ServiceCategoryPage } from '../pages/ServiceCategoryPage'
import { LoginPage } from '../pages/LoginPage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Route công khai, không cần đăng nhập */}
                <Route path="/login" element={<LoginPage />} />

                {/* Các route được bảo vệ, yêu cầu đăng nhập */}
                <Route element={<ProtectedRoute />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="accounts" element={<AccountManagementPage />} />
                    <Route path="appointments" element={<AppointmentManagementPage />} />
                    <Route path="doctors" element={<DoctorManagementPage />} />
                    <Route path="payroll" element={<DoctorPayrollPage />} />
                    <Route path="services" element={<ServiceCategoryPage />} />
                    <Route path="permissions" element={<PermissionManagementPage />} />
                    <Route path="settings" element={<GeneralSettingsPage />} />
                </Route>

                {/* Route dự phòng, nếu người dùng truy cập đường dẫn không tồn tại */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    )
}