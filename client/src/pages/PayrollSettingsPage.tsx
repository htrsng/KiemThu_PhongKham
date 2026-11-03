import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Banknote, Percent, Settings2, History, Calendar, Plus } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { useAuth } from '../contexts/AuthContext'
import { EmptyState } from '../components/EmptyState'
import { api, type ApiListResponse, type ApiItemResponse } from '../lib/api'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { formatDateTime, formatVND } from '../lib/formatters'

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
    effectiveDate?: string
    reason?: string
}

export function PayrollSettingsPage() {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<PayrollConfigForm>({
        baseHourlyRate: 100000,
        shiftMultipliers: { morning: 1, afternoon: 1, evening: 1.3, weekend: 1.5, holiday: 2 },
        defaultConsultationFee: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
        reason: ''
    })
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
    const { currentUser } = useAuth()

    const { data: historyList = [], isLoading } = useQuery<any[], Error>({
        queryKey: ['payroll-config-history'],
        queryFn: async () => (await api.get<{success: boolean, data: any[]}>('/payroll/config-history')).data.data,
    });

    const { mutate: saveConfig, isPending: isSaving } = useMutation<any, Error, PayrollConfigForm>({
        mutationFn: async (payload) => (await api.post<{success: boolean, data: any}>('/payroll/config-history', payload)).data.data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-config-history'] });
            setSuccessMessage('Đã thêm cấu hình lương thưởng thành công.');
            setErrorMessage('');
            setTimeout(() => setSuccessMessage(''), 3000);
            setActiveTab('history');
        },
        onError: (err: any) => {
            setErrorMessage(`Lỗi khi lưu cài đặt: ${err.response?.data?.error || err.message}`);
            setSuccessMessage('');
        }
    });

    useEffect(() => {
        if (historyList.length > 0 && activeTab === 'current') {
            // Load latest effective config
            const now = new Date();
            const activeConfig = historyList.find(c => new Date(c.effectiveDate) <= now) || historyList[0];
            
            // Set form to active config, but effectiveDate to today for new creation
            setForm({
                baseHourlyRate: activeConfig.baseHourlyRate,
                shiftMultipliers: activeConfig.shiftMultipliers,
                defaultConsultationFee: activeConfig.defaultConsultationFee,
                effectiveDate: new Date().toISOString().split('T')[0],
                reason: ''
            });
        }
    }, [historyList, activeTab]);

    function handleSave() {
        if (!form) return;
        if (form.baseHourlyRate < 0 || form.defaultConsultationFee < 0) {
            setErrorMessage('Giá trị tiền mặt không được âm.');
            return;
        }
        if (!form.effectiveDate) {
            setErrorMessage('Vui lòng chọn ngày hiệu lực.');
            return;
        }
        const effectiveDateObj = new Date(form.effectiveDate);
        // Warning if effectiveDate is in the past
        const today = new Date();
        today.setHours(0,0,0,0);
        if (effectiveDateObj < today) {
            if (!window.confirm('Ngày hiệu lực nằm trong quá khứ. Điều này có thể ảnh hưởng đến các ca làm việc cũ chưa chốt lương. Bạn có chắc chắn muốn tiếp tục?')) {
                return;
            }
        }

        saveConfig(form);
    }

    if (currentUser?.role !== 'Admin') {
        return <EmptyState title="Bạn không có quyền truy cập mục này." description="Chỉ quản trị viên mới có thể cấu hình thông số lương." />
    }

    return (
        <section data-testid="page-payroll-settings" className="space-y-6">
            <PageShell
                title="Cấu hình hệ số lương và thưởng (UC 4.1, 4.2)"
                description="Quản lý mức tiền cơ bản, hệ số ca trực và xem lịch sử áp dụng."
                testId="page-payroll-settings"
            />

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'current' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Tạo Cấu Hình Mới
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <History className="h-4 w-4" /> Lịch sử thay đổi
                </button>
            </div>

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
            ) : activeTab === 'current' ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Fees */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <Banknote className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-slate-800">Thông số tiền mặt (UC 4.1)</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Lương cơ bản theo giờ (VNĐ/h)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={form.baseHourlyRate}
                                    onChange={(e) => setForm(f => ({ ...f, baseHourlyRate: Number(e.target.value) }))}
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
                                    onChange={(e) => setForm(f => ({ ...f, defaultConsultationFee: Number(e.target.value) }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring focus:border-blue-500"
                                />
                                <p className="text-xs text-slate-500 font-normal">Phí khám mỗi bệnh nhân mặc định (nếu chưa cài riêng).</p>
                            </label>
                        </div>
                    </div>

                    {/* Shift Multipliers */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <Percent className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-semibold text-slate-800">Hệ số ca trực (UC 4.2)</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Sáng (Hành chính)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={form.shiftMultipliers.morning}
                                    onChange={(e) => setForm(f => ({ ...f, shiftMultipliers: { ...f.shiftMultipliers, morning: Number(e.target.value) } }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>

                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Chiều (Hành chính)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={form.shiftMultipliers.afternoon}
                                    onChange={(e) => setForm(f => ({ ...f, shiftMultipliers: { ...f.shiftMultipliers, afternoon: Number(e.target.value) } }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>

                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Tối (Evening)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    max="1.5"
                                    value={form.shiftMultipliers.evening}
                                    onChange={(e) => setForm(f => ({ ...f, shiftMultipliers: { ...f.shiftMultipliers, evening: Number(e.target.value) } }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>

                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Cuối tuần (Weekend)</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    max="1.5"
                                    value={form.shiftMultipliers.weekend}
                                    onChange={(e) => setForm(f => ({ ...f, shiftMultipliers: { ...f.shiftMultipliers, weekend: Number(e.target.value) } }))}
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
                                    onChange={(e) => setForm(f => ({ ...f, shiftMultipliers: { ...f.shiftMultipliers, holiday: Number(e.target.value) } }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-emerald-200 transition focus:ring focus:border-emerald-500"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <Calendar className="h-5 w-5 text-amber-600" />
                            <h3 className="text-lg font-semibold text-slate-800">Hiệu lực áp dụng</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Ngày hiệu lực *</span>
                                <input
                                    type="date"
                                    value={form.effectiveDate}
                                    onChange={(e) => setForm(f => ({ ...f, effectiveDate: e.target.value }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-amber-200 transition focus:ring focus:border-amber-500"
                                />
                                <p className="text-xs text-slate-500 font-normal">Cấu hình này sẽ được dùng để tính lương cho các ca trực từ ngày này trở đi.</p>
                            </label>
                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Lý do thay đổi (Tùy chọn)</span>
                                <input
                                    type="text"
                                    value={form.reason}
                                    onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                                    placeholder="Vd: Tăng lương cơ bản năm 2026"
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-amber-200 transition focus:ring focus:border-amber-500"
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
                            <Plus className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Thêm Cấu Hình Mới'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                                <th className="px-6 py-4 font-bold text-slate-700">Ngày hiệu lực</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Lương cơ bản</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Hệ số ca</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Lý do</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Ngày cập nhật</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {historyList.map((item: any) => {
                                const isFuture = new Date(item.effectiveDate) > new Date();
                                const isCurrent = !isFuture && historyList.find((c: any) => new Date(c.effectiveDate) <= new Date())?.id === item.id;
                                
                                return (
                                    <tr key={item._id || item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{formatDateTime(item.effectiveDate).split(' ')[0]}</p>
                                            {isCurrent && <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">Đang áp dụng</span>}
                                            {isFuture && <span className="inline-block mt-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">Sắp áp dụng</span>}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {formatVND(item.baseHourlyRate)}/h
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600">
                                            Sáng: {item.shiftMultipliers?.morning} | Tối: {item.shiftMultipliers?.evening} | CT: {item.shiftMultipliers?.weekend}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {item.reason || <span className="text-slate-400 italic">Không có lý do</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {formatDateTime(item.createdAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {historyList.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-500">
                                        Chưa có lịch sử cấu hình.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}