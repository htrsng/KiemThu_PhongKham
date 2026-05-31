import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '../components/PageShell'
import { formatVND } from '../lib/formatters'
import { Banknote, Search, Download, Calendar } from 'lucide-react'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { useAuth } from '../contexts/AuthContext' 
import { EmptyState } from '../components/EmptyState'
import { useToast } from '../contexts/ToastContext'
import { PayrollDetailModal } from '../components/PayrollDetailModal';
import { api } from '../lib/api';

export type SalaryReport = {
    doctorId: string
    doctorName: string
    specialty: string
    totalHours: number
    shiftSalary: number
    completedAppointments: number
    consultationBonus: number
    serviceBonus: number
    totalSalary: number
    detailedShifts: any[]
    detailedAppointments: any[]
}

export function DoctorPayrollPage() {
    const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1)
    const [targetYear, setTargetYear] = useState(new Date().getFullYear())
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedReport, setSelectedReport] = useState<SalaryReport | null>(null);
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    const { currentUser } = useAuth(); // Get current user
    useToast();

    // Lấy dữ liệu bảng lương tháng từ server
    const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery<SalaryReport[], Error>({ 
        queryKey: ['payroll', 'monthly', targetMonth, targetYear, currentUser?.referenceId], 
        queryFn: async () => {
            const params = new URLSearchParams({ month: targetMonth.toString(), year: targetYear.toString() });
            if (currentUser?.role === 'Doctor' && currentUser.referenceId) {
                params.append('doctorId', currentUser.referenceId);
            }
            return (await api.get<{success: boolean, data: SalaryReport[]}>(`/payroll/monthly?${params.toString()}`)).data.data;
        },
        enabled: viewMode === 'monthly'
    });

    // Lấy dữ liệu bảng lương NĂM từ server
    const { data: yearlyData = [], isLoading: yearlyLoading } = useQuery<any[], Error>({ 
        queryKey: ['payroll', 'yearly', targetYear, currentUser?.referenceId], 
        queryFn: async () => {
            const params = new URLSearchParams({ year: targetYear.toString() });
            if (currentUser?.role === 'Doctor' && currentUser.referenceId) {
                params.append('doctorId', currentUser.referenceId);
            }
            return (await api.get<{success: boolean, data: any[]}>(`/payroll/yearly?${params.toString()}`)).data.data;
        },
        enabled: viewMode === 'yearly'
    });

    const isLoading = viewMode === 'monthly' ? monthlyLoading : yearlyLoading;
    
    // Filter by search term
    const displayedData = useMemo(() => {
        let currentData = viewMode === 'monthly' ? monthlyData : yearlyData;
        if (currentUser?.role !== 'Doctor' && searchTerm) {
            const lower = searchTerm.toLowerCase();
            currentData = currentData.filter((d: any) => d.doctorName.toLowerCase().includes(lower));
        }
        return currentData.sort((a: any, b: any) => b.totalSalary - a.totalSalary);
    }, [monthlyData, yearlyData, searchTerm, currentUser, viewMode]);

    if (currentUser?.role === 'Reception') {
        return <EmptyState title="Bạn không có quyền truy cập mục này." description="Chỉ quản trị viên và bác sĩ mới có thể xem mục này." />
    }

    const totalPayout = displayedData.reduce((sum: number, d: any) => sum + d.totalSalary, 0)

    return (
        <section className="space-y-6">
            <PageShell
                title="Bảng lương Bác sĩ"
                description="Quản lý chi tiết thu nhập bác sĩ dựa trên giờ trực, phí khám và hoa hồng dịch vụ."
                testId="page-payroll"
            />

            <div className="flex gap-2">
                <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                >
                    Báo cáo Tháng
                </button>
                <button
                    onClick={() => setViewMode('yearly')}
                    className={`px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-semibold transition ${viewMode === 'yearly' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                >
                    <Calendar className="w-4 h-4" /> Báo cáo Năm
                </button>
            </div>

            {/* Summary Cards */}
            <div className={`grid gap-4 mt-4 ${currentUser?.role === 'Doctor' ? 'md:grid-cols-1' : 'md:grid-cols-3'}`}>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Banknote className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                {viewMode === 'monthly' ? `Tổng quỹ lương tháng ${targetMonth}` : `Tổng quỹ lương năm ${targetYear}`}
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                                {currentUser?.role === 'Doctor' && displayedData.length > 0 ? formatVND(displayedData[0].totalSalary) : formatVND(totalPayout)}
                            </p>
                        </div>
                    </div>
                </div>
                {currentUser?.role !== 'Doctor' && (
                    <>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center flex flex-col justify-center">
                            <p className="text-sm font-medium text-slate-500">Số lượng bác sĩ</p>
                            <p className="text-2xl font-bold text-slate-900">{displayedData.length}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center flex flex-col justify-center">
                            <p className="text-sm font-medium text-slate-500">Chế độ hiển thị</p>
                            <span className="mx-auto mt-1 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                Dữ liệu Server
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Filters */}
            <div className={`flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center ${currentUser?.role === 'Doctor' ? 'md:justify-end' : 'md:justify-between'}`}>
                <div className="flex flex-wrap items-center gap-3">
                    {viewMode === 'monthly' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold">Tháng:</label>
                            <select 
                                value={targetMonth} 
                                onChange={e => setTargetMonth(Number(e.target.value))}
                                className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold">Năm:</label>
                        <select 
                            value={targetYear} 
                            onChange={e => setTargetYear(Number(e.target.value))}
                            className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    {currentUser?.role !== 'Doctor' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Tìm bác sĩ..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-10 rounded-xl border border-slate-200 pl-10 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48"
                            />
                        </div>
                    )}
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition">
                    <Download className="h-4 w-4" /> Xuất Excel
                </button>
            </div>

            {/* Payroll Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                                <th className="px-6 py-4 font-bold text-slate-700">Bác sĩ</th>
                                {viewMode === 'monthly' ? (
                                    <>
                                        <th className="px-6 py-4 font-bold text-slate-700 text-center">Giờ quy đổi</th>
                                        <th className="px-6 py-4 font-bold text-slate-700">Lương ca trực</th>
                                        <th className="px-6 py-4 font-bold text-slate-700 text-center">Ca khám</th>
                                        <th className="px-6 py-4 font-bold text-slate-700">Hoa hồng (Khám + DV)</th>
                                        <th className="px-6 py-4 font-bold text-slate-700 text-right">Tổng nhận</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4 font-bold text-slate-700 text-right">Tổng nhận cả năm</th>
                                        <th className="px-6 py-4 font-bold text-slate-700 text-right">Trung bình tháng</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-6">
                                        <TableLoadingSkeleton rows={5} />
                                    </td>
                                </tr>
                            ) : displayedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        Không có dữ liệu.
                                    </td>
                                </tr>
                            ) : (
                                displayedData.map((row: any) => (
                                    <tr 
                                        key={row.doctorId} 
                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                                        onClick={() => viewMode === 'monthly' && setSelectedReport(row)}>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{row.doctorName}</p>
                                            <p className="text-xs text-slate-500">{row.specialty}</p>
                                        </td>
                                        {viewMode === 'monthly' ? (
                                            <>
                                                <td className="px-6 py-4 text-center text-slate-600 font-medium">
                                                    {row.totalHours}h
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    {formatVND(row.shiftSalary)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-bold text-blue-700">
                                                        {row.completedAppointments}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    <div className="text-xs">Khám: {formatVND(row.consultationBonus)}</div>
                                                    <div className="text-xs">DV: {formatVND(row.serviceBonus)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-blue-600">
                                                    {formatVND(row.totalSalary)}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td colSpan={4} className="px-6 py-4 text-right font-bold text-emerald-600">
                                                    {formatVND(row.totalSalary)}
                                                </td>
                                                <td colSpan={1} className="px-6 py-4 text-right font-medium text-slate-700">
                                                    {formatVND(Math.round(row.totalSalary / 12))}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedReport && (
                <PayrollDetailModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </section>
    )
}