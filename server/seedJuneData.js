require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./src/models/Service');
const Doctor = require('./src/models/Doctor');
const Patient = require('./src/models/Patient');
const Shift = require('./src/models/Shift');
const Appointment = require('./src/models/Appointment');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smilecare';

const seedJuneData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Lấy danh sách services, doctors, patients hiện có, nếu không có thì báo lỗi (cần chạy seed data trước)
        const services = await Service.find({});
        const doctors = await Doctor.find({});
        const patients = await Patient.find({});

        if (services.length === 0 || doctors.length === 0 || patients.length === 0) {
            console.log('⚠️ Dữ liệu cơ sở chưa có. Đang tạp dữ liệu cơ sở...');
            // Tạo một ít để tránh lỗi nếu database quá trống
            // Trong thực tế ngầm định đã chạy seedMayData.js hoặc seed.js
        }

        // Tạo Shifts cho tháng 6 năm 2026 (1 đến 30)
        // Xoá dữ liệu tháng 6 đi trước để tránh trùng lặp nếu chạy lại script nhiều lần
        await Shift.deleteMany({ date: { $regex: '^2026-06' } });

        const shiftsData = [];
        for (let d = 1; d <= 30; d++) {
            const dateStr = `2026-06-${d.toString().padStart(2, '0')}`;
            for (let doc of doctors) {
                if (Math.random() > 0.3) { // 70% chance to work that day
                    if (Math.random() > 0.3) {
                        shiftsData.push({ doctorId: doc._id, doctorName: doc.fullName, date: dateStr, startTime: '08:00', endTime: '12:00', coefficient: 1.0 });
                    }
                    if (Math.random() > 0.3) {
                        shiftsData.push({ doctorId: doc._id, doctorName: doc.fullName, date: dateStr, startTime: '13:00', endTime: '17:00', coefficient: 1.0 });
                    }
                }
            }
        }
        
        let shiftsLength = 0;
        if(shiftsData.length > 0) {
            const shifts = await Shift.insertMany(shiftsData);
            shiftsLength = shifts.length;
        }
        console.log(`✅ Seeded ${shiftsLength} shifts for June 2026`);

        // Xoá Appointmets tháng 6
        const startOfJune = new Date(2026, 5, 1);
        const endOfJune = new Date(2026, 5, 30, 23, 59, 59);
        await Appointment.deleteMany({ startTime: { $gte: startOfJune, $lte: endOfJune } });

        // Tạo Appointments cho tháng 6 năm 2026
        const appointmentsData = [];
        for (let doc of doctors) {
            for (let i = 0; i < 50; i++) {
                if(patients.length === 0 || services.length === 0) break;

                const randomPatient = patients[Math.floor(Math.random() * patients.length)];
                const randomService = services[Math.floor(Math.random() * services.length)];
                
                // Random day in June (1 to 30)
                const randomDay = Math.floor(Math.random() * 30) + 1;
                const startTime = new Date(2026, 5, randomDay, Math.floor(Math.random() * 8) + 8, 0, 0); // Month 5 is June
                const endTime = new Date(startTime.getTime() + (randomService.duration || 60) * 60000);

                const statuses = ['Đã lên lịch', 'Đã đến', 'Đang điều trị', 'Đã hoàn thành', 'Đã hủy'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                appointmentsData.push({
                    patientId: randomPatient._id,
                    patientName: randomPatient.fullName,
                    doctorId: doc._id,
                    doctorName: doc.fullName,
                    serviceId: randomService._id,
                    serviceName: randomService.name,
                    startTime: startTime,
                    endTime: endTime,
                    status: status,
                });
            }
        }

        let apptsLength = 0;
        if(appointmentsData.length > 0) {
            const appts = await Appointment.insertMany(appointmentsData);
            apptsLength = appts.length;
        }
        console.log(`✅ Seeded ${apptsLength} appointments for June 2026`);

        console.log('🎉 June 2026 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
};

seedJuneData();
