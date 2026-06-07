const Doctor = require('../models/Doctor');
const Shift = require('../models/Shift');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Setting = require('../models/Setting');
const PayrollSlip = require('../models/PayrollSlip');
const PayrollConfigHistory = require('../models/PayrollConfigHistory');

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
        
        // UC4.1 & UC4.2: Fetch global payroll config history
        const configHistory = await PayrollConfigHistory.find().sort({ effectiveDate: -1 });
        
        // Fallback if no history exists
        let defaultPayrollConfig = {
            baseHourlyRate: DEFAULT_HOURLY_RATE,
            shiftMultipliers: { morning: 1, afternoon: 1, evening: 1.3, weekend: 1.5, holiday: 2 },
            defaultConsultationFee: 0
        };
        
        // If no history, try to get from legacy Setting (for migration)
        if (configHistory.length === 0) {
            const legacySetting = await Setting.findOne({ settingCode: 'payroll.config' });
            if (legacySetting) {
                defaultPayrollConfig = legacySetting.value;
            }
        }

        // Helper function to get config for a specific date
        const getConfigForDate = (date) => {
            if (configHistory.length === 0) return defaultPayrollConfig;
            const target = new Date(date);
            const activeConfig = configHistory.find(c => new Date(c.effectiveDate) <= target);
            return activeConfig || configHistory[configHistory.length - 1]; // Fallback to oldest
        };

        const globalHourlyRate = defaultPayrollConfig.baseHourlyRate || DEFAULT_HOURLY_RATE; // Fallback

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
                // Use shift.patientCoefficient if explicitly set, otherwise sum up difficulty
                const totalPatientCoefficient = shift.patientCoefficient != null && shift.patientCoefficient > 0 
                    ? shift.patientCoefficient 
                    : shiftDateAppointments.reduce((acc, apt) => acc + (apt.difficulty || 0), 0);
                
                // UC4.1 & UC4.2: Use config effective for this shift's date
                const shiftDate = new Date(shift.date);
                const activeConfig = getConfigForDate(shiftDate);
                
                // Determine base shift coefficient
                let baseShiftCoefficient = 1.0;
                if (startH < 12) baseShiftCoefficient = activeConfig.shiftMultipliers?.morning || 1.0;
                else if (startH < 17) baseShiftCoefficient = activeConfig.shiftMultipliers?.afternoon || 1.0;
                else baseShiftCoefficient = activeConfig.shiftMultipliers?.evening || 1.3;
                
                const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6;
                if (isWeekend) baseShiftCoefficient = Math.max(baseShiftCoefficient, activeConfig.shiftMultipliers?.weekend || 1.5);
                
                const shiftCoefficient = shift.coefficient || baseShiftCoefficient;
                
                // Active hourly rate for this shift
                const shiftHourlyRate = doctor.hourlyRate || activeConfig.baseHourlyRate || DEFAULT_HOURLY_RATE;

                const convertedHours = hours * (shiftCoefficient + totalPatientCoefficient);
                const currentShiftSalary = convertedHours * doctorCoefficient * shiftHourlyRate;

                totalConvertedHours += convertedHours;
                shiftSalary += currentShiftSalary;

                return {
                    ...shift,
                    shiftName: shift.name || 'Ca trực',
                    durationHours: parseFloat(hours.toFixed(2)),
                    multiplier: parseFloat((shiftCoefficient + totalPatientCoefficient).toFixed(2)),
                    calculatedHours: convertedHours,
                    shiftPayout: currentShiftSalary,
                    shiftSalary: currentShiftSalary
                };
            });

            const consultationBonus = appointments.length * (doctor.consultationFee || payrollConfig.defaultConsultationFee || 0);
            
            const serviceBonus = appointments.reduce((acc, apt) => {
                const service = services.find(s => s._id.toString() === apt.serviceId?.toString());
                return acc + (service ? service.basePrice * (commissionRateUsed / 100) : 0);
            }, 0);

            const detailedAppointments = appointments.map(apt => {
                const service = services.find(s => s._id.toString() === apt.serviceId?.toString());
                const aptConsultationBonus = (doctor.consultationFee || payrollConfig.defaultConsultationFee || 0);
                const aptServiceBonus = service ? service.basePrice * (commissionRateUsed / 100) : 0;
                return {
                    date: apt.startTime,
                    patientName: apt.patientName,
                    difficultyMultiplier: apt.difficulty || 0,
                    consultationBonus: aptConsultationBonus,
                    serviceBonus: aptServiceBonus,
                    services: service ? [{ name: service.name || apt.serviceName, commissionRate: commissionRateUsed / 100 }] : [],
                    totalBonus: aptConsultationBonus + aptServiceBonus
                };
            });

            const existingSlip = await PayrollSlip.findOne({ doctorId: doctor._id, month: targetMonth, year: targetYear });

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
                detailedAppointments: detailedAppointments,
                hourlyRateUsed,
                commissionRateUsed,
                isLocked: existingSlip ? true : false,
                lockedAt: existingSlip ? existingSlip.lockedAt : null
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

        // Fetch all doctors first
        const docQuery = { status: 'active' };
        if (doctorId) {
            docQuery._id = doctorId;
        }
        const doctors = await Doctor.find(docQuery);

        // Lấy dữ liệu đã lưu trên server (PayrollSlip)
        const slipQuery = { year: targetYear, status: 'Đã chốt' };
        if (doctorId) {
            slipQuery.doctorId = doctorId;
        }
        const slips = await PayrollSlip.find(slipQuery);
        
        const yearlyData = {};
        
        // Initialize all active doctors with 0 salary
        doctors.forEach(doc => {
            const docId = doc._id.toString();
            yearlyData[docId] = {
                doctorId: docId,
                doctorName: doc.fullName,
                specialty: doc.specialty || '',
                totalSalary: 0,
                monthlyBreakdown: []
            };
        });
        
        // Add slip totals
        slips.forEach(slip => {
            const docId = slip.doctorId._id ? slip.doctorId._id.toString() : slip.doctorId.toString();
            if (!yearlyData[docId]) {
                return;
            }
            yearlyData[docId].totalSalary += slip.totalSalary;
            yearlyData[docId].monthlyBreakdown.push({
                month: slip.month,
                shiftCount: slip.details && Array.isArray(slip.details) ? slip.details.length : 0,
                totalHours: slip.totalHours || 0,
                totalSalary: slip.totalSalary,
                status: slip.status
            });
        });

        res.status(200).json({
            success: true,
            data: Object.values(yearlyData)
        });

    } catch(error) {
        console.error('Error calculating yearly payroll:', error);
        res.status(500).json({ success: false, error: 'Lỗi server khi tính lương năm' });
    }
};

