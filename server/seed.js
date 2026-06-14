require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const Account = require('./src/models/Account');
const Doctor = require('./src/models/Doctor');
const Service = require('./src/models/Service');
const PricingPolicy = require('./src/models/PricingPolicy');
const PayrollConfigHistory = require('./src/models/PayrollConfigHistory');
const Holiday = require('./src/models/Holiday');
const WorkShift = require('./src/models/WorkShift');
const Shift = require('./src/models/Shift');
const Patient = require('./src/models/Patient');
const Appointment = require('./src/models/Appointment');
const TreatmentRecord = require('./src/models/TreatmentRecord');
const Invoice = require('./src/models/Invoice');

// Constants for Mock Data
const hoViet = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi'];
const tenViet = ['Văn An', 'Thị Bình', 'Văn Cường', 'Thị Dung', 'Văn Em', 'Thị Phương', 'Văn Hùng', 'Thị Lan', 'Văn Minh', 'Thị Nga', 'Văn Hưng', 'Thị Ngọc', 'Văn Sơn', 'Thị Yến', 'Văn Tùng'];
const chanDoanList = ['Sâu răng số 6', 'Viêm nướu', 'Răng khôn mọc lệch', 'Cao răng', 'Mẻ răng cửa', 'Viêm tủy răng', 'Viêm nha chu', 'Hỏng men răng'];
const specialties = ['Răng tổng quát', 'Chỉnh nha', 'Phẫu thuật hàm mặt', 'Nha khoa trẻ em', 'Cấy ghép Implant'];
const degrees = ['ThacSi', 'PhoGiaoSu', 'GiaoSu', 'DaiHoc', 'TienSi'];

const randomArr = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generatePhone = () => '09' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');

