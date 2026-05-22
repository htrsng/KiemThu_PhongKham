import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '../components/PageShell'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext' // Import useAuth
import { EmptyState } from '../components/EmptyState'
import { api, type ApiItemResponse } from '../lib/api'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'

type RolePermissionMatrix = {
    [role: string]: {
        [module: string]: {
            [action: string]: boolean
        }
    }
}

type PermissionMatrix = {
    [module: string]: {
        [action: string]: boolean
        // Thêm các action khác nếu cần
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

export function PermissionManagementPage() {
    const [permissions, setPermissions] = useState<PermissionMatrix | null>(null)
    const [activeRole, setActiveRole] = useState<'Admin' | 'Doctor' | 'Reception'>('Admin')
    const { currentUser } = useAuth() // Get current user
    const { addToast } = useToast()
    const queryClient = useQueryClient()

    // Fetch permissions for the active role
    const { data: rolePermissionsData, isLoading, isError } = useQuery({
        queryKey: ['permissions', activeRole],
        queryFn: async (): Promise<PermissionMatrix> => {
            const res = await api.get<ApiItemResponse<{ role: string, permissions: PermissionMatrix }>>(`/permissions/roles/${activeRole}`);
            return res.data.data.permissions;
        },
        keepPreviousData: true,
    });

    // Update local state when fetched data changes
    useEffect(() => {
        if (rolePermissionsData) {
            setPermissions(rolePermissionsData);
        }
    }, [rolePermissionsData]);

    // Mutation to save permissions
    const { mutate: savePermissions, isLoading: isSaving } = useMutation<any, Error, PermissionMatrix>({
        mutationFn: (updatedPermissions: PermissionMatrix) => {
            return api.put(`/permissions/roles/${activeRole}`, { permissions: updatedPermissions });
        },
        onSuccess: () => {
            addToast('success', 'Cập nhật cấu hình quyền hạn thành công');
            queryClient.invalidateQueries({ queryKey: ['permissions', activeRole] });
        },
        onError: (error: any) => {
            addToast('error', `Lỗi khi lưu: ${error.response?.data?.error || error.message}`);
        }
    });

    if (currentUser?.role === 'Doctor' || currentUser?.role === 'Reception') {
        return <EmptyState title="Bạn không có quyền truy cập mục này." description="Chỉ quản trị viên mới có thể quản lý phân quyền." />
    }

    const togglePermission = (module: string, action: string) => {
        if (!permissions) return;
        setPermissions((prev) => ({
            ...prev,
            [module]: {
                ...prev![module],
                [action]: !prev![module][action],
            },
        }))
    }

    const handleSaveConfig = () => {
        if (permissions) {
            savePermissions(permissions);
        }
    }

    const handleReset = () => {
        if (rolePermissionsData) { // Reset về trạng thái ban đầu khi fetch từ server
            setPermissions(rolePermissionsData);
            addToast('info', 'Đã hoàn tác các thay đổi chưa lưu.');
        }
    }

    const grantAllPermissions = () => {
        if (!permissions) return;
        const newPerms: PermissionMatrix = {};
        MODULES.forEach(module => { newPerms[module] = {}; ACTIONS.forEach(action => { newPerms[module][action] = true; }); });
        setPermissions(newPerms);
    }

    const revokeAllPermissions = () => {
        if (!permissions) return;
        const newPerms: PermissionMatrix = {};
        MODULES.forEach(module => { newPerms[module] = {}; ACTIONS.forEach(action => { newPerms[module][action] = false; }); });
        setPermissions(newPerms);
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
            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6"><TableLoadingSkeleton rows={MODULES.length} cols={ACTIONS.length + 1} /></div>
            ) : isError ? (
                <EmptyState title="Lỗi tải dữ liệu" description="Không thể tải cấu hình quyền. Vui lòng thử lại." />
            ) : permissions && (
                <>
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
                                                        checked={permissions[module]?.[action] || false}
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
                            <span className="font-semibold">Tổng quyền:</span>{' '}
                            {Object.values(permissions)
                                .flatMap((module) => Object.values(module))
                                .filter(Boolean).length}{' '}
                            / {MODULES.length * ACTIONS.length}
                        </p>
                    </div>
                </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={handleReset}
                    disabled={isSaving}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    Reset
                </button>
                <button
                    onClick={handleSaveConfig}
                    disabled={isSaving || isLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
            </div>
        </section>
    )
}