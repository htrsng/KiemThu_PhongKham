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
    CalendarDays,
    UserRound,
} from 'lucide-react'

export type NavigationItem = {
    id: string
    label: string
    path: string
    icon: typeof LayoutDashboard
    description: string
    testId: string
    group: 'Chung' | 'Lâm sàng' | 'Hành chính' | 'Hệ thống'
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
        group: 'Chung',
        allowedRoles: ['Admin', 'Doctor', 'Reception'],
    },
    {
        id: 'appointments',
        label: 'Quản lý Lịch hẹn',
        path: '/appointments',
        icon: Calendar,
        description: 'Lịch hẹn đặt trước',
        testId: 'nav-appointments', 
        group: 'Lâm sàng',
        allowedRoles: ['Admin', 'Doctor', 'Reception'],
    },
    {
        id: 'patients',
        label: 'Quản lý Bệnh nhân',
        path: '/patients',
        icon: UserRound,
        description: 'Hồ sơ bệnh án và lịch sử khám',
        testId: 'nav-patients', 
        group: 'Lâm sàng',
        allowedRoles: ['Admin', 'Reception', 'Doctor'],
    },
    {
        id: 'schedule',
        label: 'Quản lý Lịch trực',
        path: '/schedule',
        icon: CalendarDays,
        description: 'Ca làm việc và ngày nghỉ',
        testId: 'nav-schedule', 
        group: 'Hành chính',
        allowedRoles: ['Admin', 'Reception', 'Doctor'],
    },
    {
        id: 'doctors',
        label: 'Quản lý bác sĩ',
        path: '/doctors',
        icon: Stethoscope,
        description: 'Hồ sơ chuyên môn',
        testId: 'nav-doctors', 
        group: 'Hệ thống',
        allowedRoles: ['Admin', 'Doctor', 'Reception'],
    },
    {
        id: 'services',
        label: 'Danh mục dịch vụ',
        path: '/services',
        icon: ClipboardList,
        description: 'Giá và lịch sử',
        testId: 'nav-services',
        group: 'Hệ thống',
        allowedRoles: ['Admin', 'Reception'],
    },
    {
        id: 'payment',
        label: 'Thanh toán',
        path: '/payment',
        icon: CreditCard,
        description: 'Quản lý hóa đơn & thanh toán',
        testId: 'nav-payment',
        group: 'Hành chính',
        allowedRoles: ['Admin', 'Reception'],
    },
    {
        id: 'revenue',
        label: 'Thống kê doanh thu',
        path: '/revenue',
        icon: BarChart3,
        description: 'Báo cáo doanh thu & Chốt ca',
        testId: 'nav-revenue',
        group: 'Hành chính',
        allowedRoles: ['Admin', 'Reception'],
    },
    {
        id: 'payroll',
        label: 'Bảng lương',
        path: '/payroll',
        icon: Banknote,
        description: 'Tính lương bác sĩ',
        testId: 'nav-payroll',
        group: 'Hành chính',
        allowedRoles: ['Admin', 'Doctor'],
    },
    {
        id: 'accounts',
        label: 'Quản lý tài khoản',
        path: '/accounts',
        icon: Users,
        description: 'Tài khoản và trạng thái',
        testId: 'nav-accounts',
        group: 'Hệ thống',
        allowedRoles: ['Admin'], 
    },
    {
        id: 'permissions',
        label: 'Phân quyền',
        path: '/permissions',
        icon: ShieldCheck,
        description: 'Ma trận quyền truy cập',
        testId: 'nav-permissions',
        group: 'Hệ thống',
        allowedRoles: ['Admin'],
    },
    {
        id: 'settings',
        label: 'Cấu hình',
        path: '/settings',
        icon: Settings2,
        description: 'Thông tin và giờ làm việc',
        testId: 'nav-settings',
        group: 'Hệ thống',
        allowedRoles: ['Admin'],
    },
]

export const routeTitleMap = navigationItems.reduce<Record<string, string>>((accumulator, item) => {
    accumulator[item.path] = item.label
    return accumulator
}, {})