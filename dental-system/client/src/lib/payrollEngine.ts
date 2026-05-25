import type { Doctor, Shift as MockDoctorShift, Appointment as MockAppointment, Service as MockService } from '../contexts/DataContext'

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
    detailedShifts: (MockDoctorShift & { isRecurring?: boolean, calculatedHours?: number, shiftSalary?: number })[]
    detailedAppointments: MockAppointment[]
    hourlyRateUsed: number
    commissionRateUsed: number
}

// Hàm lấy Hệ số bác sĩ
function getDoctorCoefficient(degree: string): number {
    switch (degree) {
        case 'Đại học': return 1.3;
        case 'Thạc sỹ': return 1.5;
        case 'Tiến sỹ': return 1.7;
        case 'Phó giáo sư': return 2.0;
        case 'Giáo sư': return 2.5;
        default: return 1.0; // Dự phòng
    }
}

export function calculateDoctorSalary(
    doctor: Doctor, 
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

    // --- TỔNG HỢP GIỜ LÀM VIỆC ---
    // Kết hợp cả lịch trực (ưu tiên) và lịch làm việc cố định
    const allEffectiveShifts: (MockDoctorShift & { isRecurring?: boolean })[] = [];
    const processedDates = new Set<string>(); // Dùng để đánh dấu những ngày đã có lịch trực cụ thể

    // 1. Ưu tiên các ca trực đã đăng ký cụ thể (Lịch trực)
    const monthShifts = shifts.filter(s => s.doctorId === doctor.id && isTargetMonth(s.date));
    monthShifts.forEach(shift => {
        allEffectiveShifts.push(shift);
        processedDates.add(shift.date);
    });

    // 2. Bổ sung các ca làm việc từ lịch cố định (Lịch làm việc) cho những ngày chưa có ca trực
    if (doctor.schedule) {
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        const dayKeys = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']; // Giống trong DoctorManagementPage

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(targetYear, targetMonth - 1, day);
            const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Bỏ qua nếu ngày này đã có lịch trực cụ thể
            if (processedDates.has(dateKey)) {
                continue;
            }

            const dayOfWeekKey = dayKeys[currentDate.getDay()];
            const recurringShift = doctor.schedule[dayOfWeekKey];

            if (recurringShift?.enabled) {
                // Tạo một ca làm việc "ảo" từ lịch cố định
                allEffectiveShifts.push({
                    id: `recurring-${doctor.id}-${dateKey}`,
                    doctorId: doctor.id,
                    doctorName: doctor.fullName,
                    date: dateKey,
                    startTime: recurringShift.startTime,
                    endTime: recurringShift.endTime,
                    isRecurring: true, // Đánh dấu đây là ca từ lịch cố định
                    coefficient: 1.0 // Mặc định hệ số 1.0 cho ca hành chính/đăng ký
                });
            }
        }
    }

    const monthAppointments = appointments.filter(a => 
        a.doctorId === doctor.id && 
        isTargetMonth(a.startTime) && 
        a.status === 'Đã hoàn thành'
    );

    const doctorCoefficient = getDoctorCoefficient(doctor.degree);
    const hourlyRateUsed = doctor.hourlyRate || DEFAULT_HOURLY_RATE;
    const commissionRateUsed = doctor.serviceCommissionRate || DEFAULT_COMMISSION_RATE;

    // --- Tính tiền lương theo từng ca ---
    let totalHours = 0;
    let totalConvertedHours = 0;
    let shiftSalary = 0;

    const detailedShifts = allEffectiveShifts.map(shift => {
        // 1. Tính số giờ làm việc thực tế của ca
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        const hours = (endH - startH) + (endM - startM) / 60;
        totalHours += hours;

        // 2. Tìm các bệnh nhân/lịch hẹn thuộc ca này (so sánh ngày)
        // Giả sử lịch hẹn trùng ngày với ca làm việc
        const shiftDateAppointments = monthAppointments.filter(a => a.startTime.split('T')[0] === shift.date);
        
        // 3. Tính Tổng_hệ_số_bệnh_nhân
        const totalPatientCoefficient = shiftDateAppointments.reduce((acc, apt) => acc + (apt.difficulty || 0), 0);

        // 4. Lấy hệ số ca
        const shiftCoefficient = shift.coefficient || 1.0;

        // 5. Tính Số_giờ_quy_đổi
        const convertedHours = hours * (shiftCoefficient + totalPatientCoefficient);

        // 6. Tính Tiền làm thêm một ca
        const currentShiftSalary = convertedHours * doctorCoefficient * hourlyRateUsed;

        totalConvertedHours += convertedHours;
        shiftSalary += currentShiftSalary;

        return {
            ...shift,
            calculatedHours: convertedHours,
            shiftSalary: currentShiftSalary
        };
    });

    const consultationBonus = monthAppointments.length * (doctor.consultationFee || 0);
    
    const serviceBonus = monthAppointments.reduce((acc, apt) => {
        const service = services.find(s => s.id === apt.serviceId);
        return acc + (service ? service.basePrice * (commissionRateUsed / 100) : 0);
    }, 0);

    return {
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        specialty: doctor.specialty,
        totalHours: parseFloat(totalConvertedHours.toFixed(2)), // Sử dụng giờ đã quy đổi
        shiftSalary,
        completedAppointments: monthAppointments.length,
        consultationBonus,
        serviceBonus,
        totalSalary: shiftSalary + consultationBonus + serviceBonus,
        detailedShifts,
        detailedAppointments: monthAppointments,
        hourlyRateUsed,
        commissionRateUsed,
    };
}