import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Banknote, Percent, Settings2 } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { useAuth } from '../contexts/AuthContext'
import { EmptyState } from '../components/EmptyState'
import { api, type ApiListResponse, type ApiItemResponse } from '../lib/api'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'

type PayrollConfigForm = {
    baseHourlyRate: number
    shiftMultipliers: {
        morning: number
        afternoon: number
        evening: number
        weekend: number
        holiday: number
    }
    defaultConsultationFee: number
}

type Setting<T> = { id: string; settingCode: string; value: T }

export function PayrollSettingsPage() {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<PayrollConfigForm | null>(null)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const { currentUser } = useAuth()

    const { data: settings = [], isLoading } = useQuery<Setting<any>[], Error>({
        queryKey: ['settings'],
        queryFn: async () => (await api.get<ApiListResponse<Setting<any>>>('/settings')).data.data,
    });

    const { mutate: saveSetting, isPending: isSaving } = useMutation<Setting<any>, Error, { id: string; value: any }>({
        mutationFn: async ({ id, value }) => (await api.put<ApiItemResponse<Setting<any>>>(`/settings/${id}`, { value })).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setSuccessMessage('Đã lưu cấu hình lương thưởng thành công.');
            setErrorMessage('');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (err) => {
            setErrorMessage(`Lỗi khi lưu cài đặt: ${err.message}`);
            setSuccessMessage('');
        }
    });

    useEffect(() => {
        if (settings.length > 0) {
            const payrollSetting = settings.find(s => s.settingCode === 'payroll.config')?.value;
            if (payrollSetting) {
                setForm(payrollSetting);
            }
        }
    }, [settings]);

    function handleSave() {
        if (!form) return;
        if (form.baseHourlyRate < 0 || form.defaultConsultationFee < 0) {
            setErrorMessage('Giá trị tiền mặt không được âm.');
            return;
        }
        const setting = settings.find(s => s.settingCode === 'payroll.config');
        if (setting) {
            saveSetting({ id: setting.id, value: form });
        }
    }

    if (currentUser?.role !== 'Admin') {
        return <EmptyState title="Bạn không có quyền truy cập mục này." description="Chỉ quản trị viên mới có thể cấu hình thông số lương." />
    }

    return (
        <section data-testid="page-payroll-settings" className="space-y-6">
            <PageShell
                title="Cấu hình hệ số lương và thưởng"
                description="Quản lý lương cơ sở, hệ số ca trực, và giá khám cơ bản làm căn cứ tính lương bác sĩ."
                testId="page-payroll-settings"
            />

            {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                </div>
            )}

            {isLoading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <TableLoadingSkeleton rows={5} />
                </div>
            ) : form ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Fees */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <Banknote className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-slate-800">Thông số tiền mặt</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Lương cơ bản theo giờ (VNĐ/h)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={form.baseHourlyRate}
                                    onChange={(e) => setForm(f => f ? { ...f, baseHourlyRate: Number(e.target.value) } : null)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring focus:border-blue-500"
                                />
                                <p className="text-xs text-slate-500 font-normal">Sẽ áp dụng cho bác sĩ chưa được cài mức lương giờ riêng.</p>
                            </label>

                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Phí khám bệnh cơ sở (VNĐ)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={form.defaultConsultationFee}
                                    onChange={(e) => setForm(f => f ? { ...f, defaultConsultationFee: Number(e.target.value) } : null)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring focus:border-blue-500"
                                />
                                <p className="text-xs text-slate-500 font-normal">Phi khám mỗi bệnh nhân mặc định (nếu chưa cài riêng).</p>
                            </label>
                        </div>
                    </div>

                    {/* Shift Multipliers */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <Percent className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-semibold text-slate-800">Hệ số ca trực</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Sáng (Morning)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={form.shiftMultipliers.morning}
                                    onChange={(e) => setForm(f => f ? { ...f, shiftMultipliers: { ...f.shiftMultipliers, morning: Number(e.target.value) } } : null)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>

                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Chiều (Afternoon)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={form.shiftMultipliers.afternoon}
                                    onChange={(e) => setForm(f => f ? { ...f, shiftMultipliers: { ...f.shiftMultipliers, afternoon: Number(e.target.value) } } : null)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>

                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Tối (Evening)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={form.shiftMultipliers.evening}
                                    onChange={(e) => setForm(f => f ? { ...f, shiftMultipliers: { ...f.shiftMultipliers, evening: Number(e.target.value) } } : null)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>

                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Cuối tuần (Weekend)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={form.shiftMultipliers.weekend}
                                    onChange={(e) => setForm(f => f ? { ...f, shiftMultipliers: { ...f.shiftMultipliers, weekend: Number(e.target.value) } } : null)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>

                            <label className="col-span-2 block space-y-2 text-sm font-medium text-slate-700">
                                <span>Lễ / Tết (Holiday)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={form.shiftMultipliers.holiday}
                                    onChange={(e) => setForm(f => f ? { ...f, shiftMultipliers: { ...f.shiftMultipliers, holiday: Number(e.target.value) } } : null)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-11 flex items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Settings2 className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    )
}