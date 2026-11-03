import { useState } from 'react'
import { X } from 'lucide-react'
import { formatVND, formatDateTime } from '../lib/formatters'
import type { SalaryReport } from '../pages/DoctorPayrollPage'
import { api } from '../lib/api'
import { useToast } from '../contexts/ToastContext'

interface PayrollDetailModalProps {
    isOpen?: boolean // Optional since we render it conditionally anyway
    onClose: () => void
    report: SalaryReport | null
    month: number
    year: number
    onRefresh: () => void
}

export function PayrollDetailModal({ isOpen = true, onClose, report, month, year, onRefresh }: PayrollDetailModalProps) {
    const { addToast } = useToast();

    const handleLock = async () => {
        if (!window.confirm('Sau khi chốt, không thể chỉnh sửa. Xác nhận?')) return;
        
        try {
            const payload = {
                doctorId: report?.doctorId,
                month,
                year,
                totalSalary: report?.totalSalary,
                totalHours: report?.totalHours,
                hourlyRateUsed: report?.hourlyRateUsed || 0,
                details: report?.detailedShifts
            };
            await api.post('/payroll/save', payload);
            addToast('success', 'Chốt phiếu lương thành công');
            onRefresh();
            onClose();
        } catch (e: any) {
            addToast('error', e.response?.data?.error || 'Lỗi khi chốt phiếu lương');
        }
    };

    if (!isOpen || !report) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                            Chi tiết lương: {report.doctorName}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Tháng {month}/{year} {report.isLocked && <span className="ml-2 font-bold text-emerald-600">(Đã chốt)</span>}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-xl bg-blue-50 p-4">
                            <p className="text-sm font-medium text-blue-800">Lương ca trực</p>
                            <p className="text-lg font-bold text-blue-900">{formatVND(report.shiftSalary)}</p>
                        </div>
                        <div className="rounded-xl bg-green-50 p-4">
                            <p className="text-sm font-medium text-green-800">Tổng hoa hồng (Khám + DV)</p>
                            <p className="text-lg font-bold text-green-900">{formatVND(report.consultationBonus + report.serviceBonus)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-800 text-white p-4">
                            <p className="text-sm font-medium text-slate-300">Tổng nhận</p>
                            <p className="text-lg font-bold">{formatVND(report.totalSalary)}</p>
                        </div>
                    </div>

                    {/* Shift Salary Details */}
                    <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Chi tiết ca trực</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-600">
                                        <th className="py-2 text-left">Ngày</th>
                                        <th className="py-2 text-left">Ca</th>
                                        <th className="py-2 text-right">Khoảng thời gian</th>
                                        <th className="py-2 text-right">Lương ca</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.detailedShifts && report.detailedShifts.map((shift: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="py-2">{formatDateTime(shift.date).split(' ')[0]}</td>
                                            <td className="py-2">{shift.shiftName}</td>
                                            <td className="py-2 text-right text-slate-500">{shift.startTime} - {shift.endTime} ({shift.durationHours}h * {shift.multiplier}x)</td>
                                            <td className="py-2 text-right font-medium">{formatVND(shift.shiftPayout)}</td>
                                        </tr>
                                    ))}
                                    {(!report.detailedShifts || report.detailedShifts.length === 0) && (
                                        <tr><td colSpan={4} className="py-4 text-center text-slate-500">Không có dữ liệu ca trực</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Appointment & Services Salary Details */}
                    <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Chi tiết hoa hồng ca khám & dịch vụ</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-600">
                                        <th className="py-2 text-left">Ngày giờ</th>
                                        <th className="py-2 text-left">Bệnh nhân</th>
                                        <th className="py-2 text-center">Độ khó</th>
                                        <th className="py-2 text-right">Phí khám</th>
                                        <th className="py-2 text-right">Hoa hồng DV</th>
                                        <th className="py-2 text-right">Tổng hoa hồng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.detailedAppointments && report.detailedAppointments.map((apt: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="py-2">{formatDateTime(apt.date)}</td>
                                            <td className="py-2">{apt.patientName}</td>
                                            <td className="py-2 text-center">{apt.difficultyMultiplier}x</td>
                                            <td className="py-2 text-right text-slate-500">{formatVND(apt.consultationBonus)}</td>
                                            <td className="py-2 text-right text-slate-500">
                                                {formatVND(apt.serviceBonus)}
                                                <div className="text-[10px] text-slate-400">
                                                    {(apt.services || []).map((s: any) => `${s.name} (${s.commissionRate * 100}%)`).join(', ')}
                                                </div>
                                            </td>
                                            <td className="py-2 text-right font-medium">{formatVND(apt.totalBonus)}</td>
                                        </tr>
                                    ))}
                                    {(!report.detailedAppointments || report.detailedAppointments.length === 0) && (
                                        <tr><td colSpan={6} className="py-4 text-center text-slate-500">Không có dữ liệu ca khám</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition"
                    >
                        Đóng
                    </button>
                    {!report.isLocked ? (
                        <button
                            onClick={handleLock}
                            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
                        >
                            Xác nhận & Chốt phiếu lương
                        </button>
                    ) : (
                        <button
                            onClick={() => window.print()}
                            className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900 transition"
                        >
                            In phiếu lương
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}