exports.getPayrollSlip = async (req, res, next) => {
    try {
        const { doctorId, month, year } = req.query;
        if (!doctorId || !month || !year) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc (doctorId, month, year)' });
        }
        const slip = await PayrollSlip.findOne({ doctorId, month: parseInt(month), year: parseInt(year) }).populate('doctorId', 'fullName code specialty');
        if (slip) {
            return res.status(200).json({ success: true, data: slip });
        }
        return res.status(404).json({ success: false, message: 'Chưa có phiếu lương' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
};

exports.savePayrollSlip = async (req, res, next) => {
    try {
        const { doctorId, month, year, totalSalary, totalHours, hourlyRateUsed, details } = req.body;
        
        // Check existing
        const existingSlip = await PayrollSlip.findOne({ doctorId, month, year });
        if (existingSlip && existingSlip.status === 'Đã chốt') {
            return res.status(400).json({ success: false, error: 'Phiếu lương tháng này đã được chốt và không thể ghi đè' });
        }

        if (existingSlip) {
            existingSlip.totalSalary = totalSalary;
            existingSlip.totalHours = totalHours;
            existingSlip.hourlyRateUsed = hourlyRateUsed;
            existingSlip.details = details;
            existingSlip.status = 'Đã chốt';
            existingSlip.lockedAt = Date.now();
            await existingSlip.save();
            return res.status(200).json({ success: true, data: existingSlip });
        } else {
            const newSlip = new PayrollSlip({
                doctorId, month, year, totalSalary, totalHours, hourlyRateUsed, details, status: 'Đã chốt', lockedAt: Date.now()
            });
            await newSlip.save();
            return res.status(201).json({ success: true, data: newSlip });
        }
    } catch (error) {
        console.error('Error saving payroll slip:', error);
        res.status(500).json({ success: false, error: 'Lỗi server khi lưu phiếu lương' });
    }
};

// UC 4.3 Functions
exports.getShiftCoefficients = async (req, res, next) => {
    try {
        const targetMonth = parseInt(req.query.month) || new Date().getMonth() + 1;
        const targetYear = parseInt(req.query.year) || new Date().getFullYear();
        
        const monthStr = targetMonth.toString().padStart(2, '0');
        const dateRegex = new RegExp(`^${targetYear}-${monthStr}`);
        
        const shifts = await Shift.find({ date: dateRegex }).populate('doctorId', 'fullName');
        
        // Populate appointments for each shift
        const results = await Promise.all(shifts.map(async (shift) => {
            const shiftDateStr = shift.date;
            const shiftStart = new Date(`${shiftDateStr}T00:00:00Z`);
            const shiftEnd = new Date(`${shiftDateStr}T23:59:59Z`);

            const appointments = await Appointment.find({
                doctorId: shift.doctorId,
                startTime: { $gte: shiftStart, $lte: shiftEnd },
                status: 'Đã hoàn thành'
            });

            const calculatedCoefficient = appointments.reduce((acc, apt) => acc + (apt.difficulty || 0), 0);

            return {
                id: shift._id,
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime,
                doctorId: shift.doctorId ? shift.doctorId._id : null,
                doctorName: shift.doctorName,
                patientCoefficient: shift.patientCoefficient || 0,
                calculatedCoefficient, // Just for UI reference
                appointments: appointments.map(a => ({
                    id: a._id,
                    patientName: a.patientName,
                    serviceName: a.serviceName,
                    difficulty: a.difficulty || 0
                }))
            };
        }));

        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Error getting shift coefficients:', error);
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
};

exports.updateShiftCoefficient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { patientCoefficient } = req.body;

        const shift = await Shift.findById(id);
        if (!shift) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy ca trực' });
        }

        // Check if payroll is locked
        const [year, month] = shift.date.split('-');
        const slip = await PayrollSlip.findOne({ doctorId: shift.doctorId, month: parseInt(month), year: parseInt(year), status: 'Đã chốt' });
        if (slip) {
            return res.status(400).json({ success: false, error: 'Phiếu lương tháng này đã được chốt, không thể chỉnh sửa hệ số' });
        }

        shift.patientCoefficient = patientCoefficient;
        await shift.save();

        res.status(200).json({ success: true, data: shift });
    } catch (error) {
        console.error('Error updating shift coefficient:', error);
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
};

exports.updateAppointmentsDifficulty = async (req, res, next) => {
    try {
        const { id } = req.params; // shift id
        const { appointments } = req.body; // array of { id, difficulty }

        const shift = await Shift.findById(id);
        if (!shift) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy ca trực' });
        }

        // Check if payroll is locked
        const [year, month] = shift.date.split('-');
        const slip = await PayrollSlip.findOne({ doctorId: shift.doctorId, month: parseInt(month), year: parseInt(year), status: 'Đã chốt' });
        if (slip) {
            return res.status(400).json({ success: false, error: 'Phiếu lương tháng này đã được chốt, không thể chỉnh sửa hệ số' });
        }

        let totalCoefficient = 0;
        for (const apt of appointments) {
            if (apt.difficulty > 0.5) {
                return res.status(400).json({ success: false, error: 'Hệ số tối đa cho 1 bệnh nhân là 0.5' });
            }
            totalCoefficient += apt.difficulty;
            await Appointment.findByIdAndUpdate(apt.id, { difficulty: apt.difficulty });
        }

        shift.patientCoefficient = totalCoefficient;
        await shift.save();

        res.status(200).json({ success: true, data: shift });
    } catch (error) {
        console.error('Error updating appointments difficulty:', error);
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
};

// UC 4.1 & 4.2 History Functions
exports.getPayrollConfigHistory = async (req, res, next) => {
    try {
        const history = await PayrollConfigHistory.find().sort({ effectiveDate: -1 }).populate('createdBy', 'fullName email');
        
        // If history is empty, check legacy Setting
        if (history.length === 0) {
            const legacySetting = await Setting.findOne({ settingCode: 'payroll.config' });
            if (legacySetting) {
                const initialHistory = new PayrollConfigHistory({
                    ...legacySetting.value,
                    effectiveDate: new Date('2020-01-01'), // Old date for legacy
                    reason: 'Chuyển đổi dữ liệu cũ'
                });
                await initialHistory.save();
                return res.status(200).json({ success: true, data: [initialHistory] });
            }
        }
        
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error('Error getting config history:', error);
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
};

exports.addPayrollConfigHistory = async (req, res, next) => {
    try {
        const { baseHourlyRate, shiftMultipliers, defaultConsultationFee, effectiveDate, reason } = req.body;
        
        if (baseHourlyRate < 0 || defaultConsultationFee < 0) {
            return res.status(400).json({ success: false, error: 'Giá trị tiền mặt không được âm.' });
        }
        
        const newConfig = new PayrollConfigHistory({
            baseHourlyRate,
            shiftMultipliers,
            defaultConsultationFee,
            effectiveDate,
            reason,
            createdBy: req.user ? req.user.id : null
        });
        
        await newConfig.save();
        res.status(201).json({ success: true, data: newConfig });
    } catch (error) {
        console.error('Error adding config history:', error);
        res.status(500).json({ success: false, error: 'Lỗi server khi lưu cấu hình' });
    }
};