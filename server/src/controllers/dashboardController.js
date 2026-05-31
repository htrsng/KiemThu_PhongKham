const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Doctor = require('../models/Doctor');

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's appointments
    const appointmentsToday = await Appointment.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const walkInsToday = await Appointment.countDocuments({
      notes: 'Bệnh nhân vãng lai',
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const invoicesToday = await Invoice.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      status: 'Đã thanh toán'
    });

    const revenueToday = invoicesToday.reduce((sum, inv) => sum + (inv.finalAmount || inv.totalAmount), 0);

    // Tính toán queue capacity thực tế
    const scheduledAppointments = await Appointment.find({
      startTime: { $gte: todayStart, $lte: todayEnd }
    });

    const queueMap = { '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, '16:00': 0, '18:00': 0 };

    scheduledAppointments.forEach(app => {
      const h = app.startTime.getHours();
      let block = h % 2 !== 0 ? h - 1 : h;
      if (block < 8) block = 8;
      if (block > 18) block = 18;
      
      const timeStr = `${String(block).padStart(2, '0')}:00`;
      queueMap[timeStr] = (queueMap[timeStr] || 0) + 1;
    });

    const queueCapacity = Object.keys(queueMap).map(time => ({
      time, count: queueMap[time]
    }));

    // Tính toán service ratio thực tế
    const serviceMap = {};
    scheduledAppointments.forEach(app => {
      // Chỉ tính các cuộc hẹn đã/đang thực hiện
      if (app.status === 'Đã hoàn thành' || app.status === 'Đang điều trị' || app.status === 'Đã đến') {
        const name = app.serviceName || 'Dịch vụ khác';
        serviceMap[name] = (serviceMap[name] || 0) + 1;
      }
    });

    let serviceRatio = Object.keys(serviceMap).map(name => ({
      name, value: serviceMap[name]
    }));

    // Fallback nếu không có dữ liệu để biểu đồ không bị lỗi trắng
    if (serviceRatio.length === 0) {
      serviceRatio = [{ name: 'Chưa có dữ liệu', value: 1 }];
    }

    // Best doctor today: doctor with most completed appointments today
    const bestDoctorAgg = await Appointment.aggregate([
      {
        $match: {
          status: 'Đã hoàn thành',
          startTime: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: '$doctorId',
          doctorName: { $first: '$doctorName' },
          completedCases: { $sum: 1 }
        }
      },
      { $sort: { completedCases: -1 } },
      { $limit: 1 }
    ]);

    const bestDoctor = bestDoctorAgg.length > 0
      ? { name: bestDoctorAgg[0].doctorName, completedCases: bestDoctorAgg[0].completedCases }
      : { name: '—', completedCases: 0 };

    res.json({
      data: {
        kpi: {
            appointmentsToday,
            walkInsToday,
            revenueToday,
            bestDoctor
        },
        queueCapacity,
        serviceRatio
      }
    });

  } catch (error) {
    next(error);
  }
};
