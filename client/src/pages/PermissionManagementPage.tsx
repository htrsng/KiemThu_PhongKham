import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '../components/PageShell'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext' // Import useAuth
import { EmptyState } from '../components/EmptyState'
import { api, type ApiListResponse } from '../lib/api'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'



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
            const res = await api.get<ApiListResponse<{ id: string, role: string, permissions: PermissionMatrix }>>(`/role_permissions?role=${activeRole}`);
            return res.data.data[0]?.permissions || {};
        },
        placeholderData: (prev) => prev,
    });

    // Update local state when fetched data changes
    useEffect(() => {
        if (rolePermissionsData) {
            setPermissions(rolePermissionsData);
        }
    }, [rolePermissionsData]);

    // Mutation to save permissions
    const { mutate: savePermissions, isPending: isSaving } = useMutation<any, Error, PermissionMatrix>({
        mutationFn: async (updatedPermissions: PermissionMatrix) => {
            // Lấy id của role_permission hiện tại để PUT
            const res = await api.get<ApiListResponse<{ id: string, role: string, permissions: PermissionMatrix }>>(`/role_permissions?role=${activeRole}`);
            const rolePermId = res.data.data[0]?.id;
            if (rolePermId) {
                return api.put(`/role_permissions/${rolePermId}`, { permissions: updatedPermissions });
            } else {
                return api.post(`/role_permissions`, { role: activeRole, permissions: updatedPermissions });
            }
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
                <div className="rounded-2xl border border-slate-200 bg-white p-6"><TableLoadingSkeleton rows={MODULES.length} /></div>
            ) : isError ? (
                <EmptyState title="Lỗi tải dữ liệu" description="Không thể tải cấu hình quyền. Vui lòng thử lại." />
            ) : permissions && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MODULES.map((module) => (
                            <div key={module} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col hover:border-blue-200 transition">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">{module}</h3>
                                <div className="space-y-3 flex-1">
                                    {ACTIONS.map((action) => {
                                        const hasPermission = permissions[module]?.[action] || false;
                                        return (
                                            <div 
                                                key={action} 
                                                onClick={() => togglePermission(module, action)}
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                                                    hasPermission 
                                                    ? 'bg-blue-50/70 border border-blue-100' 
                                                    : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                                                }`}
                                            >
                                                <span className={`text-sm font-medium ${hasPermission ? 'text-blue-800' : 'text-slate-600'}`}>
                                                    {action}
                                                </span>
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                                                    hasPermission ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'
                                                }`}>
                                                    {hasPermission ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex justify-between items-center mt-6">
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