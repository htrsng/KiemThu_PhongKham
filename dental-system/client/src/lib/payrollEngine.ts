import type { MockDoctor, MockDoctorShift, MockAppointment, MockService } from './mockData'

// Định nghĩa các hằng số để tránh "magic numbers"
const DEFAULT_HOURLY_RATE = 100000; // 100,000 VND
const DEFAULT_COMMISSION_RATE = 15; // 15%

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
    detailedShifts: MockDoctorShift[]
    detailedAppointments: MockAppointment[]
    hourlyRateUsed: number
    commissionRateUsed: number
}

export function calculateDoctorSalary(
    doctor: MockDoctor, 
    targetMonth: number, 
    targetYear: number, 
    shifts: MockDoctorShift[], 
    appointments: MockAppointment[], 
    services: MockService[] 
): SalaryReport {
    const isTargetMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        return (d.getMonth() + 1 === targetMonth) && (d.getFullYear() === targetYear);
    };

    // Lọc các ca trực và lịch hẹn đã hoàn thành trong tháng của bác sĩ
    const monthShifts = shifts.filter(s => s.doctorId === doctor.id && isTargetMonth(s.date));
    const monthAppointments = appointments.filter(a => 
        a.doctorId === doctor.id && 
        isTargetMonth(a.startTime) && 
        a.status === 'Đã hoàn thành'
    );

    // Tính tổng số giờ làm việc từ các ca trực
    const totalHours = monthShifts.reduce((acc, shift) => {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        const hours = (endH - startH) + (endM - startM) / 60;
        return acc + hours;
    }, 0);

    // Tính lương theo giờ, hoa hồng khám và hoa hồng dịch vụ
    const hourlyRateUsed = doctor.hourlyRate || DEFAULT_HOURLY_RATE;
    const commissionRateUsed = doctor.serviceCommissionRate || DEFAULT_COMMISSION_RATE;

    const shiftSalary = totalHours * hourlyRateUsed;
    const consultationBonus = monthAppointments.length * doctor.consultationFee;
    
    const serviceBonus = monthAppointments.reduce((acc, apt) => {
        const service = services.find(s => s.id === apt.serviceId);
        return acc + (service ? service.basePrice * (commissionRateUsed / 100) : 0);
    }, 0);

    return {
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        specialty: doctor.specialty,
        totalHours: parseFloat(totalHours.toFixed(2)), // Làm tròn để hiển thị đẹp hơn
        shiftSalary,
        completedAppointments: monthAppointments.length,
        consultationBonus,
        serviceBonus,
        totalSalary: shiftSalary + consultationBonus + serviceBonus,
        detailedShifts: monthShifts,
        detailedAppointments: monthAppointments,
        hourlyRateUsed,
        commissionRateUsed,
    };
}