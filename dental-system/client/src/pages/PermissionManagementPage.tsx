import { useState } from 'react'
import { PageShell } from '../components/PageShell'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext' // Import useAuth
import { EmptyState } from '../components/EmptyState'

type PermissionMatrix = {
    [role: string]: {
        [module: string]: {
            [action: string]: boolean
        }
    }
}

const MODULES = [
    'Dashboard',
    'Tài khoản',
    'Bác sĩ',
    'Dịch vụ',
    'Lịch hẹn',
    'Phân quyền',
    'Cấu hình',
    'Báo cáo',
]

const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Export']

const DEFAULT_PERMISSIONS: PermissionMatrix = {
    Admin: {
        Dashboard: { View: true, Create: true, Edit: true, Delete: true, Export: true },
        'Tài khoản': { View: true, Create: true, Edit: true, Delete: true, Export: true },
        'Bác sĩ': { View: true, Create: true, Edit: true, Delete: true, Export: true },
        'Dịch vụ': { View: true, Create: true, Edit: true, Delete: true, Export: true },
        'Lịch hẹn': { View: true, Create: true, Edit: true, Delete: true, Export: true },
        'Phân quyền': { View: true, Create: true, Edit: true, Delete: true, Export: true },
        'Cấu hình': { View: true, Create: true, Edit: true, Delete: true, Export: true },
        'Báo cáo': { View: true, Create: true, Edit: true, Delete: true, Export: true },
    },
    Doctor: {
        Dashboard: { View: true, Create: false, Edit: false, Delete: false, Export: false },
        'Tài khoản': { View: false, Create: false, Edit: false, Delete: false, Export: false },
        'Bác sĩ': { View: true, Create: false, Edit: false, Delete: false, Export: false },
        'Dịch vụ': { View: true, Create: false, Edit: false, Delete: false, Export: false },
        'Lịch hẹn': { View: true, Create: true, Edit: true, Delete: false, Export: false },
        'Phân quyền': { View: false, Create: false, Edit: false, Delete: false, Export: false },
        'Cấu hình': { View: false, Create: false, Edit: false, Delete: false, Export: false },
        'Báo cáo': { View: true, Create: false, Edit: false, Delete: false, Export: true },
    },
    Reception: {
        Dashboard: { View: true, Create: false, Edit: false, Delete: false, Export: false },
        'Tài khoản': { View: true, Create: true, Edit: false, Delete: false, Export: false },
        'Bác sĩ': { View: true, Create: false, Edit: false, Delete: false, Export: false },
        'Dịch vụ': { View: true, Create: false, Edit: false, Delete: false, Export: false },
        'Lịch hẹn': { View: true, Create: true, Edit: true, Delete: false, Export: false },
        'Phân quyền': { View: false, Create: false, Edit: false, Delete: false, Export: false },
        'Cấu hình': { View: false, Create: false, Edit: false, Delete: false, Export: false },
        'Báo cáo': { View: true, Create: false, Edit: false, Delete: false, Export: true },
    },
}

export function PermissionManagementPage() {
    const [permissions, setPermissions] = useState<PermissionMatrix>(DEFAULT_PERMISSIONS)
    const [activeRole, setActiveRole] = useState<'Admin' | 'Doctor' | 'Reception'>('Admin')
    const { currentUser } = useAuth() // Get current user
    const { addToast } = useToast()

    if (currentUser?.role === 'Doctor' || currentUser?.role === 'Reception') {
        return <EmptyState title="Bạn không có quyền truy cập mục này." description="Chỉ quản trị viên mới có thể quản lý phân quyền." />
    }

    const togglePermission = (module: string, action: string) => {
        setPermissions((prev) => ({
            ...prev,
            [activeRole]: {
                ...prev[activeRole],
                [module]: {
                    ...prev[activeRole][module],
                    [action]: !prev[activeRole][module][action],
                },
            },
        }))
    }

    const handleSaveConfig = () => {
        addToast('success', 'Cập nhật cấu hình quyền hạn thành công')
    }

    const handleReset = () => {
        setPermissions(DEFAULT_PERMISSIONS)
        addToast('info', 'Đã reset về cấu hình mặc định')
    }

    const grantAllPermissions = () => {
        const newPerms = { ...permissions[activeRole] }
        Object.keys(newPerms).forEach((module) => {
            Object.keys(newPerms[module]).forEach((action) => {
                newPerms[module][action] = true
            })
        })
        setPermissions((prev) => ({
            ...prev,
            [activeRole]: newPerms,
        }))
    }

    const revokeAllPermissions = () => {
        const newPerms = { ...permissions[activeRole] }
        Object.keys(newPerms).forEach((module) => {
            Object.keys(newPerms[module]).forEach((action) => {
                newPerms[module][action] = false
            })
        })
        setPermissions((prev) => ({
            ...prev,
            [activeRole]: newPerms,
        }))
    }

    return (
        <section className="space-y-6">
            <PageShell
                title="Phân quyền"
                description="Quản lý quyền hạn cho từng vai trò người dùng. Cấu hình quyền truy cập module, tạo, sửa, xóa và xuất dữ liệu."
                testId="page-permissions"
            />

            {/* Role Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                {['Admin', 'Doctor', 'Reception'].map((role) => (
                    <button
                        key={role}
                        onClick={() => setActiveRole(role as typeof activeRole)}
                        className={`px-4 py-3 text-sm font-medium transition ${
                            activeRole === role
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {role}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-600">
                    Quản lý quyền hạn cho vai trò: <span className="font-semibold text-slate-900">{activeRole}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={grantAllPermissions}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cấp tất cả
                    </button>
                    <button
                        onClick={revokeAllPermissions}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Thu hồi tất cả
                    </button>
                </div>
            </div>

            {/* Permission Matrix */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="sticky left-0 z-10 bg-slate-50 px-4 py-4 font-semibold text-slate-700">Module</th>
                            {ACTIONS.map((action) => (
                                <th key={action} className="px-4 py-4 text-center font-semibold text-slate-700 whitespace-nowrap">
                                    {action}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {MODULES.map((module) => (
                            <tr key={module} className="hover:bg-slate-50">
                                <td className="sticky left-0 z-10 bg-white px-4 py-4 font-medium text-slate-900 hover:bg-slate-50">
                                    {module}
                                </td>
                                {ACTIONS.map((action) => (
                                    <td key={action} className="px-4 py-4 text-center">
                                        <label className="flex items-center justify-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={permissions[activeRole][module][action] || false}
                                                onChange={() => togglePermission(module, action)}
                                                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </label>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                    <span className="font-semibold">Tổng quyền:</span> {' '}
                    {Object.values(permissions[activeRole])
                        .flatMap((module) => Object.values(module))
                        .filter(Boolean).length}{' '}
                    / {MODULES.length * ACTIONS.length}
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={handleReset}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Reset
                </button>
                <button
                    onClick={handleSaveConfig}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Lưu cấu hình
                </button>
            </div>
        </section>
    )
}