const clearDB = async () => {
  console.log('Clearing database...');
  await Account.deleteMany({});
  await Doctor.deleteMany({});
  await Service.deleteMany({});
  await PricingPolicy.deleteMany({});
  await PayrollConfigHistory.deleteMany({});
  await Holiday.deleteMany({});
  await WorkShift.deleteMany({});
  await Shift.deleteMany({});
  await Patient.deleteMany({});
  await Appointment.deleteMany({});
  await TreatmentRecord.deleteMany({});
  await Invoice.deleteMany({});
  console.log('Database cleared.');
};

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smilecare');
    console.log('Connected to MongoDB');

    await clearDB();

    // 1. WorkShifts (Ca làm việc)
    const shifts = await WorkShift.insertMany([
      { name: 'Ca sáng', startTime: '07:30', endTime: '11:30', maxPatients: 15 },
      { name: 'Ca chiều', startTime: '13:00', endTime: '17:00', maxPatients: 15 },
      { name: 'Ca tối', startTime: '17:30', endTime: '20:30', maxPatients: 10 }
    ]);
    console.log(`Seeded ${shifts.length} WorkShifts.`);

    // 2. Holidays (Ngày nghỉ)
    await Holiday.insertMany([
      { date: new Date('2025-04-30'), name: 'Ngày Giải phóng', type: 'HOLIDAY' },
      { date: new Date('2025-05-01'), name: 'Quốc tế Lao động', type: 'HOLIDAY' },
      { date: new Date('2025-06-02'), name: 'Nghỉ bù', type: 'HOLIDAY' }
    ]);
    console.log(`Seeded Holidays.`);

    // 3. PayrollConfigHistory (Thiết lập UC4)
    await PayrollConfigHistory.create({
      baseHourlyRate: 150000,
      shiftMultipliers: { morning: 1.0, afternoon: 1.0, evening: 1.3, weekend: 1.5, holiday: 2.0 },
      defaultConsultationFee: 100000,
      effectiveDate: new Date('2025-01-01'),
      reason: 'Bảng lương năm 2025'
    });
    console.log(`Seeded PayrollConfigHistory.`);

    // 4. Services (Dịch vụ)
    const baseServices = [
      { code: 'KTQ001', name: 'Khám tổng quát', category: 'Khám', basePrice: 150000, duration: 30, status: 'active' },
      { code: 'NRT002', name: 'Nhổ răng thường', category: 'Điều trị', basePrice: 200000, duration: 45, status: 'active' },
      { code: 'TRC003', name: 'Trám răng composite', category: 'Điều trị', basePrice: 350000, duration: 45, status: 'active' },
      { code: 'XQR004', name: 'Chụp X-Quang răng', category: 'Xét nghiệm', basePrice: 120000, duration: 15, status: 'active' },
      { code: 'LCR005', name: 'Lấy cao răng', category: 'Điều trị', basePrice: 180000, duration: 30, status: 'active' },
      { code: 'TTR006', name: 'Tẩy trắng răng', category: 'Thẩm mỹ', basePrice: 800000, duration: 60, status: 'active' }
    ];
    for (let i = 7; i <= 16; i++) {
      baseServices.push({
        code: `DV${String(i).padStart(3, '0')}`,
        name: `Dịch vụ tự động ${i}`,
        category: randomArr(['Điều trị', 'Thẩm mỹ', 'Phẫu thuật']),
        basePrice: randomInt(1, 10) * 100000,
        duration: randomArr([30, 45, 60]),
        status: 'active'
      });
    }
    const createdServices = await Service.insertMany(baseServices);
    
    // PricingPolicy cho tất cả services
    const pricingPolicies = createdServices.map(svc => ({
      serviceId: svc._id,
      serviceName: svc.name,
      type: 'Niêm yết',
      price: svc.basePrice,
      effectiveDate: new Date('2025-01-01'),
      expiryDate: new Date('2025-12-31')
    }));
    await PricingPolicy.insertMany(pricingPolicies);
    console.log(`Seeded ${createdServices.length} Services and PricingPolicies.`);

    // 5. Doctors
    const baseDoctors = [
      { licenseNumber: 'BS001', fullName: 'BS. Nguyễn Minh Đức', hocVi: 'ThacSi', heSo: 1.5, specialty: 'Răng tổng quát', status: 'active', email: 'bsduc@smilecare.vn', phone: '0901111111' },
      { licenseNumber: 'BS002', fullName: 'PGS. Lê Thị Hoa', hocVi: 'PhoGiaoSu', heSo: 2.0, specialty: 'Chỉnh nha', status: 'active', email: 'bshoa@smilecare.vn', phone: '0902222222' },
      { licenseNumber: 'BS003', fullName: 'GS. Trần Văn Nam', hocVi: 'GiaoSu', heSo: 2.5, specialty: 'Phẫu thuật hàm mặt', status: 'active', email: 'bsnam@smilecare.vn', phone: '0903333333' },
      { licenseNumber: 'BS004', fullName: 'BS. Phạm Lan Anh', hocVi: 'DaiHoc', heSo: 1.3, specialty: 'Răng tổng quát', status: 'inactive', email: 'bsanh@smilecare.vn', phone: '0904444444' }
    ];
    for(let i = 5; i <= 14; i++) {
      baseDoctors.push({
        licenseNumber: `BS${String(i).padStart(3, '0')}`,
        fullName: `BS. ${randomArr(hoViet)} ${randomArr(tenViet)}`,
        hocVi: randomArr(degrees),
        heSo: [1.0, 1.3, 1.5, 2.0][Math.floor(Math.random() * 4)],
        specialty: randomArr(specialties),
        status: 'active',
        email: `bs${i}@smilecare.vn`,
        phone: generatePhone()
      });
    }
    const doctors = await Doctor.insertMany(baseDoctors.map(d => ({
      ...d,
      degree: d.hocVi, // map to schema property
      hourlyRate: 150000 * (d.heSo || 1.0)
    })));
    console.log(`Seeded ${doctors.length} Doctors.`);

    // 6. Accounts (Sequential .save() for bcrypt)
    const accounts = [
      { accountCode: 'A01', username: 'admin', password: 'Admin@123', role: 'Admin', fullName: 'Nguyen Van Admin', email: 'admin@smilecare.vn' },
      { accountCode: 'A02', username: 'letan01', password: 'Letan@123', role: 'Reception', fullName: 'Trần Thị Lễ Tân', email: 'letan01@smilecare.vn' },
      { accountCode: 'A03', username: 'thungan01', password: 'Thungan@123', role: 'Reception', fullName: 'Lê Thu Ngân', email: 'thungan01@smilecare.vn' },
      { accountCode: 'A04', username: 'bacsi01', password: 'Bacsi@123', role: 'Doctor', fullName: 'BS. Nguyễn Minh Đức', email: 'bacsi01@smilecare.vn', referenceId: doctors[0]._id }
    ];
    
    for (let i = 1; i < doctors.length; i++) {
      accounts.push({
        accountCode: `A${String(i+4).padStart(2,'0')}`,
        username: `bacsi${String(i+1).padStart(2,'0')}`,
        email: `bacsi${String(i+1).padStart(2,'0')}@smilecare.vn`,
        password: 'Bacsi@123',
        role: 'Doctor',
        fullName: doctors[i].fullName,
        referenceId: doctors[i]._id
      });
    }

    for (const accData of accounts) {
      const acc = new Account(accData);
      await acc.save();
    }
    console.log(`Seeded ${accounts.length} Accounts with bcrypt.`);

    // 7. Patients
    const basePatients = [
      { patientCode: 'BN001', fullName: 'Nguyễn Văn An', phone: '0901234567', dateOfBirth: new Date('1990-05-15') },
      { patientCode: 'BN002', fullName: 'Trần Thị Bình', phone: '0912345678', dateOfBirth: new Date('1985-03-22') },
      { patientCode: 'BN003', fullName: 'Lê Văn Cường', phone: '0923456789', dateOfBirth: new Date('2000-11-08') },
      { patientCode: 'BN004', fullName: 'Phạm Thị Dung', phone: '0934567890', dateOfBirth: new Date('1995-07-30') },
      { patientCode: 'BN005', fullName: 'Hoàng Văn Em', phone: '0945678901', dateOfBirth: new Date('1978-12-01') }
    ];
    for (let i = 6; i <= 50; i++) {
      basePatients.push({
        patientCode: `BN${String(i).padStart(3, '0')}`,
        fullName: `${randomArr(hoViet)} ${randomArr(tenViet)}`,
        phone: generatePhone(),
        dateOfBirth: new Date(`${randomInt(1960, 2015)}-${String(randomInt(1, 12)).padStart(2, '0')}-15`)
      });
    }
    const patients = await Patient.insertMany(basePatients);
    console.log(`Seeded ${patients.length} Patients.`);

    // 8. Lịch trực (Shifts) - Tháng 6/2025
    const shiftData = [];
    for (let d = 1; d <= 30; d++) {
      const dateStr = `2025-06-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay(); // 0 is Sunday
      
      // BS001: Sáng + Chiều (Thứ 2-6)
      if (d >= 2 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        shiftData.push({ doctorId: doctors[0]._id, doctorName: doctors[0].fullName, date: dateStr, startTime: '07:30', endTime: '11:30', coefficient: 1.0 });
        shiftData.push({ doctorId: doctors[0]._id, doctorName: doctors[0].fullName, date: dateStr, startTime: '13:00', endTime: '17:00', coefficient: 1.0 });
      }
      // BS002: Sáng (Thứ 2, 4, 6)
      if (d >= 2 && [1, 3, 5].includes(dayOfWeek)) {
        shiftData.push({ doctorId: doctors[1]._id, doctorName: doctors[1].fullName, date: dateStr, startTime: '07:30', endTime: '11:30', coefficient: 1.0 });
      }
      // BS003: Chiều + Tối (Thứ 3, 5)
      if (d >= 9 && [2, 4].includes(dayOfWeek)) {
        shiftData.push({ doctorId: doctors[2]._id, doctorName: doctors[2].fullName, date: dateStr, startTime: '13:00', endTime: '17:00', coefficient: 1.0 });
        shiftData.push({ doctorId: doctors[2]._id, doctorName: doctors[2].fullName, date: dateStr, startTime: '17:30', endTime: '20:30', coefficient: 1.3 });
      }
      
      // Cho cac BS random
      for (let i = 4; i < doctors.length; i++) {
        if (Math.random() > 0.5) {
          shiftData.push({ doctorId: doctors[i]._id, doctorName: doctors[i].fullName, date: dateStr, startTime: '07:30', endTime: '11:30', coefficient: 1.0 });
        }
      }
    }
    const createdShifts = await Shift.insertMany(shiftData);
    console.log(`Seeded ${createdShifts.length} Shifts.`);

    // 9. Appointments (Bookings)
    // Create specific base bookings
    const specificBookings = [
      { p: 0, d: 0, date: '2025-06-10T08:00:00Z', shiftStr: '07:30', status: 'Đã đến' },
      { p: 1, d: 1, date: '2025-06-11T09:00:00Z', shiftStr: '07:30', status: 'Đã lên lịch' }, // ChoKham = Đã lên lịch
      { p: 2, d: 0, date: '2025-06-12T14:00:00Z', shiftStr: '13:00', status: 'Đã hoàn thành' }, // DaKham
      { p: 3, d: 2, date: '2025-06-13T15:00:00Z', shiftStr: '13:00', status: 'Đã lên lịch' },
      { p: 4, d: 0, date: '2025-06-14T08:30:00Z', shiftStr: '07:30', status: 'Đã lên lịch' }
    ];
    
    let appointments = [];
    for (const b of specificBookings) {
      appointments.push({
        patientId: patients[b.p]._id, patientName: patients[b.p].fullName,
        doctorId: doctors[b.d]._id, doctorName: doctors[b.d].fullName,
        serviceId: createdServices[0]._id, serviceName: createdServices[0].name,
        startTime: new Date(b.date), endTime: new Date(new Date(b.date).getTime() + 30*60000),
        status: b.status, difficulty: b.status === 'Đã hoàn thành' ? 0.3 : 0
      });
    }

    // Random appointments
    const statusChoices = ['Đã lên lịch', 'Đã đến', 'Đang điều trị', 'Đã hoàn thành', 'Đã hủy'];
    for (let i = 0; i < 100; i++) {
      const shift = randomArr(createdShifts);
      const patient = randomArr(patients);
      const service = randomArr(createdServices);
      
      // 20% appointments fall on "today" to populate dashboard
      let st;
      if (Math.random() < 0.2) {
         const today = new Date();
         today.setHours(parseInt(shift.startTime.split(':')[0]), parseInt(shift.startTime.split(':')[1]), 0, 0);
         st = today;
      } else {
         st = new Date(`${shift.date}T${shift.startTime}:00Z`);
      }

      const stat = randomArr(statusChoices);
      appointments.push({
        patientId: patient._id, patientName: patient.fullName,
        doctorId: shift.doctorId, doctorName: shift.doctorName,
        serviceId: service._id, serviceName: service.name,
        startTime: st, endTime: new Date(st.getTime() + service.duration * 60000),
        status: stat, difficulty: stat === 'Đã hoàn thành' ? (Math.random() * 0.5) : 0
      });
    }
    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`Seeded ${createdAppointments.length} Appointments.`);

    // 10. TreatmentRecords & Invoices (Cho cac ca Da hoan thanh)
    const completedApps = createdAppointments.filter(a => a.status === 'Đã hoàn thành');
    const records = [];
    const invoices = [];
    
    for (const app of completedApps) {
      records.push({
        appointmentId: app._id.toString(),
        patientId: app.patientId.toString(),
        doctorId: app.doctorId.toString(),
        diagnosis: randomArr(chanDoanList),
        treatmentPlan: 'Điều trị theo chuẩn Y khoa',
        status: 'Completed'
      });
      
      const sPrice = createdServices.find(s => s._id.equals(app.serviceId))?.basePrice || 150000;
      invoices.push({
        appointmentId: app._id,
        patientId: app.patientId,
        patientName: app.patientName,
        doctorId: app.doctorId,
        serviceIds: [app.serviceId],
        totalAmount: sPrice,
        finalAmount: sPrice,
        amountPaid: sPrice,
        status: 'Đã thanh toán',
        paymentMethod: 'Tiền mặt'
      });
    }
    await TreatmentRecord.insertMany(records);
    await Invoice.insertMany(invoices);
    console.log(`Seeded ${records.length} TreatmentRecords and Invoices.`);

    // 11. Cập nhật patientCoefficient cho Lịch Trực (Shifts)
    for (const shift of createdShifts) {
      const shiftDateStr = shift.date;
      const relatedApps = createdAppointments.filter(a => 
        a.doctorId.equals(shift.doctorId) && 
        a.status === 'Đã hoàn thành' &&
        a.startTime.toISOString().startsWith(shiftDateStr)
      );
      if (relatedApps.length > 0) {
        const totalDiff = relatedApps.reduce((sum, a) => sum + (a.difficulty || 0), 0);
        await Shift.findByIdAndUpdate(shift._id, { patientCoefficient: parseFloat(totalDiff.toFixed(2)) });
      }
    }
    console.log(`Updated patientCoefficient for Shifts based on completed appointments.`);

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

runSeed();
