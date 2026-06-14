require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const Appointment = require('./src/models/Appointment');
    
    // Tìm các ca hẹn ngày 14 tháng 6 năm 2026 (giờ local là +07:00, nhưng trong DB lưu UTC)
    const start = new Date('2026-06-13T17:00:00.000Z'); // 00:00 ngày 14 theo giờ VN
    const end = new Date('2026-06-14T16:59:59.999Z'); // 23:59:59 ngày 14 theo giờ VN

    const apps = await Appointment.find({ startTime: { $gte: start, $lte: end } }).sort({ startTime: 1 });
    console.log(`Tổng số ca ngày 14/06/2026: ${apps.length}`);
    console.log(JSON.stringify(apps.map(a => ({
        id: a._id,
        patientName: a.patientName,
        doctorName: a.doctorName,
        serviceName: a.serviceName,
        startTime: a.startTime,
        status: a.status
    })), null, 2));

    // Thử check xem cái API dashboard lấy data như thế nào để biết con số 4
    process.exit(0);
}).catch(console.error);
