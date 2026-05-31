const Doctor = require('../models/Doctor');
const Shift = require('../models/Shift');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Setting = require('../models/Setting');

// Định nghĩa các hằng số mặc định
const DEFAULT_HOURLY_RATE = 100000;
const DEFAULT_COMMISSION_RATE = 15;

// Hàm lấy Hệ số bác sĩ
function getDoctorCoefficient(degree) {
    switch (degree) {
        case 'Đại học': return 1.3;
        case 'Thạc sỹ': return 1.5;
        case 'Tiến sỹ': return 1.7;
        case 'Phó giáo sư': return 2.0;
        case 'Giáo sư': return 2.5;
        default: return 1.0;
    }
}

exports.calculateMonthlyPayroll = async (req, res, next) => {
    try {
        const targetMonth = parseInt(req.query.month) || new Date().getMonth() + 1;
        const targetYear = parseInt(req.query.year) || new Date().getFullYear();
        const doctorId = req.query.doctorId;

        // Fetch data
        const query = { status: 'active' };
        if (doctorId) {
            query._id = doctorId;
        }

        const doctors = await Doctor.find(query);
        const services = await Service.find();
        
        // UC4.1 & UC4.2: Fetch global payroll config
        const payrollConfigSetting = await Setting.findOne({ settingCode: 'payroll.config' });
        const payrollConfig = payrollConfigSetting ? payrollConfigSetting.value : {
            baseHourlyRate: DEFAULT_HOURLY_RATE,
            shiftMultipliers: { morning: 1, afternoon: 1, evening: 1.3, weekend: 1.5, holiday: 2 },
            defaultConsultationFee: 0
        };
        const globalHourlyRate = payrollConfig.baseHourlyRate || DEFAULT_HOURLY_RATE;

        // Tính ngày
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        const monthStr = targetMonth.toString().padStart(2, '0');
        const dateRegex = new RegExp(`^${targetYear}-${monthStr}`);

        const results = [];

        for (const doctor of doctors) {
            // 1. All Shifts in month
            const shifts = await Shift.find({ doctorId: doctor._id, date: dateRegex });
            const allEffectiveShifts = [];
            const processedDates = new Set();

            shifts.forEach(shift => {
                allEffectiveShifts.push(shift.toObject());
                processedDates.add(shift.date);
            });

            // Lịch làm việc cố định
            if (doctor.schedule) {
                const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
                const dayKeys = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

                for (let day = 1; day <= daysInMonth; day++) {
                    const currentDate = new Date(targetYear, targetMonth - 1, day);
                    const dateKey = `${targetYear}-${monthStr}-${String(day).padStart(2, '0')}`;

                    if (processedDates.has(dateKey)) continue;

                    const dayOfWeekKey = dayKeys[currentDate.getDay()];
                    const recurringShift = doctor.schedule[dayOfWeekKey];

                    if (recurringShift && recurringShift.enabled) {
                        allEffectiveShifts.push({
                            id: `recurring-${doctor._id}-${dateKey}`,
                            doctorId: doctor._id,
                            doctorName: doctor.fullName,
                            date: dateKey,
                            startTime: recurringShift.startTime,
                            endTime: recurringShift.endTime,
                            isRecurring: true,
                            coefficient: 1.0
                        });
                    }
                }
            }

            // 2. Appointments in month
            const appointments = await Appointment.find({
                doctorId: doctor._id,
                status: 'Đã hoàn thành',
                startTime: { $gte: startDate, $lte: endDate }
            });

            const doctorCoefficient = getDoctorCoefficient(doctor.degree);
            const hourlyRateUsed = doctor.hourlyRate || globalHourlyRate;
            const commissionRateUsed = doctor.serviceCommissionRate || DEFAULT_COMMISSION_RATE;

            let totalHours = 0;
            let totalConvertedHours = 0;
            let shiftSalary = 0;

            const detailedShifts = allEffectiveShifts.map(shift => {
                const [startH, startM] = shift.startTime.split(':').map(Number);
                const [endH, endM] = shift.endTime.split(':').map(Number);
                const hours = (endH - startH) + (endM - startM) / 60;
                totalHours += hours;

                // Các ca hẹn trong ngày của ca trực
                const shiftDateAppointments = appointments.filter(a => new Date(a.startTime).toISOString().split('T')[0] === shift.date);
                
                // Mức độ phức tạp (UC4.3)
                const totalPatientCoefficient = shiftDateAppointments.reduce((acc, apt) => acc + (apt.difficulty || 0), 0);
                
                // Determine base shift coefficient
                let baseShiftCoefficient = 1.0;
                if (startH < 12) baseShiftCoefficient = payrollConfig.shiftMultipliers?.morning || 1.0;
                else if (startH < 17) baseShiftCoefficient = payrollConfig.shiftMultipliers?.afternoon || 1.0;
                else baseShiftCoefficient = payrollConfig.shiftMultipliers?.evening || 1.3;
                
                const shiftDate = new Date(shift.date);
                const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6;
                if (isWeekend) baseShiftCoefficient = Math.max(baseShiftCoefficient, payrollConfig.shiftMultipliers?.weekend || 1.5);
                
                const shiftCoefficient = shift.coefficient || baseShiftCoefficient;

                const convertedHours = hours * (shiftCoefficient + totalPatientCoefficient);
                const currentShiftSalary = convertedHours * doctorCoefficient * hourlyRateUsed;

                totalConvertedHours += convertedHours;
                shiftSalary += currentShiftSalary;

                return {
                    ...shift,
                    calculatedHours: convertedHours,
                    shiftSalary: currentShiftSalary
                };
            });

            const consultationBonus = appointments.length * (doctor.consultationFee || payrollConfig.defaultConsultationFee || 0);
            
            const serviceBonus = appointments.reduce((acc, apt) => {
                const service = services.find(s => s._id.toString() === apt.serviceId?.toString());
                return acc + (service ? service.basePrice * (commissionRateUsed / 100) : 0);
            }, 0);

            results.push({
                doctorId: doctor._id,
                doctorName: doctor.fullName,
                specialty: doctor.specialty,
                totalHours: parseFloat(totalConvertedHours.toFixed(2)),
                shiftSalary: Math.round(shiftSalary),
                completedAppointments: appointments.length,
                consultationBonus: Math.round(consultationBonus),
                serviceBonus: Math.round(serviceBonus),
                totalSalary: Math.round(shiftSalary + consultationBonus + serviceBonus),
                detailedShifts,
                detailedAppointments: appointments,
                hourlyRateUsed,
                commissionRateUsed
            });
        }

        res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error calculating payroll:', error);
        res.status(500).json({ success: false, error: 'Lỗi server khi tính lương' });
    }
};

