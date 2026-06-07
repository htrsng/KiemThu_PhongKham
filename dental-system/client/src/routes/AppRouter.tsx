import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AccountManagementPage } from '../pages/AccountManagementPage'
import { DashboardPage } from '../pages/DashboardPage'
import { AppointmentManagementPage } from '../pages/AppointmentManagementPage'
import { PatientManagementPage } from '../pages/PatientManagementPage'
import { ScheduleManagementPage } from '../pages/ScheduleManagementPage'
import { DoctorManagementPage } from '../pages/DoctorManagementPage'
import { DoctorPayrollPage } from '../pages/DoctorPayrollPage'
import { ShiftCoefficientPage } from '../pages/ShiftCoefficientPage'
import { GeneralSettingsPage } from '../pages/GeneralSettingsPage'
import { PayrollSettingsPage } from '../pages/PayrollSettingsPage'
import { PermissionManagementPage } from '../pages/PermissionManagementPage'
import { ServiceCategoryPage } from '../pages/ServiceCategoryPage'
import { LoginPage } from '../pages/LoginPage'
import { ProtectedRoute } from './ProtectedRoute'
import { DoctorExaminationPage } from '../pages/DoctorExaminationPage'
import { PaymentManagementPage } from '../pages/PaymentManagementPage'
import { RevenueStatisticsPage } from '../pages/RevenueStatisticsPage'
import { ReceptionPage } from '../pages/ReceptionPage'

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/login' element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route index element={<DashboardPage />} />
                    <Route path='accounts' element={<AccountManagementPage />} />
                    <Route path='appointments' element={<AppointmentManagementPage />} />
                    <Route path='patients' element={<PatientManagementPage />} />
                    <Route path='schedule' element={<ScheduleManagementPage />} />
                    <Route path='doctors' element={<DoctorManagementPage />} />
                    <Route path='payroll' element={<DoctorPayrollPage />} />
                    <Route path='payroll/coefficients' element={<ShiftCoefficientPage />} />
                    <Route path='services' element={<ServiceCategoryPage />} />
                    <Route path='permissions' element={<PermissionManagementPage />} />
                    <Route path='settings' element={<GeneralSettingsPage />} />
                    <Route path='payroll-settings' element={<PayrollSettingsPage />} />
                    <Route path='examination' element={<DoctorExaminationPage />} />
                    <Route path='payment' element={<PaymentManagementPage />} />
                    <Route path='revenue' element={<RevenueStatisticsPage />} />
                    <Route path='reception' element={<ReceptionPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}