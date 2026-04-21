import { LayoutDashboard, ShieldCheck, Stethoscope, Settings2, ClipboardList, Users } from 'lucide-react'

export type NavigationItem = {
    id: string
    label: string
    path: string
    icon: typeof LayoutDashboard
    description: string
    testId: string
}

export const navigationItems: NavigationItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        description: 'Tổng quan hoạt động',
        testId: 'nav-dashboard',
    },
    {
        id: 'accounts',
        label: 'Quản lý tài khoản',
        path: '/accounts',
        icon: Users,
        description: 'Tài khoản và trạng thái',
        testId: 'nav-accounts',
    },
    {
        id: 'doctors',
        label: 'Quản lý bác sĩ',
        path: '/doctors',
        icon: Stethoscope,
        description: 'Hồ sơ chuyên môn',
        testId: 'nav-doctors',
    },
    {
        id: 'services',
        label: 'Danh mục dịch vụ',
        path: '/services',
        icon: ClipboardList,
        description: 'Giá và lịch sử',
        testId: 'nav-services',
    },
    {
        id: 'permissions',
        label: 'Phân quyền',
        path: '/permissions',
        icon: ShieldCheck,
        description: 'Ma trận quyền truy cập',
        testId: 'nav-permissions',
    },
    {
        id: 'settings',
        label: 'Cấu hình',
        path: '/settings',
        icon: Settings2,
        description: 'Thông tin và giờ làm việc',
        testId: 'nav-settings',
    },
]

export const routeTitleMap = navigationItems.reduce<Record<string, string>>((accumulator, item) => {
    accumulator[item.path] = item.label
    return accumulator
}, {})