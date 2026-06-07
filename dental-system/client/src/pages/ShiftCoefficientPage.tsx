import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageShell } from '../components/PageShell';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Save, ChevronDown, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

type AppointmentInfo = {
    id: string;
    patientName: string;
    serviceName: string;
    difficulty: number;
};

type ShiftCoefficient = {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    doctorId: string;
    doctorName: string;
    patientCoefficient: number;
    calculatedCoefficient: number;
    appointments: AppointmentInfo[];
};

export function ShiftCoefficientPage() {
    const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
    const [targetYear, setTargetYear] = useState(new Date().getFullYear());
    const [expandedShifts, setExpandedShifts] = useState<string[]>([]);
    
    // For editing shift coefficient (Option B)
    const [editingShifts, setEditingShifts] = useState<Record<string, number>>({});
    // For editing appointment difficulty (Option A)
    const [editingAppointments, setEditingAppointments] = useState<Record<string, number>>({});

    const { addToast } = useToast();

    const { data: shifts = [], isLoading, refetch } = useQuery<ShiftCoefficient[], Error>({
        queryKey: ['shifts-coefficients', targetMonth, targetYear],
        queryFn: async () => {
            const res = await api.get<{success: boolean, data: ShiftCoefficient[]}>(`/payroll/shifts/coefficients?month=${targetMonth}&year=${targetYear}`);
            return res.data.data;
        }
    });

    const updateShiftMutation = useMutation({
        mutationFn: async (params: { id: string, patientCoefficient: number }) => {
            await api.put(`/payroll/shifts/${params.id}/coefficient`, { patientCoefficient: params.patientCoefficient });
        },
        onSuccess: () => {
            addToast('success', 'Lưu hệ số ca trực thành công');
            refetch();
        },
        onError: (err: any) => {
            addToast('error', err.response?.data?.error || 'Lỗi khi lưu');
        }
    });

    const updateAppointmentsMutation = useMutation({
        mutationFn: async (params: { shiftId: string, appointments: { id: string, difficulty: number }[] }) => {
            await api.put(`/payroll/shifts/${params.shiftId}/appointments-difficulty`, { appointments: params.appointments });
        },
        onSuccess: () => {
            addToast('success', 'Lưu hệ số bệnh nhân thành công');
            refetch();
        },
        onError: (err: any) => {
            addToast('error', err.response?.data?.error || 'Lỗi khi lưu');
        }
    });

    const toggleExpand = (id: string) => {
        setExpandedShifts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleShiftCoefficientChange = (id: string, value: string) => {
        const val = parseFloat(value);
        setEditingShifts(prev => ({ ...prev, [id]: isNaN(val) ? 0 : val }));
    };

    const saveShiftCoefficient = (shift: ShiftCoefficient) => {
        const val = editingShifts[shift.id] !== undefined ? editingShifts[shift.id] : shift.patientCoefficient;
        updateShiftMutation.mutate({ id: shift.id, patientCoefficient: val });
    };

    const handleAppointmentDifficultyChange = (aptId: string, value: string) => {
        const val = parseFloat(value);
        if (val > 0.5) {
            addToast('warning', 'Hệ số bệnh nhân không được vượt quá 0.5');
            return;
        }
        setEditingAppointments(prev => ({ ...prev, [aptId]: isNaN(val) ? 0 : val }));
    };

    const saveAppointmentsDifficulty = (shift: ShiftCoefficient) => {
        const appointmentsToSave = shift.appointments.map(apt => ({
            id: apt.id,
            difficulty: editingAppointments[apt.id] !== undefined ? editingAppointments[apt.id] : apt.difficulty
        }));
        updateAppointmentsMutation.mutate({ shiftId: shift.id, appointments: appointmentsToSave });
    };

    return (
        <section className="space-y-6">
            <PageShell
                title="Nhập Hệ Số Bệnh Nhân Phức Tạp"
                description="Ghi nhận hệ số độ khó cho từng ca làm việc hoặc từng bệnh nhân (UC 4.3)"
                testId="page-shift-coefficients"
            />

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold">Tháng:</label>
                        <select 
                            value={targetMonth} 
                            onChange={e => setTargetMonth(Number(e.target.value))}
                            className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold">Năm:</label>
                        <select 
                            value={targetYear} 
                            onChange={e => setTargetYear(Number(e.target.value))}
                            className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button 
                    onClick={() => refetch()}
                    className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                    <RefreshCw className="h-4 w-4" /> Làm mới
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                            <th className="px-6 py-4 font-bold text-slate-700 w-12"></th>
                            <th className="px-6 py-4 font-bold text-slate-700">Ngày / Giờ</th>
                            <th className="px-6 py-4 font-bold text-slate-700">Bác sĩ</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-center">Số BN</th>
                            <th className="px-6 py-4 font-bold text-slate-700">Tổng Hệ Số (Cho Ca)</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-slate-500">Đang tải dữ liệu...</td>
                            </tr>
                        ) : shifts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-500">
                                    Không có dữ liệu ca trực.
                                </td>
                            </tr>
                        ) : (
                            shifts.map(shift => {
                                const isExpanded = expandedShifts.includes(shift.id);
                                const currentShiftCoef = editingShifts[shift.id] !== undefined ? editingShifts[shift.id] : shift.patientCoefficient;
                                
                                return (
                                    <React.Fragment key={shift.id}>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => toggleExpand(shift.id)} className="text-slate-400 hover:text-slate-700">
                                                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {shift.date} <br/>
                                                <span className="text-xs text-slate-500 font-normal">{shift.startTime} - {shift.endTime}</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                {shift.doctorName}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-bold text-blue-700">
                                                    {shift.appointments.length}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="number" 
                                                    step="0.1" 
                                                    min="0"
                                                    value={currentShiftCoef}
                                                    onChange={e => handleShiftCoefficientChange(shift.id, e.target.value)}
                                                    className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => saveShiftCoefficient(shift)}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
                                                >
                                                    <Save className="h-3.5 w-3.5" /> Lưu Ca
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={6} className="px-12 py-6 border-b border-slate-200">
                                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                                        <h4 className="font-bold text-slate-700 mb-3 text-sm">Chi tiết bệnh nhân trong ca</h4>
                                                        {shift.appointments.length === 0 ? (
                                                            <p className="text-xs text-slate-500 italic">Không có bệnh nhân khám trong ca này.</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
                                                                    <div className="col-span-4">Bệnh nhân</div>
                                                                    <div className="col-span-4">Dịch vụ</div>
                                                                    <div className="col-span-4">Hệ số độ khó (Tối đa 0.5)</div>
                                                                </div>
                                                                {shift.appointments.map(apt => {
                                                                    const currentAptCoef = editingAppointments[apt.id] !== undefined ? editingAppointments[apt.id] : apt.difficulty;
                                                                    return (
                                                                        <div key={apt.id} className="grid grid-cols-12 gap-4 items-center">
                                                                            <div className="col-span-4 font-medium text-slate-800">{apt.patientName}</div>
                                                                            <div className="col-span-4 text-slate-600 text-xs">{apt.serviceName}</div>
                                                                            <div className="col-span-4">
                                                                                <input 
                                                                                    type="number" 
                                                                                    step="0.1" 
                                                                                    min="0"
                                                                                    max="0.5"
                                                                                    value={currentAptCoef}
                                                                                    onChange={e => handleAppointmentDifficultyChange(apt.id, e.target.value)}
                                                                                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                                                    <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
                                                                        <AlertCircle className="h-4 w-4" />
                                                                        Lưu ý: Lưu từng BN sẽ tự động cộng tổng lên cho Ca.
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => saveAppointmentsDifficulty(shift)}
                                                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                                                                    >
                                                                        <Save className="h-3.5 w-3.5" /> Lưu BN
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
