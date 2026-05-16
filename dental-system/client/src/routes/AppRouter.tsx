import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { AccountManagementPage } from '../pages/AccountManagementPage'
import { DashboardPage } from '../pages/DashboardPage'
import { AppointmentManagementPage } from '../pages/AppointmentManagementPage'
import { DoctorManagementPage } from '../pages/DoctorManagementPage'
import { DoctorPayrollPage } from '../pages/DoctorPayrollPage'
import { GeneralSettingsPage } from '../pages/GeneralSettingsPage'
import { PermissionManagementPage } from '../pages/PermissionManagementPage'
import { ServiceCategoryPage } from '../pages/ServiceCategoryPage'

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="accounts" element={<AccountManagementPage />} />
                    <Route path="appointments" element={<AppointmentManagementPage />} />
                    <Route path="doctors" element={<DoctorManagementPage />} />
                    <Route path="payroll" element={<DoctorPayrollPage />} />
                    <Route path="services" element={<ServiceCategoryPage />} />
                    <Route path="permissions" element={<PermissionManagementPage />} />
                    <Route path="settings" element={<GeneralSettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}