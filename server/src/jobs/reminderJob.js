const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// Run everyday at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  try {
    console.log('[CRON] Bắt đầu quét lịch hẹn ngày mai để gửi tin nhắn nhắc nhở...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      startTime: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: 'Đã lên lịch'
    });

    if (appointments.length === 0) {
      console.log('[CRON] Không có lịch hẹn nào vào ngày mai.');
      return;
    }

    for (const apt of appointments) {
      const patient = await Patient.findById(apt.patientId);
      if (patient && patient.phone) {
        // Giả lập gửi SMS / Zalo ZNS
        console.log(`[ZALO ZNS/SMS Mock] Đã gửi tin nhắn nhắc lịch đến BN ${patient.fullName} (SĐT: ${patient.phone}). Giờ khám: ${apt.startTime}`);
      }
    }

    console.log('[CRON] Hoàn tất gửi tin nhắn nhắc nhở.');
  } catch (error) {
    console.error('[CRON Error]', error);
  }
});
