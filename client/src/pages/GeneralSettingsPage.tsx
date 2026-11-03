import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Clock3 } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { useAuth } from '../contexts/AuthContext' // Import useAuth
import { EmptyState } from '../components/EmptyState'
import { api, type ApiListResponse, type ApiItemResponse } from '../lib/api'
import type { AuditLog } from '../lib/types'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'

type SettingsTab = 'clinic-info' | 'business-hours'

type ClinicInfoForm = {
    clinicName: string
    hotline: string
    address: string
    email: string
    currency: string
}

type BusinessHoursForm = {
    weekdays: string
    saturday: string
    sunday: string
}

type Setting<T> = { id: string; settingCode: string; value: T }

export function GeneralSettingsPage() {
    const queryClient = useQueryClient()
    // State
    const [activeTab, setActiveTab] = useState<SettingsTab>('clinic-info')
    const [clinicInfoForm, setClinicInfoForm] = useState<ClinicInfoForm | null>(null)
    const [businessHoursForm, setBusinessHoursForm] = useState<BusinessHoursForm | null>(null)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const { currentUser } = useAuth() // Get current user

    // --- Data Fetching ---
    const { data: settings = [], isLoading: settingsLoading } = useQuery<Setting<any>[], Error>({
        queryKey: ['settings'],
        queryFn: async () => (await api.get<ApiListResponse<Setting<any>>>('/settings')).data.data,
    });

    const { data: recentActivities = [], isLoading: activitiesLoading } = useQuery<AuditLog[], Error>({
        queryKey: ['audit-logs'],
        queryFn: async () => (await api.get<ApiListResponse<AuditLog>>('/audit-logs?limit=5&sort=-updatedAt')).data.data,
    });

    const { mutate: saveSetting } = useMutation<Setting<any>, Error, { id: string; value: any }>({
        mutationFn: async ({ id, value }) => (await api.put<ApiItemResponse<Setting<any>>>(`/settings/${id}`, { value })).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setSuccessMessage('Đã lưu cài đặt thành công.');
            setErrorMessage('');
        },
        onError: (err) => {
            setErrorMessage(`Lỗi khi lưu cài đặt: ${err.message}`);
            setSuccessMessage('');
        }
    });

    useEffect(() => {
        if (settings.length > 0) {
            setClinicInfoForm(settings.find(s => s.settingCode === 'clinic.profile')?.value ?? null);
            setBusinessHoursForm(settings.find(s => s.settingCode === 'clinic.hours')?.value ?? null);
        }
    }, [settings]);

    // Validation
    function validateClinicInfo(form: ClinicInfoForm) {
        if (!form.clinicName.trim()) return 'Tên phòng khám không được để trống.'
        if (!form.hotline.trim()) return 'Hotline không được để trống.'
        if (!form.address.trim()) return 'Địa chỉ không được để trống.'
        if (!form.email.trim() || !form.email.includes('@')) return 'Email không hợp lệ.'
        if (!form.currency.trim()) return 'Vui lòng nhập loại tiền tệ.'
        return ''
    }
    function validateBusinessHours(form: BusinessHoursForm) {
        if (!form.weekdays.trim()) return 'Vui lòng nhập giờ làm việc ngày thường.'
        if (!form.saturday.trim()) return 'Vui lòng nhập giờ làm việc thứ 7.'
        if (!form.sunday.trim()) return 'Vui lòng nhập giờ làm việc Chủ nhật.'
        return ''
    }

    function handleSaveClinicInfo() {
        if (!clinicInfoForm) return;
        const err = validateClinicInfo(clinicInfoForm)
        if (err) {
            setErrorMessage(err)
            setSuccessMessage('')
            return
        }
        const setting = settings.find(s => s.settingCode === 'clinic.profile');
        if (setting) {
            saveSetting({ id: setting.id, value: clinicInfoForm });
        }
    }
    function handleSaveBusinessHours() {
        if (!businessHoursForm) return;
        const err = validateBusinessHours(businessHoursForm)
        if (err) {
            setErrorMessage(err)
            setSuccessMessage('')
            return
        }
        const setting = settings.find(s => s.settingCode === 'clinic.hours');
        if (setting) {
            saveSetting({ id: setting.id, value: businessHoursForm });
        }
    }

    if (currentUser?.role === 'Doctor' || currentUser?.role === 'Reception') {
        return <EmptyState title="Bạn không có quyền truy cập mục này." description="Chỉ quản trị viên mới có thể cấu hình hệ thống." />
    }

    return (
        <section data-testid="page-settings" className="space-y-6">
            <PageShell
                title="Cấu hình hệ thống"
                description="Cấu hình thông tin phòng khám và giờ làm việc."
                testId="page-settings"
            />

            {errorMessage ? (
                <div data-testid="settings-error" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            {successMessage ? (
                <div data-testid="settings-success" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                </div>
            ) : null}

            <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" data-testid="settings-tab-list">
                <button
                    type="button"
                    data-testid="settings-tab-clinic-info"
                    onClick={() => setActiveTab('clinic-info')}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${activeTab === 'clinic-info' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Building2 className="h-4 w-4" />
                    Thông tin phòng khám
                </button>
                <button
                    type="button"
                    data-testid="settings-tab-business-hours"
                    onClick={() => setActiveTab('business-hours')}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${activeTab === 'business-hours' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Clock3 className="h-4 w-4" />
                    Giờ làm việc
                </button>
            </div>

            {settingsLoading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <TableLoadingSkeleton rows={5} />
                </div>
            ) : activeTab === 'clinic-info' && clinicInfoForm ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Tên phòng khám</span>
                            <input
                                data-testid="settings-clinic-name"
                                value={clinicInfoForm.clinicName || ''}
                                onChange={(event) => setClinicInfoForm((prev) => prev ? { ...prev, clinicName: event.target.value } : null)}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Hotline</span>
                            <input
                                data-testid="settings-hotline"
                                value={clinicInfoForm.hotline || ''}
                                onChange={(event) => setClinicInfoForm((prev) => prev ? { ...prev, hotline: event.target.value } : null)}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                            <span>Địa chỉ</span>
                            <input
                                data-testid="settings-address"
                                value={clinicInfoForm.address || ''}
                                onChange={(event) => setClinicInfoForm((prev) => prev ? { ...prev, address: event.target.value } : null)}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Email</span>
                            <input
                                data-testid="settings-email"
                                value={clinicInfoForm.email || ''}
                                onChange={(event) => setClinicInfoForm((prev) => prev ? { ...prev, email: event.target.value } : null)}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Tiền tệ</span>
                            <input
                                data-testid="settings-currency"
                                value={clinicInfoForm.currency || ''}
                                onChange={(event) => setClinicInfoForm((prev) => prev ? { ...prev, currency: event.target.value } : null)}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            data-testid="settings-save-clinic-info"
                            onClick={handleSaveClinicInfo}
                            className="h-11 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
                        >
                            Lưu thông tin
                        </button>
                    </div>
                </div>
            ) : null}
            
            {activeTab === 'business-hours' && businessHoursForm ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Ngày thường</span>
                            <input
                                data-testid="settings-weekdays"
                                value={businessHoursForm.weekdays || ''}
                                onChange={(event) => setBusinessHoursForm((prev) => prev ? { ...prev, weekdays: event.target.value } : null)}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                placeholder="08:00-20:00"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Thứ 7</span>
                            <input
                                data-testid="settings-saturday"
                                value={businessHoursForm.saturday || ''}
                                onChange={(event) => setBusinessHoursForm((prev) => prev ? { ...prev, saturday: event.target.value } : null)}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                placeholder="08:00-17:00"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Chủ nhật</span>
                            <input
                                data-testid="settings-sunday"
                                value={businessHoursForm.sunday || ''}
                                onChange={(event) => setBusinessHoursForm((prev) => prev ? { ...prev, sunday: event.target.value } : null)}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                placeholder="08:00-12:00"
                            />
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            data-testid="settings-save-business-hours"
                            onClick={handleSaveBusinessHours}
                            className="h-11 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
                        >
                            Lưu giờ làm việc
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="mt-10">
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Hoạt động gần đây</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-[400px] w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Thời gian</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Loại</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Mô tả</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Người thực hiện</th>
                            </tr>
                        </thead>
                        {activitiesLoading ? (
                            <tbody><tr><td colSpan={4} className="p-4"><TableLoadingSkeleton rows={3} /></td></tr></tbody>
                        ) : (
                            <tbody>
                                {recentActivities.map((act) => (
                                    <tr key={act.id}>
                                        <td className="px-4 py-2 whitespace-nowrap">{new Date(act.timestamp).toLocaleString('vi-VN')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{act.action}</td>
                                        <td className="px-4 py-2">{act.action} bởi {act.account}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{act.account}</td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </section>
    )
}
