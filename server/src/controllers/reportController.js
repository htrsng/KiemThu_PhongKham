const ExcelJS = require('exceljs');
const Doctor = require('../models/Doctor');
const Shift = require('../models/Shift');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');

exports.exportPayrollExcel = async (req, res, next) => {
  try {
    const targetMonth = parseInt(req.query.month) || 5;
    const targetYear = parseInt(req.query.year) || 2026;
    
    // Dates for filtering appointments
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    
    // Regex for filtering shifts (YYYY-MM)
    const monthStr = targetMonth.toString().padStart(2, '0');
    const dateRegex = new RegExp(`^${targetYear}-${monthStr}`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bảng lương');

    worksheet.columns = [
      { header: 'Mã Bác sĩ', key: 'doctorCode', width: 15 },
      { header: 'Tên Bác sĩ', key: 'doctorName', width: 30 },
      { header: 'Chuyên khoa', key: 'specialty', width: 20 },
      { header: 'Số giờ trực', key: 'totalHours', width: 15 },
      { header: 'Lương trực (VNĐ)', key: 'shiftSalary', width: 20 },
      { header: 'Số ca khám', key: 'completedAppointments', width: 15 },
      { header: 'Hoa hồng khám (VNĐ)', key: 'consultationBonus', width: 20 },
      { header: 'Hoa hồng DV (VNĐ)', key: 'serviceBonus', width: 20 },
      { header: 'Tổng lương (VNĐ)', key: 'totalSalary', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    const doctors = await Doctor.find({ status: 'active' });

    for (const doc of doctors) {
        // 1. Calculate Shift Salary
        const shifts = await Shift.find({ doctorId: doc._id, date: dateRegex });
        let totalHours = 0;
        shifts.forEach(shift => {
            const [startH, startM] = shift.startTime.split(':').map(Number);
            const [endH, endM] = shift.endTime.split(':').map(Number);
            let hours = (endH + endM / 60) - (startH + startM / 60);
            if (hours < 0) hours += 24; // Handle overnight shifts if any
            totalHours += hours * (shift.coefficient || 1);
        });
        const shiftSalary = totalHours * (doc.hourlyRate || 0);

        // 2. Calculate Consultation Bonus & Service Bonus
        const appointments = await Appointment.find({
            doctorId: doc._id,
            status: 'Đã hoàn thành',
            startTime: { $gte: startDate, $lte: endDate }
        }).populate('serviceId');

        const completedAppointments = appointments.length;
        // Assume consultation bonus is consultationFee * serviceCommissionRate
        const consultationBonus = completedAppointments * (doc.consultationFee || 0) * (doc.serviceCommissionRate || 0);

        let serviceBonus = 0;
        appointments.forEach(appt => {
            if (appt.serviceId) {
                const basePrice = appt.serviceId.basePrice || 0;
                const commRate = appt.serviceId.commissionRate || 0;
                serviceBonus += basePrice * commRate;
            }
        });

        const totalSalary = shiftSalary + consultationBonus + serviceBonus;

        worksheet.addRow({
            doctorCode: doc.licenseNumber,
            doctorName: doc.fullName,
            specialty: doc.specialty,
            totalHours: parseFloat(totalHours.toFixed(2)),
            shiftSalary: Math.round(shiftSalary),
            completedAppointments: completedAppointments,
            consultationBonus: Math.round(consultationBonus),
            serviceBonus: Math.round(serviceBonus),
            totalSalary: Math.round(totalSalary)
        });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Bang_Luong_T${targetMonth}_${targetYear}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating payroll excel:', error);
    next(error);
  }
};
