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

    // Mock queue capacity
    const queueCapacity = [
        { time: '08:00', count: 2 },
        { time: '10:00', count: 5 },
        { time: '12:00', count: 1 },
        { time: '14:00', count: 8 },
        { time: '16:00', count: 4 },
        { time: '18:00', count: 0 }
    ];

    // Mock service ratio
    const serviceRatio = [
        { name: 'Khám tổng quát', value: 40 },
        { name: 'Nhổ răng', value: 20 },
        { name: 'Lấy cao răng', value: 25 },
        { name: 'Nha khoa thẩm mỹ', value: 15 }
    ];

    res.json({
      data: {
        kpi: {
            appointmentsToday,
            walkInsToday,
            revenueToday,
            bestDoctor: { name: 'Dr. John Doe', completedCases: 5 }
        },
        queueCapacity,
        serviceRatio
      }
    });
  } catch (error) {
    next(error);
  }
};
