import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '../components/PageShell'
import { calculateDoctorSalary, type SalaryReport } from '../lib/payrollEngine';
import { formatVND } from '../lib/formatters'
import { Banknote, Search, Download } from 'lucide-react'
import { TableLoadingSkeleton } from '../components/LoadingSkeleton'
import { useToast } from '../contexts/ToastContext'
import { PayrollDetailModal } from '../components/PayrollDetailModal';
import { useData, type Doctor, type Shift, type Appointment } from '../contexts/DataContext';
import { api, type ApiListResponse } from '../lib/api';

export function DoctorPayrollPage() {
    // Lấy dữ liệu bác sĩ từ server
    const { data: doctors = [], isLoading: doctorsIsLoading } = useQuery<Doctor[], Error>({ queryKey: ['doctors'], queryFn: async () => (await api.get<ApiListResponse<Doctor>>('/doctors')).data.data });
    // Lấy dữ liệu ca trực từ server
    const { data: shifts = [], isLoading: shiftsIsLoading } = useQuery<Shift[], Error>({
        queryKey: ['doctorShifts'],
        queryFn: async () => (await api.get<ApiListResponse<Shift>>('/shifts')).data.data,
    });
    // Lấy dữ liệu lịch hẹn từ server
    const { data: appointments = [], isLoading: appointmentsIsLoading } = useQuery<Appointment[], Error>({
        queryKey: ['appointments'],
        queryFn: async () => (await api.get<ApiListResponse<Appointment>>('/appointments')).data.data,
    });
    // Lấy dữ liệu mock cho các phần còn lại
    const { services, isLoading: mockDataIsLoading } = useData();
    
    const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1)
    const [targetYear, setTargetYear] = useState(new Date().getFullYear())
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedReport, setSelectedReport] = useState<SalaryReport | null>(null);

    useToast()

    const isLoading = doctorsIsLoading || shiftsIsLoading || appointmentsIsLoading || mockDataIsLoading;

    const payrollData = useMemo(() => {
        let data = doctors
            .filter(d => d.status === 'active')
            .map(doc => calculateDoctorSalary(doc, targetMonth, targetYear, shifts, appointments, services))
            
        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            data = data.filter(d => d.doctorName.toLowerCase().includes(lower))
        }
        
        return data.sort((a, b) => b.totalSalary - a.totalSalary)
    }, [doctors, shifts, appointments, services, targetMonth, targetYear, searchTerm])

    const totalPayout = payrollData.reduce((sum, d) => sum + d.totalSalary, 0)

    return (
        <section className="space-y-6">
            <PageShell
                title="Bảng lương Bác sĩ"
                description="Quản lý chi tiết thu nhập bác sĩ dựa trên giờ trực, phí khám và hoa hồng dịch vụ."
                testId="page-payroll"
            />

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Banknote className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Tổng quỹ lương tháng {targetMonth}</p>
                            <p className="text-2xl font-bold text-slate-900">{formatVND(totalPayout)}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center flex flex-col justify-center">
                    <p className="text-sm font-medium text-slate-500">Số lượng bác sĩ tính lương</p>
                    <p className="text-2xl font-bold text-slate-900">{payrollData.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center flex flex-col justify-center">
                    <p className="text-sm font-medium text-slate-500">Trạng thái kỳ lương</p>
                    <span className="mx-auto mt-1 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Đang tính toán</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
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
                                <th className="px-6 py-4 font-bold text-slate-700 text-center">Giờ trực</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Lương ca trực</th>
                                <th className="px-6 py-4 font-bold text-slate-700 text-center">Ca khám</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Hoa hồng (Khám + DV)</th>
                                <th className="px-6 py-4 font-bold text-slate-700 text-right">Tổng nhận</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-6">
                                        <TableLoadingSkeleton rows={5} />
                                    </td>
                                </tr>
                            ) : payrollData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        Không có dữ liệu lương cho kỳ này.
                                    </td>
                                </tr>
                            ) : (
                                payrollData.map((row) => (
                                    <tr 
                                        key={row.doctorId} 
                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedReport(row)}>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{row.doctorName}</p>
                                            <p className="text-xs text-slate-500">{row.specialty}</p>
                                        </td>
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
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-base font-bold text-blue-600">{formatVND(row.totalSalary)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PayrollDetailModal 
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                report={selectedReport}
                services={services}
                targetMonth={targetMonth}
                targetYear={targetYear}
            />
        </section>
    )
}