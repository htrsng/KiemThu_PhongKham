import React, { useMemo } from 'react';
import { X, Download } from 'lucide-react';
import { formatVND } from '../lib/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface YearlyDoctorPayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any; // The report from yearlyData array
    year: number;
}

export function YearlyDoctorPayrollModal({ isOpen, onClose, report, year }: YearlyDoctorPayrollModalProps) {
    if (!isOpen || !report) return null;

    // Use memo to prepare the 12-month data with chart formatting
    const { chartData, tableData, stats } = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        let maxSalary = 0;
        let minSalary = Infinity;
        let maxMonth = null;
        let minMonth = null;
        let totalShifts = 0;
        let monthsWithSlips = 0;

        const tableList = months.map(m => {
            const slip = report.monthlyBreakdown?.find((b: any) => b.month === m);
            if (slip) { // Mọi phiếu lấy từ server đều đã chốt (dựa theo API slipQuery: status = 'Đã chốt')
                monthsWithSlips++;
                totalShifts += slip.shiftCount || 0;
                
                if (slip.totalSalary > maxSalary) {
                    maxSalary = slip.totalSalary;
                    maxMonth = m;
                }
                if (slip.totalSalary < minSalary) {
                    minSalary = slip.totalSalary;
                    minMonth = m;
                }
                
                return {
                    month: m,
                    monthLabel: `Tháng ${m}`,
                    shiftCount: slip.shiftCount || 0,
                    totalHours: slip.totalHours || 0,
                    totalSalary: slip.totalSalary,
                    status: slip.status || 'Đã chốt',
                    hasData: true
                };
            } else {
                return {
                    month: m,
                    monthLabel: `Tháng ${m}`,
                    shiftCount: 0,
                    totalHours: 0,
                    totalSalary: 0,
                    status: 'Chưa lập',
                    hasData: false
                };
            }
        });

        // Stats calculation
        if (minSalary === Infinity) minSalary = 0;
        const avgShifts = monthsWithSlips > 0 ? (totalShifts / monthsWithSlips).toFixed(1) : 0;
        
        const summaryStats = {
            totalYearlySalary: report.totalSalary || 0,
            monthsWithSlips: monthsWithSlips,
            monthsWithoutSlips: 12 - monthsWithSlips,
            maxMonth,
            maxSalary,
            minMonth,
            minSalary,
            avgShifts
        };

        // For chart: Only chart the recorded salary to avoid dropping to 0 for missing months (or chart 0 if preferred by user, but usually missing months are just skipped or 0).
        const chartData = tableList.map(item => ({
            name: `T${item.month}`,
            salary: item.hasData ? item.totalSalary : 0,
            hasData: item.hasData
        }));

        return { chartData, tableData: tableList, stats: summaryStats };
    }, [report]);

    const handleExport = () => {
        if (!tableData || tableData.length === 0) return;

        let csvContent = '\uFEFF'; // BOM for UTF-8 Excel support
        csvContent += `Báo cáo Tiền lương Năm ${year} - Bác sĩ: ${report.doctorName}\n\n`;
        csvContent += `Tháng,Số ca trực,Tổng giờ quy đổi,Tổng tiền lương,Trạng thái\n`;
        
        tableData.forEach(row => {
            const rowStr = [
                `"Tháng ${row.month}"`,
                `"${row.hasData ? row.shiftCount : '-'}"`,
                `"${row.hasData ? row.totalHours : '-'}"`,
                `"${row.hasData ? row.totalSalary : '-'}"`,
                `"${row.hasData ? 'Đã chốt' : 'Chưa lập'}"`
            ].join(',');
            csvContent += rowStr + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `luong_nam_${year}_bs_${report.doctorName.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between border-b pb-4 border-slate-100">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                            Báo cáo Tiền lương Năm {year}
                        </h3>
                        <p className="text-base text-slate-600 mt-1">
                            Bác sĩ: <span className="font-bold text-slate-900">{report.doctorName}</span> ({report.specialty || 'Không rõ'})
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                        >
                            <Download className="h-4 w-4" />
                            Xuất báo cáo
                        </button>
                        <button onClick={onClose} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6 pb-6">
                    
                    {/* Thống kê tóm tắt */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                            <p className="text-sm font-medium text-slate-500">Tổng thu nhập năm</p>
                            <p className="mt-1 text-xl font-bold text-blue-700">{formatVND(stats.totalYearlySalary)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                            <p className="text-sm font-medium text-slate-500">Phiếu lương đã chốt</p>
                            <p className="mt-1 text-xl font-bold text-slate-800">{stats.monthsWithSlips} <span className="text-sm font-normal text-slate-500">/{stats.monthsWithoutSlips > 0 ? ` (Chưa lập: ${stats.monthsWithoutSlips})` : ''}</span></p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                            <p className="text-sm font-medium text-slate-500">Tháng cao nhất</p>
                            <p className="mt-1 text-xl font-bold text-emerald-700">
                                {stats.maxMonth ? `Tháng ${stats.maxMonth}` : '-'}
                            </p>
                            <p className="text-xs text-emerald-600/80">{stats.maxMonth ? formatVND(stats.maxSalary) : ''}</p>
                        </div>
                        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                            <p className="text-sm font-medium text-slate-500">Số ca trực TB/Tháng</p>
                            <p className="mt-1 text-xl font-bold text-rose-700">{stats.avgShifts}</p>
                        </div>
                    </div>

                    {/* Biểu đồ biến động lương */}
                    {stats.monthsWithSlips === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center text-slate-500 font-medium">
                            Chưa có dữ liệu phiếu lương nào được chốt trong năm {year}.
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h4 className="mb-6 text-base font-semibold text-slate-800">Biểu đồ biến động thu nhập</h4>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                        <YAxis 
                                            tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{fill: '#64748b', fontSize: 12}}
                                            dx={-10}
                                        />
                                        <Tooltip 
                                            formatter={(value: number) => formatVND(value)}
                                            labelStyle={{fontWeight: 'bold', color: '#334155'}}
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="salary" 
                                            stroke="#3b82f6" 
                                            strokeWidth={3}
                                            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Bảng lương 12 tháng */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Tháng</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-center">Số ca trực</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-center">Tổng giờ quy đổi</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Tổng tiền lương</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tableData.map((row) => (
                                    <tr key={row.month} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 font-medium text-slate-900">{row.monthLabel}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{row.hasData ? row.shiftCount : '-'}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{row.hasData ? `${row.totalHours}h` : '-'}</td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            {row.hasData ? (
                                                <span className="text-blue-700">{formatVND(row.totalSalary)}</span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {row.hasData ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                    Đã chốt
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                                    Chưa lập
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
