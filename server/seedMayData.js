const mongoose = require('mongoose');
const Service = require('./src/models/Service');
const Doctor = require('./src/models/Doctor');
const Patient = require('./src/models/Patient');
const Shift = require('./src/models/Shift');
const Appointment = require('./src/models/Appointment');

// Replace with your actual connection string if different
const MONGO_URI = 'mongodb://localhost:27017/dental_clinic';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Service.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Shift.deleteMany({});
        await Appointment.deleteMany({});
        console.log('✅ Cleared old data');

        // 1. Create Services (with commissionRate)
        const services = await Service.insertMany([
            { code: 'DV-001', name: 'Khám tổng quát', category: 'Khám bệnh', basePrice: 100000, duration: 30, commissionRate: 0.1 },
            { code: 'DV-005', name: 'Cạo vôi răng', category: 'Vệ sinh', basePrice: 150000, duration: 30, commissionRate: 0.1 },
            { code: 'DV-003', name: 'Trám răng thẩm mỹ', category: 'Phục hình', basePrice: 300000, duration: 45, commissionRate: 0.15 },
            { code: 'DV-004', name: 'Tẩy trắng răng', category: 'Thẩm mỹ', basePrice: 2000000, duration: 90, commissionRate: 0.15 },
            { code: 'DV-007', name: 'Điều trị tủy', category: 'Chữa tủy', basePrice: 800000, duration: 60, commissionRate: 0.20 },
            { code: 'DV-002', name: 'Nhổ răng khôn', category: 'Tiểu phẫu', basePrice: 1500000, duration: 60, commissionRate: 0.25 },
            { code: 'DV-008', name: 'Cắm Implant', category: 'Phục hình', basePrice: 15000000, duration: 120, commissionRate: 0.30 },
        ]);
        console.log(`✅ Seeded ${services.length} services`);

        // 2. Create Doctors
        const doctors = await Doctor.insertMany([
            { licenseNumber: 'BS001', fullName: 'BS. Nguyễn Văn A', specialty: 'Tổng quát', hourlyRate: 150000, consultationFee: 100000, serviceCommissionRate: 0.5 },
            { licenseNumber: 'BS002', fullName: 'BS. Trần Thị B', specialty: 'Tiểu phẫu', hourlyRate: 200000, consultationFee: 150000, serviceCommissionRate: 0.5 },
            { licenseNumber: 'BS003', fullName: 'BS. Lê Văn C', specialty: 'Phục hình', hourlyRate: 250000, consultationFee: 200000, serviceCommissionRate: 0.5 }
        ]);
        console.log(`✅ Seeded ${doctors.length} doctors`);

        // 3. Create Patients
        const patientsData = [];
        for(let i=1; i<=20; i++) {
            patientsData.push({
                patientCode: `BN${i.toString().padStart(3, '0')}`,
                fullName: `Bệnh nhân ${i}`,
                phone: `0901234${i.toString().padStart(3, '0')}`
            });
        }
        const patients = await Patient.insertMany(patientsData);
        console.log(`✅ Seeded ${patients.length} patients`);

        // 4. Create Shifts for May 2026 (assuming 20 working days, 8 hours a day)
        const shiftsData = [];
        for (let d = 1; d <= 31; d++) {
            const dateStr = `2026-05-${d.toString().padStart(2, '0')}`;
            // Let's say BS001 and BS002 work on weekdays (ignore weekends for simplicity or just assign random shifts)
            if (d % 7 !== 0 && d % 7 !== 6) { // naive weekday check
                shiftsData.push({
                    doctorId: doctors[0]._id, doctorName: doctors[0].fullName,
                    date: dateStr, startTime: '08:00', endTime: '12:00', coefficient: 1
                });
                shiftsData.push({
                    doctorId: doctors[0]._id, doctorName: doctors[0].fullName,
                    date: dateStr, startTime: '13:00', endTime: '17:00', coefficient: 1
                });
                shiftsData.push({
                    doctorId: doctors[1]._id, doctorName: doctors[1].fullName,
                    date: dateStr, startTime: '08:00', endTime: '17:00', coefficient: 1
                });
            }
        }
        const shifts = await Shift.insertMany(shiftsData);
        console.log(`✅ Seeded ${shifts.length} shifts`);

        // 5. Create Appointments for May 2026
        const appointmentsData = [];
        // Give each doctor around 30 appointments
        for (let doc of doctors) {
            for (let i = 0; i < 30; i++) {
                const randomPatient = patients[Math.floor(Math.random() * patients.length)];
                const randomService = services[Math.floor(Math.random() * services.length)];
                
                // Random day in May (1 to 31)
                const randomDay = Math.floor(Math.random() * 31) + 1;
                const startTime = new Date(2026, 4, randomDay, 9, 0, 0); // Month 4 is May
                const endTime = new Date(startTime.getTime() + randomService.duration * 60000);

                appointmentsData.push({
                    patientId: randomPatient._id,
                    patientName: randomPatient.fullName,
                    doctorId: doc._id,
                    doctorName: doc.fullName,
                    serviceId: randomService._id,
                    serviceName: randomService.name,
                    startTime: startTime,
                    endTime: endTime,
                    status: 'Đã hoàn thành',
                });
            }
        }
        const appts = await Appointment.insertMany(appointmentsData);
        console.log(`✅ Seeded ${appts.length} appointments`);

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
};

seedData();
