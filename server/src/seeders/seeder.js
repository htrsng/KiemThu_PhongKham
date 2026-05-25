const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Load models
const Account = require('../models/Account');
const RolePermission = require('../models/RolePermission');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Material = require('../models/Material');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const InventoryLog = require('../models/InventoryLog');
const Holiday = require('../models/Holiday');
const WorkShift = require('../models/WorkShift');
const Shift = require('../models/Shift');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB || 'smilecare',
});

// Helper functions for random data
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => '09' + Math.floor(10000000 + Math.random() * 90000000).toString();

const firstNames = ['Anh', 'Bình', 'Cường', 'Dũng', 'Em', 'Phương', 'Giang', 'Hải', 'Linh', 'Mai', 'Ngọc', 'Oanh', 'Phong', 'Quân', 'Trang', 'Tuấn', 'Uyên', 'Vân', 'Xuân', 'Yến'];
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const specialties = ['Khám tổng quát', 'Nha chu', 'Phục hình răng', 'Niềng răng', 'Nha khoa trẻ em', 'Phẫu thuật hàm mặt'];
const degrees = ['Bác sĩ', 'Thạc sĩ', 'Tiến sĩ', 'Bác sĩ CK I', 'Bác sĩ CK II'];

const seedData = async () => {
  try {
    console.log('Clearing old data...');
    await Account.deleteMany();
    await RolePermission.deleteMany();
    await Doctor.deleteMany();
    await Patient.deleteMany();
    await Service.deleteMany();
    await Material.deleteMany();
    await Appointment.deleteMany();
    await Invoice.deleteMany();
    await InventoryLog.deleteMany();
    await Holiday.deleteMany();
    await WorkShift.deleteMany();
    await Shift.deleteMany();

    // 0. Holidays (2026)
    console.log('Generating Holidays...');
    const holidays = await Holiday.insertMany([
      { date: new Date('2026-01-01'), name: 'Tết Dương Lịch' },
      { date: new Date('2026-02-17'), name: 'Tết Nguyên Đán (Mùng 1)' },
      { date: new Date('2026-02-18'), name: 'Tết Nguyên Đán (Mùng 2)' },
      { date: new Date('2026-02-19'), name: 'Tết Nguyên Đán (Mùng 3)' },
      { date: new Date('2026-04-26'), name: 'Giỗ tổ Hùng Vương' },
      { date: new Date('2026-04-30'), name: 'Giải phóng miền Nam' },
      { date: new Date('2026-05-01'), name: 'Quốc tế lao động' },
      { date: new Date('2026-09-02'), name: 'Quốc khánh' },
    ]);

    console.log('Generating Work Shifts...');
    const workShifts = await WorkShift.insertMany([
      { name: 'Ca sáng', startTime: '08:00', endTime: '12:00' },
      { name: 'Ca chiều', startTime: '13:00', endTime: '17:00' },
      { name: 'Ca tối', startTime: '17:30', endTime: '20:30' }
    ]);

    // 1. Role Permissions
    await RolePermission.create([
      { role: 'Admin', permissions: { 'Dashboard': { 'View': true } } },
      { role: 'Doctor', permissions: { 'Dashboard': { 'View': true } } },
      { role: 'Reception', permissions: { 'Dashboard': { 'View': true } } }
    ]);

    // 2. Admin & Reception Accounts
    await Account.create({
      accountCode: 'ACC-001', fullName: 'System Admin', username: 'admin', email: 'admin@gmail.com', password: 'admin123', role: 'Admin', status: 'active'
    });
    const receptionAccount = await Account.create({
      accountCode: 'ACC-002', fullName: 'Lễ tân Ngọc Mai', username: 'reception', email: 'reception@gmail.com', password: 'admin123', role: 'Reception', status: 'active'
    });

    // 3. Generate 10 Doctors
    console.log('Generating 10 Doctors...');
    const doctorsData = [];
    for (let i = 1; i <= 10; i++) {
      const name = `${getRandomItem(lastNames)} ${getRandomItem(firstNames)}`;
      doctorsData.push({
        doctorCode: `DOC-${String(i).padStart(3, '0')}`,
        fullName: `Dr. ${name}`,
        specialty: getRandomItem(specialties),
        degree: getRandomItem(degrees),
        experienceYears: getRandomInt(2, 20),
        room: `Phòng 1${String(i).padStart(2, '0')}`,
        status: 'active',
        consultationFee: getRandomInt(1, 5) * 50000,
        hourlyRate: getRandomInt(10, 30) * 10000,
        serviceCommissionRate: getRandomInt(5, 20) / 100
      });
    }
    const doctors = await Doctor.insertMany(doctorsData);

    // Create accounts for doctors
    for (let i = 0; i < doctors.length; i++) {
        await Account.create({
            accountCode: `ACC-${String(i + 3).padStart(3, '0')}`,
            fullName: doctors[i].fullName,
            username: `doctor${i+1}`,
            email: `doctor${i+1}@gmail.com`,
            password: 'admin123',
            role: 'Doctor',
            referenceId: doctors[i]._id,
            status: 'active'
        });
    }

    // 4. Generate Services
    const services = await Service.insertMany([
      { serviceCode: 'SRV-001', name: 'Khám tổng quát', category: 'Khám bệnh', basePrice: 100000, duration: 30 },
      { serviceCode: 'SRV-002', name: 'Nhổ răng khôn', category: 'Tiểu phẫu', basePrice: 1500000, duration: 60 },
      { serviceCode: 'SRV-003', name: 'Trám răng thẩm mỹ', category: 'Phục hình', basePrice: 300000, duration: 45 },
      { serviceCode: 'SRV-004', name: 'Tẩy trắng răng', category: 'Thẩm mỹ', basePrice: 2000000, duration: 90 },
      { serviceCode: 'SRV-005', name: 'Cạo vôi răng', category: 'Vệ sinh', basePrice: 150000, duration: 30 },
      { serviceCode: 'SRV-006', name: 'Nhổ răng sữa', category: 'Nha khoa trẻ em', basePrice: 50000, duration: 20 },
      { serviceCode: 'SRV-007', name: 'Điều trị tủy', category: 'Chữa tủy', basePrice: 800000, duration: 60 },
      { serviceCode: 'SRV-008', name: 'Cắm Implant', category: 'Phục hình', basePrice: 15000000, duration: 120 }
    ]);

    // 5. Generate Materials
    const materials = await Material.insertMany([
      { materialCode: 'MAT-001', name: 'Composite 3M', unit: 'Tuýp', quantity: 500, minQuantity: 50, costPrice: 350000 },
      { materialCode: 'MAT-002', name: 'Thuốc tê Lidocaine', unit: 'Ống', quantity: 1000, minQuantity: 100, costPrice: 25000 },
      { materialCode: 'MAT-003', name: 'Gutta Percha (Côn)', unit: 'Hộp', quantity: 200, minQuantity: 20, costPrice: 150000 },
      { materialCode: 'MAT-004', name: 'Găng tay y tế', unit: 'Hộp', quantity: 500, minQuantity: 50, costPrice: 80000 },
      { materialCode: 'MAT-005', name: 'Trụ Implant Hàn Quốc', unit: 'Trụ', quantity: 30, minQuantity: 5, costPrice: 4000000 },
      { materialCode: 'MAT-006', name: 'Thuốc tẩy trắng Pola', unit: 'Ống', quantity: 100, minQuantity: 15, costPrice: 500000 }
    ]);

    // 6. Generate 30 Patients
    console.log('Generating 30 Patients...');
    const patientsData = [];
    for (let i = 1; i <= 30; i++) {
      const isMale = Math.random() > 0.5;
      const name = `${getRandomItem(lastNames)} ${getRandomItem(firstNames)}`;
      patientsData.push({
        patientCode: `PAT-${String(i).padStart(3, '0')}`,
        fullName: name,
        phone: randomPhone(),
        dateOfBirth: new Date(getRandomInt(1960, 2015), getRandomInt(0, 11), getRandomInt(1, 28)),
        gender: isMale ? 'Nam' : 'Nữ',
        address: `${getRandomInt(1, 999)} ${getRandomItem(['Trần Hưng Đạo', 'Lê Lợi', 'Nguyễn Trãi', 'Hai Bà Trưng'])}, TP.HCM`,
        allergies: Math.random() > 0.8 ? [getRandomItem(['Penicillin', 'Hải sản', 'Thuốc tê', 'Lidocaine'])] : []
      });
    }
    const patients = await Patient.insertMany(patientsData);

    // 7. Generate 50 Appointments
    console.log('Generating 50 Appointments...');
    const appointmentsData = [];
    const statuses = ['Đã hoàn thành', 'Đã hoàn thành', 'Đã hoàn thành', 'Đã đến', 'Đang điều trị', 'Đã lên lịch', 'Đã hủy'];
    
    for (let i = 1; i <= 50; i++) {
      const patient = getRandomItem(patients);
      const doctor = getRandomItem(doctors);
      const service = getRandomItem(services);
      
      // Random date between -7 days and +7 days
      const daysOffset = getRandomInt(-7, 7);
      const aptDate = new Date();
      aptDate.setDate(aptDate.getDate() + daysOffset);
      
      // Random hour between 8:00 and 18:00
      const startHour = getRandomInt(8, 17);
      const startMin = Math.random() > 0.5 ? 0 : 30;
      
      const startTime = new Date(aptDate);
      startTime.setHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);

      // Determine logical status based on date
      let status = getRandomItem(statuses);
      if (daysOffset < 0 && status !== 'Đã hủy') status = 'Đã hoàn thành'; // Past appts must be completed or cancelled
      if (daysOffset > 0) status = 'Đã lên lịch'; // Future appts must be scheduled

      appointmentsData.push({
        patientId: patient._id,
        patientName: patient.fullName,
        doctorId: doctor._id,
        doctorName: doctor.fullName,
        serviceId: service._id,
        serviceName: service.name,
        startTime,
        endTime,
        status,
        notes: Math.random() > 0.7 ? 'Khách hàng VIP / Khách quen' : '',
        checkInTime: status !== 'Đã lên lịch' && status !== 'Đã hủy' ? startTime : null
      });
    }
    
    const appointments = await Appointment.insertMany(appointmentsData);

    // 8. Generate Invoices & Inventory Logs for 'Đã hoàn thành' appointments
    console.log('Generating Invoices for completed appointments...');
    for (const apt of appointments) {
        if (apt.status === 'Đã hoàn thành') {
            const service = services.find(s => s._id.toString() === apt.serviceId.toString());
            
            // Create Invoice
            await Invoice.create({
                appointmentId: apt._id,
                patientId: apt.patientId,
                patientName: apt.patientName,
                doctorId: apt.doctorId,
                serviceIds: [apt.serviceId],
                totalAmount: service.basePrice,
                finalAmount: service.basePrice * (Math.random() > 0.8 ? 0.9 : 1), // Sometimes 10% discount
                status: 'Đã thanh toán',
                createdAt: apt.endTime // Invoice created after appointment
            });

            // Random Material usage
            if (Math.random() > 0.5) {
                const mat = getRandomItem(materials);
                const qty = getRandomInt(1, 3);
                await InventoryLog.create({
                    materialId: mat._id,
                    action: 'export',
                    quantity: qty,
                    reference: apt._id.toString(),
                    notes: `Dùng cho ca khám ${apt.serviceName}`,
                    performedBy: receptionAccount._id,
                    createdAt: apt.endTime
                });
                
                // Deduct from material collection (mock logic here isn't strictly necessary since it's just seeder, but good for consistency)
                await Material.findByIdAndUpdate(mat._id, { $inc: { quantity: -qty } });
            }
        }
    }

    // 9. Generate Doctor Shifts
    console.log('Generating Doctor Shifts...');
    const shiftsData = [];
    // Just generate shifts for the next 7 days for doctors
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const shiftDate = new Date(today);
        shiftDate.setDate(today.getDate() + i);
        const dateStr = shiftDate.toISOString().split('T')[0];
        
        // Pick 2-4 random doctors for this day
        const numDocs = getRandomInt(2, 4);
        const docsForDay = [];
        for (let j = 0; j < numDocs; j++) {
            docsForDay.push(getRandomItem(doctors));
        }

        for (const doc of docsForDay) {
            const shiftType = getRandomItem(workShifts);
            shiftsData.push({
                doctorId: doc._id,
                doctorName: doc.fullName,
                date: dateStr,
                startTime: shiftType.startTime,
                endTime: shiftType.endTime,
                status: 'Đã đăng ký'
            });
        }
    }
    await Shift.insertMany(shiftsData);

    console.log('-------------------------------------------');
    console.log('✅ HUGE Mock Data Generated Successfully!');
    console.log(`- Doctors: ${doctors.length}`);
    console.log(`- Patients: ${patients.length}`);
    console.log(`- Services: ${services.length}`);
    console.log(`- Appointments: ${appointments.length}`);
    console.log('-------------------------------------------');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
