import { X } from 'lucide-react'
import { type SalaryReport } from '../lib/payrollEngine'
import { formatVND, formatDateTime } from '../lib/formatters'
import { type MockService } from '../lib/mockData'

interface PayrollDetailModalProps {
    isOpen: boolean
    onClose: () => void
    report: SalaryReport | null
    services: MockService[] // Needed to get service price for commission calculation display
    targetMonth: number
    targetYear: number
}

export function PayrollDetailModal({ isOpen, onClose, report, services, targetMonth, targetYear }: PayrollDetailModalProps) {
    if (!isOpen || !report) return null

    const getServicePrice = (serviceId: string) => {
        return services.find(s => s.id === serviceId)?.basePrice || 0
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                            Chi tiết lương: {report.doctorName}
                        </h3>
                        <p className="text-sm text-slate-500">
                            Kỳ lương tháng {targetMonth}/{targetYear}
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
                            <p className="text-sm font-medium text-green-800">Tổng hoa hồng</p>
                            <p className="text-lg font-bold text-green-900">{formatVND(report.consultationBonus + report.serviceBonus)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-800 text-white p-4">
                            <p className="text-sm font-medium text-slate-300">Tổng nhận</p>
                            <p className="text-lg font-bold">{formatVND(report.totalSalary)}</p>
                        </div>
                    </div>

                    {/* Shift Salary Details */}
                    <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Chi tiết Lương Ca Trực</h4>
                        <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg mb-3 text-sm">
                            <div>
                                <span className="font-medium">Tổng số giờ trực: </span>
                                <span className="font-bold text-blue-600">{report.totalHours} giờ</span>
                            </div>
                            <div>
                                <span className="font-medium">Mức lương giờ: </span>
                                <span className="font-bold text-blue-600">{formatVND(report.hourlyRateUsed)}/giờ</span>
                            </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="border-b">
                                        <th className="py-2 px-3 font-semibold">Ngày</th>
                                        <th className="py-2 px-3 font-semibold">Bắt đầu</th>
                                        <th className="py-2 px-3 font-semibold">Kết thúc</th>
                                        <th className="py-2 px-3 font-semibold text-right">Số giờ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {report.detailedShifts.length > 0 ? report.detailedShifts.map(shift => (
                                        <tr key={shift.id}>
                                            <td className="py-2 px-3">{shift.date}</td>
                                            <td className="py-2 px-3">{shift.startTime}</td>
                                            <td className="py-2 px-3">{shift.endTime}</td>
                                            <td className="py-2 px-3 text-right font-medium">
                                                {(((new Date(`1970-01-01T${shift.endTime}:00Z`).getTime() - new Date(`1970-01-01T${shift.startTime}:00Z`).getTime()) / 3600000)).toFixed(2)}h
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="py-4 text-center text-slate-500">Không có ca trực trong kỳ.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Commission Details */}
                    <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Chi tiết Hoa Hồng</h4>
                        <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg mb-3 text-sm">
                            <div>
                                <span className="font-medium">Số ca khám hoàn thành: </span>
                                <span className="font-bold text-green-600">{report.completedAppointments} ca</span>
                            </div>
                            <div>
                                <span className="font-medium">Hoa hồng phí khám: </span>
                                <span className="font-bold text-green-600">{formatVND(report.consultationBonus)}</span>
                            </div>
                            <div>
                                <span className="font-medium">Hoa hồng dịch vụ ({report.commissionRateUsed}%): </span>
                                <span className="font-bold text-green-600">{formatVND(report.serviceBonus)}</span>
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="border-b">
                                        <th className="py-2 px-3 font-semibold">Ngày khám</th>
                                        <th className="py-2 px-3 font-semibold">Bệnh nhân</th>
                                        <th className="py-2 px-3 font-semibold">Dịch vụ</th>
                                        <th className="py-2 px-3 font-semibold text-right">Doanh thu DV</th>
                                        <th className="py-2 px-3 font-semibold text-right">Hoa hồng DV</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {report.detailedAppointments.length > 0 ? report.detailedAppointments.map(apt => {
                                        const servicePrice = getServicePrice(apt.serviceId)
                                        const commission = servicePrice * (report.commissionRateUsed / 100)
                                        return (
                                            <tr key={apt.id}>
                                                <td className="py-2 px-3">{formatDateTime(apt.startTime)}</td>
                                                <td className="py-2 px-3">{apt.patientName}</td>
                                                <td className="py-2 px-3">{apt.serviceName}</td>
                                                <td className="py-2 px-3 text-right">{formatVND(servicePrice)}</td>
                                                <td className="py-2 px-3 text-right font-medium">{formatVND(commission)}</td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr><td colSpan={5} className="py-4 text-center text-slate-500">Không có ca khám hoàn thành trong kỳ.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}