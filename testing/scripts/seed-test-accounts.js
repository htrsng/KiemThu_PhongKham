// Tạo tài khoản và dữ liệu nền QA trong DB thử nghiệm trên máy cục bộ.
const mongoose = require('../../server/node_modules/mongoose');
const Account = require('../../server/src/models/Account');
const Doctor = require('../../server/src/models/Doctor');
const Patient = require('../../server/src/models/Patient');
const Service = require('../../server/src/models/Service');
async function main() {
  const {
    MONGODB_URI, MONGODB_DB, ADMIN_USER, LOCKED_USER, DOCTOR_USER, RECEPTION_USER,
    ADMIN_PASS, DOCTOR_PASS, RECEPTION_PASS,
  } = process.env;
  const uri = new URL(MONGODB_URI || 'mongodb://invalid');
  if (!['localhost', '127.0.0.1'].includes(uri.hostname) || !MONGODB_DB?.endsWith('_test')) {
    throw new Error('Chỉ được chuẩn bị dữ liệu trên MongoDB cục bộ có tên DB kết thúc bằng _test.');
  }
  if (![ADMIN_USER, LOCKED_USER, DOCTOR_USER, RECEPTION_USER].every((email) => email?.startsWith('qa-') && email.endsWith('@gmail.com')
    ) || ![ADMIN_PASS, DOCTOR_PASS, RECEPTION_PASS].every(Boolean)) {
    throw new Error('Thiếu thông tin tài khoản thử nghiệm sinh bằng prepare-env.js.');
  }
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { licenseNumber: 'QA-DOC-001' },
      {
        licenseNumber: 'QA-DOC-001',
        fullName: 'QA Doctor',
        email: DOCTOR_USER,
        phone: '0900000001',
        specialty: 'Nha khoa tổng quát',
        degree: 'Bác sĩ',
        status: 'active',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await Patient.findOneAndUpdate(
      { patientCode: 'QA-PAT-001' },
      {
        patientCode: 'QA-PAT-001',
        fullName: 'QA Patient',
        phone: '0900000002',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Khác',
        address: 'QA',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await Service.findOneAndUpdate(
      { code: 'QA-SRV-001' },
      {
        code: 'QA-SRV-001',
        name: 'QA Consultation',
        category: 'Khám',
        basePrice: 100000,
        duration: 30,
        status: 'active',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const accounts = [
      [ADMIN_USER, ADMIN_PASS, 'Admin', null, 'QA Admin'],
      [LOCKED_USER, ADMIN_PASS, 'Admin', null, 'QA Locked'],
      [DOCTOR_USER, DOCTOR_PASS, 'Doctor', doctor._id, 'QA Doctor'],
      [RECEPTION_USER, RECEPTION_PASS, 'Reception', null, 'QA Reception'],
    ];
    for (const [email, password, role, referenceId, fullName] of accounts) {
      const account = await Account.findOne({ email }) || new Account({ email });
      Object.assign(account, {
        accountCode: `QA-${email}`,
        username: email,
        fullName,
        password,
        role,
        referenceId,
        status: email === LOCKED_USER ? 'locked' : 'active',
      });
      await account.save();
    }
    console.log('Đã chuẩn bị tài khoản và dữ liệu nền trong DB thử nghiệm.');
  } finally { await mongoose.disconnect(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
