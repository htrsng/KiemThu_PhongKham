import {
    LayoutDashboard,
    ShieldCheck,
    Stethoscope,
    Settings2,
    ClipboardList,
    Users,
    Calendar,
    Banknote,
    CreditCard,
    BarChart3,
} from 'lucide-react'

export type NavigationItem = {
    id: string
    label: string
    path: string
    icon: typeof LayoutDashboard
    description: string
    testId: string
    allowedRoles: ('Admin' | 'Doctor' | 'Reception')[]
}

export const navigationItems: NavigationItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        description: 'Tổng quan hoạt động',
        testId: 'nav-dashboard',
        allowedRoles: ['Admin', 'Doctor', 'Reception'],
    },
    {
        id: 'accounts',
        label: 'Quản lý tài khoản',
        path: '/accounts',
        icon: Users,
        description: 'Tài khoản và trạng thái',
        testId: 'nav-accounts',
        allowedRoles: ['Admin'], // Chỉ Admin có thể quản lý tài khoản
    },
    {
        id: 'doctors',
        label: 'Quản lý bác sĩ',
        path: '/doctors',
        icon: Stethoscope,
        description: 'Hồ sơ chuyên môn',
        testId: 'nav-doctors', // Admin quản lý tất cả, Bác sĩ xem/sửa hồ sơ của mình
        allowedRoles: ['Admin', 'Doctor', 'Reception'],
    },
    {
        id: 'appointments',
        label: 'Quản lý Lịch hẹn',
        path: '/appointments',
        icon: Calendar,
        description: 'Lịch hẹn và lịch làm việc',
        testId: 'nav-appointments', // Admin/Lễ tân quản lý tất cả, Bác sĩ quản lý lịch của mình
        allowedRoles: ['Admin', 'Doctor', 'Reception'],
    },
    {
        id: 'services',
        label: 'Danh mục dịch vụ',
        path: '/services',
        icon: ClipboardList,
        description: 'Giá và lịch sử',
        testId: 'nav-services',
        allowedRoles: ['Admin', 'Reception'],
    },
    {
        id: 'payment',
        label: 'Thanh toán',
        path: '/payment',
        icon: CreditCard,
        description: 'Quản lý hóa đơn & thanh toán',
        testId: 'nav-payment',
        allowedRoles: ['Admin', 'Reception'],
    },
    {
        id: 'payroll',
        label: 'Bảng lương',
        path: '/payroll',
        icon: Banknote,
        description: 'Tính lương bác sĩ',
        testId: 'nav-payroll',
        allowedRoles: ['Admin', 'Doctor'],
    },
    {
        id: 'permissions',
        label: 'Phân quyền',
        path: '/permissions',
        icon: ShieldCheck,
        description: 'Ma trận quyền truy cập',
        testId: 'nav-permissions',
        allowedRoles: ['Admin'],
    },
    {
        id: 'revenue',
        label: 'Thống kê doanh thu',
        path: '/revenue',
        icon: BarChart3,
        description: 'Báo cáo doanh thu & Chốt ca',
        testId: 'nav-revenue',
        allowedRoles: ['Admin', 'Reception'],
    },
    {
        id: 'settings',
        label: 'Cấu hình',
        path: '/settings',
        icon: Settings2,
        description: 'Thông tin và giờ làm việc',
        testId: 'nav-settings',
        allowedRoles: ['Admin'],
    },
]

export const routeTitleMap = navigationItems.reduce<Record<string, string>>((accumulator, item) => {
    accumulator[item.path] = item.label
    return accumulator
}, {})