exports.calculateYearlyPayroll = async (req, res, next) => {
    try {
        const targetYear = parseInt(req.query.year) || new Date().getFullYear();
        const doctorId = req.query.doctorId;

        // Tạm thời gọi lại 12 tháng (hiệu năng sễ chậm với DB lớn, nhưng do yêu cầu gấp rút nên loop là nhanh nhất)
        const yearlyData = {};
        for(let month = 1; month <= 12; month++) {
            req.query.month = month;
            req.query.year = targetYear;
            
            // Xây dựng mock request / response
            let monthData = [];
            const mockRes = {
                status: () => ({ json: (data) => monthData = data.data }),
            };
            
            await this.calculateMonthlyPayroll(req, mockRes, next);
            
            monthData.forEach(d => {
                if(!yearlyData[d.doctorId]) {
                    yearlyData[d.doctorId] = {
                        doctorId: d.doctorId,
                        doctorName: d.doctorName,
                        specialty: d.specialty,
                        totalSalary: 0,
                        monthlyBreakdown: []
                    };
                }
                yearlyData[d.doctorId].totalSalary += d.totalSalary;
                yearlyData[d.doctorId].monthlyBreakdown.push({
                    month,
                    totalSalary: d.totalSalary
                });
            });
        }

        res.status(200).json({
            success: true,
            data: Object.values(yearlyData)
        });

    } catch(error) {
        console.error('Error calculating yearly payroll:', error);
        res.status(500).json({ success: false, error: 'Lỗi server khi tính lương năm' });
    }
};