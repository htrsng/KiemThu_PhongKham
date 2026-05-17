require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = Number(process.env.PORT || 5000);
const DATABASE_NAME = process.env.MONGODB_DB || 'smilecare';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing env var: MONGODB_URI');
  process.exit(1);
}

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));

const mongoClient = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});

const collections = new Map();const toISO = (date) => date.toISOString();
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// --- SEED DATA GENERATION ---

// 1. Doctors
const seedDoctors = [
  { _id: new ObjectId("6650a4e6e4a3b18f8a5a4b10"), doctorCode: 'DOC-001', fullName: 'Dr. Nguyễn Quang Huy', specialty: 'Implant', degree: 'Thạc sĩ RHM', experienceYears: 12, room: 'Phòng 201', status: 'active', consultationFee: 300000, hourlyRate: 150000, serviceCommissionRate: 15, schedule: {
    T2: { enabled: true, startTime: '08:00', endTime: '17:00' }, T3: { enabled: true, startTime: '08:00', endTime: '17:00' }, T4: { enabled: true, startTime: '08:00', endTime: '17:00' },
    T5: { enabled: true, startTime: '08:00', endTime: '17:00' }, T6: { enabled: true, startTime: '08:00', endTime: '17:00' }, T7: { enabled: false, startTime: '09:00', endTime: '16:00' },
    CN: { enabled: false, startTime: '09:00', endTime: '12:00' },
  }},
  { _id: new ObjectId("6650a4e6e4a3b18f8a5a4b11"), doctorCode: 'DOC-002', fullName: 'Dr. Trần Minh Anh', specialty: 'Niềng răng', degree: 'Bác sĩ CKI', experienceYears: 8, room: 'Phòng 202', status: 'active', consultationFee: 250000, hourlyRate: 120000, serviceCommissionRate: 12, schedule: {
    T2: { enabled: true, startTime: '08:00', endTime: '12:00' }, T3: { enabled: false, startTime: '08:00', endTime: '17:00' }, T4: { enabled: true, startTime: '13:00', endTime: '17:00' },
    T5: { enabled: true, startTime: '08:00', endTime: '17:00' }, T6: { enabled: false, startTime: '08:00', endTime: '17:00' }, T7: { enabled: true, startTime: '09:00', endTime: '16:00' },
    CN: { enabled: false, startTime: '09:00', endTime: '12:00' },
  }},
  { _id: new ObjectId("6650a4e6e4a3b18f8a5a4b12"), doctorCode: 'DOC-003', fullName: 'Dr. Lê Thị Hồng', specialty: 'Nha khoa tổng quát', degree: 'Bác sĩ', experienceYears: 5, room: 'Phòng 101', status: 'active', consultationFee: 200000, hourlyRate: 100000, serviceCommissionRate: 10, schedule: {
    T2: { enabled: true, startTime: '08:00', endTime: '17:00' }, T3: { enabled: true, startTime: '08:00', endTime: '17:00' }, T4: { enabled: false, startTime: '08:00', endTime: '17:00' },
    T5: { enabled: true, startTime: '08:00', endTime: '17:00' }, T6: { enabled: true, startTime: '08:00', endTime: '17:00' }, T7: { enabled: true, startTime: '09:00', endTime: '12:00' },
    CN: { enabled: false, startTime: '09:00', endTime: '12:00' },
  }},
  { _id: new ObjectId("6650a4e6e4a3b18f8a5a4b13"), doctorCode: 'DOC-004', fullName: 'Dr. Phạm Văn Tuấn', specialty: 'Nhổ răng', degree: 'Bác sĩ', experienceYears: 10, room: 'Phòng 301', status: 'inactive', consultationFee: 200000, hourlyRate: 100000, serviceCommissionRate: 10, schedule: {
    T2: { enabled: false, startTime: '08:00', endTime: '17:00' }, T3: { enabled: false, startTime: '08:00', endTime: '17:00' }, T4: { enabled: false, startTime: '08:00', endTime: '17:00' },
    T5: { enabled: false, startTime: '08:00', endTime: '17:00' }, T6: { enabled: false, startTime: '08:00', endTime: '17:00' }, T7: { enabled: false, startTime: '09:00', endTime: '16:00' },
    CN: { enabled: false, startTime: '09:00', endTime: '12:00' },
  }},
];

// 2. Accounts (Admin, Doctors, Receptionists)
const seedAccounts = [
  { accountCode: 'ACC-001', fullName: 'System Admin', username: 'admin', email: 'admin@gmail.com', password: 'adminpassword', role: 'Admin', status: 'active', lastLoginAt: toISO(new Date()) },
  { accountCode: 'ACC-002', fullName: 'Dr. Nguyễn Quang Huy', username: 'huy.nguyen', email: 'huy.nguyen@gmail.com', password: 'password123', role: 'Doctor', status: 'active', referenceId: "6650a4e6e4a3b18f8a5a4b10", lastLoginAt: toISO(new Date(today.getTime() - 1 * 24 * 3600 * 1000)) },
  { accountCode: 'ACC-003', fullName: 'Dr. Trần Minh Anh', username: 'anh.tran', email: 'anh.tran@gmail.com', password: 'password123', role: 'Doctor', status: 'active', referenceId: "6650a4e6e4a3b18f8a5a4b11", lastLoginAt: toISO(new Date(today.getTime() - 2 * 24 * 3600 * 1000)) },
  { accountCode: 'ACC-004', fullName: 'Dr. Lê Thị Hồng', username: 'hong.le', email: 'hong.le@gmail.com', password: 'password123', role: 'Doctor', status: 'active', referenceId: "6650a4e6e4a3b18f8a5a4b12", lastLoginAt: toISO(new Date(today.getTime() - 3 * 24 * 3600 * 1000)) },
  { accountCode: 'ACC-005', fullName: 'Lê Thị Mai', username: 'mai.le', email: 'mai.le@gmail.com', password: 'password123', role: 'Reception', status: 'active', lastLoginAt: toISO(new Date(today.getTime() - 1 * 3600 * 1000)) },
  { accountCode: 'ACC-006', fullName: 'Trần Văn Hùng', username: 'hung.tran', email: 'hung.tran@gmail.com', password: 'password123', role: 'Reception', status: 'Bi khoa' },
];

// 3. Services
const seedServices = [
  { _id: new ObjectId("6650a5bde4a3b18f8a5a4b20"), serviceCode: 'SV-001', name: 'Khám tổng quát', category: 'Khám', basePrice: 200000, duration: 20, status: 'active' },
  { _id: new ObjectId("6650a5bde4a3b18f8a5a4b21"), serviceCode: 'SV-002', name: 'Cắm Implant Hàn Quốc', category: 'Phẫu thuật', basePrice: 15000000, duration: 90, status: 'active' },
  { _id: new ObjectId("6650a5bde4a3b18f8a5a4b22"), serviceCode: 'SV-003', name: 'Niềng răng mắc cài kim loại', category: 'Chỉnh nha', basePrice: 30000000, duration: 60, status: 'active' },
  { _id: new ObjectId("6650a5bde4a3b18f8a5a4b23"), serviceCode: 'SV-004', name: 'Tẩy trắng răng', category: 'Thẩm mỹ', basePrice: 2500000, duration: 60, status: 'active' },
  { _id: new ObjectId("6650a5bde4a3b18f8a5a4b24"), serviceCode: 'SV-005', name: 'Nhổ răng khôn', category: 'Phẫu thuật', basePrice: 1500000, duration: 45, status: 'active' },
  { _id: new ObjectId("6650a5bde4a3b18f8a5a4b25"), serviceCode: 'SV-006', name: 'Lấy cao răng', category: 'Vệ sinh', basePrice: 300000, duration: 30, status: 'inactive' },
];

// 4. Shifts (for active doctors)
const seedShifts = [];
const activeDoctors = seedDoctors.filter(d => d.status === 'active');
const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
for (let day = 1; day <= daysInCurrentMonth; day++) {
    activeDoctors.forEach((doctor, index) => {
        if ((day + index) % 3 !== 0) { // Not every doctor works every day
            const date = new Date(now.getFullYear(), now.getMonth(), day);
            seedShifts.push({ doctorId: doctor._id.toString(), doctorName: doctor.fullName, date: date.toISOString().slice(0, 10), startTime: '08:00', endTime: '17:00' });
        }
    });
}

// 5. Appointments
const seedAppointments = [];
const appointmentStatuses = ['Đã hoàn thành', 'Đã lên lịch', 'Đã hủy'];
const patientNames = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Cường', 'Phạm Thuỳ Dung', 'Hoàng Văn Em'];
for (let i = 0; i < 50; i++) {
    const doctor = activeDoctors[i % activeDoctors.length];
    const service = seedServices.filter(s => s.status === 'active')[i % seedServices.filter(s => s.status === 'active').length];
    const status = appointmentStatuses[i % appointmentStatuses.length];
    const dayOffset = i - 25; // Appointments from last month to next month
    const startTime = new Date(today.getTime() + dayOffset * 24 * 3600 * 1000);
    startTime.setHours(9 + (i % 8), (i % 2) * 30, 0, 0); // 9:00 - 16:30
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    seedAppointments.push({
        patientId: `PAT-0${i % 5 + 1}`,
        patientName: patientNames[i % patientNames.length],
        doctorId: doctor._id.toString(),
        doctorName: doctor.fullName,
        serviceId: service._id.toString(),
        serviceName: service.name,
        startTime: toISO(startTime),
        endTime: toISO(endTime),
        status: status,
        notes: status === 'Đã hủy' ? 'Bệnh nhân báo bận' : (i % 4 === 0 ? 'Bệnh nhân có tiền sử dị ứng' : ''),
    });
}

// 6. Patients
const seedPatients = [];
const patientLastNames = ['Lê', 'Phan', 'Đỗ', 'Bùi', 'Đinh', 'Hồ'];
const patientFirstNames = ['Quỳnh Anh', 'Gia Bảo', 'Minh Khang', 'Tuệ Nhi', 'Đức Huy', 'Phương Mai'];
const genders = ['Nam', 'Nữ', 'Khác'];
const cities = ['Hà Nội', 'Đà Nẵng', 'TP.HCM', 'Cần Thơ', 'Hải Phòng'];

for (let i = 0; i < 30; i++) {
    const fullName = `${patientLastNames[i % patientLastNames.length]} ${patientFirstNames[i % patientFirstNames.length]}`;
    const birthYear = new Date().getFullYear() - (Math.floor(Math.random() * 60) + 5);
    const createdAt = new Date(today.getTime() - Math.floor(Math.random() * 365) * 24 * 3600 * 1000);

    seedPatients.push({
        fullName,
        phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        dateOfBirth: new Date(birthYear, i % 12, (i % 28) + 1).toISOString(),
        gender: genders[i % genders.length],
        address: `${i + 1} Đường ABC, ${cities[i % cities.length]}`,
        createdAt: createdAt.toISOString(),
    });
}

// 7. Work Shifts
const seedWorkShifts = [
  { name: 'Ca sáng', startTime: '08:00', endTime: '12:00' },
  { name: 'Ca chiều', startTime: '13:00', endTime: '17:00' },
  { name: 'Ca tối', startTime: '17:00', endTime: '20:00' },
  { name: 'Cả ngày', startTime: '08:00', endTime: '17:00' },
];

// 8. Holidays
const seedHolidays = [
    { name: 'Tết Dương Lịch', date: `${now.getFullYear()}-01-01`, isRecurring: true },
    { name: 'Giỗ Tổ Hùng Vương', date: `${now.getFullYear()}-04-18`, isRecurring: false }, // Example date, changes yearly
    { name: 'Ngày Thống nhất', date: `${now.getFullYear()}-04-30`, isRecurring: true },
    { name: 'Quốc tế Lao động', date: `${now.getFullYear()}-05-01`, isRecurring: true },
    { name: 'Quốc Khánh', date: `${now.getFullYear()}-09-02`, isRecurring: true },
];

// 9. Audit Logs
const seedAuditLogs = [];
const auditActions = ['Đăng nhập', 'Tạo tài khoản', 'Sửa tài khoản', 'Khóa tài khoản'];
const auditResults = ['Thành công', 'Thất bại'];
for (let i = 0; i < 20; i++) {
    const account = seedAccounts[i % seedAccounts.length];
    seedAuditLogs.push({
        timestamp: new Date(today.getTime() - i * 3 * 3600 * 1000).toISOString(),
        account: account.fullName,
        action: auditActions[i % auditActions.length],
        ipAddress: `192.168.1.${i + 10}`,
        result: auditResults[i % auditResults.length],
    });
}

const resourceConfigs = [
  { path: '/api/accounts', collectionName: 'accounts', seed: seedAccounts },
  { path: '/api/doctors', collectionName: 'doctors', seed: seedDoctors },
  { path: '/api/services', collectionName: 'services', seed: seedServices },
  { path: '/api/shifts', collectionName: 'shifts', seed: seedShifts },
  { path: '/api/appointments', collectionName: 'appointments', seed: seedAppointments },
  { path: '/api/patients', collectionName: 'patients', seed: seedPatients },
  { path: '/api/work-shifts', collectionName: 'work_shifts', seed: seedWorkShifts },
  { path: '/api/holidays', collectionName: 'holidays', seed: seedHolidays },
  { path: '/api/audit-logs', collectionName: 'audit_logs', seed: seedAuditLogs },
  {
    path: '/api/roles',
    collectionName: 'roles',
    seed: [
      { roleCode: 'ROLE_ADMIN', roleName: 'Quan tri he thong', description: 'Toan quyen quan ly du lieu va cau hinh', scope: 'global', status: 'active' },
      { roleCode: 'ROLE_DOCTOR', roleName: 'Bac si', description: 'Quan ly kham, dieu tri va phac do lam sang', scope: 'clinical', status: 'active' },
      { roleCode: 'ROLE_RECEPTION', roleName: 'Le tan', description: 'Quan ly lich hen, tiep don benh nhan', scope: 'front-desk', status: 'active' }
    ]
  },
  {
    path: '/api/permissions',
    collectionName: 'permissions',
    seed: [
      { moduleCode: 'dashboard', moduleName: 'Bang dieu khien', actions: ['view'], description: 'Tong hop KPI, lich lam viec va canh bao he thong', status: 'active' },
      { moduleCode: 'accounts', moduleName: 'Quan ly tai khoan', actions: ['view', 'create', 'edit', 'delete'], description: 'Quan ly tai khoan nguoi dung he thong', status: 'active' }
    ]
  },
  {
    path: '/api/service-categories',
    collectionName: 'service_categories',
    seed: [
      { categoryCode: 'EXAM', name: 'Khám & Tư vấn', status: 'active', priority: 1 },
      { categoryCode: 'TREATMENT', name: 'Điều trị', status: 'active', priority: 2 },
      { categoryCode: 'SURGERY', name: 'Phẫu thuật', status: 'active', priority: 3 },
      { categoryCode: 'COSMETIC', name: 'Thẩm mỹ', status: 'active', priority: 4 },
      { categoryCode: 'HYGIENE', name: 'Vệ sinh', status: 'active', priority: 5 },
    ]
  },
  { path: '/api/pricing-policies', collectionName: 'pricing_policies', seed: [] },
  {
    path: '/api/settings',
    collectionName: 'settings',
    seed: [
      {
        settingCode: 'clinic.profile',
        group: 'clinic',
        name: 'Ho so phong kham',
        value: { clinicName: 'SmileCare Dental Clinic', hotline: '19001234', address: '123 Nguyen Trai, Quan 1, TP.HCM', email: 'contact@smilecare.vn', currency: 'VND' },
        status: 'active'
      },
      {
        settingCode: 'clinic.hours',
        group: 'clinic',
        name: 'Gio lam viec',
        value: {
          weekdays: '08:00-20:00',
          saturday: '08:00-17:00',
          sunday: '08:00-12:00',
        },
        status: 'active'
      }
    ]
  }
];

function getCollection(collectionName) {
  const collection = collections.get(collectionName);
  if (!collection) throw new Error(`Collection not initialized: ${collectionName}`);
  return collection;
}

function toPublicDocument(document) {
  if (!document) return null;
  const { _id, ...rest } = document;
  return {
    id: _id.toString(),
    _id: _id.toString(),
    ...rest
  };
}

function toPublicDocuments(documents) {
  return documents.map(toPublicDocument);
}

function parseOptionalInteger(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function buildFilter(query) {
  const filter = {};
  for (const [key, value] of Object.entries(query)) {
    if (['limit', 'skip', 'sort'].includes(key)) continue;
    filter[key] = value;
  }
  return filter;
}

function sanitizeBody(body) {
  const copy = { ...body };
  delete copy._id;
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy;
}

async function seedCollection(collection, seed) {
  if (!seed || seed.length === 0) return;
  const count = await collection.countDocuments();
  if (count > 0) return;

  const now = new Date().toISOString();
  await collection.insertMany(seed.map((doc) => ({
    ...doc,
    createdAt: now,
    updatedAt: now,
  })));
}

async function initializeDatabase() {
  await mongoClient.connect();

  const db = mongoClient.db(DATABASE_NAME);
  for (const resourceConfig of resourceConfigs) {
    const collection = db.collection(resourceConfig.collectionName);
    collections.set(resourceConfig.collectionName, collection);
    await seedCollection(collection, resourceConfig.seed);
    await collection.createIndex({ updatedAt: -1 });
  }
}

function registerResourceRoutes(resourceConfig) {
  const getCol = () => getCollection(resourceConfig.collectionName);

  app.get(resourceConfig.path, async (req, res, next) => {
    try {
      const filter = buildFilter(req.query);
      const limit = parseOptionalInteger(req.query.limit, 100);
      const skip = parseOptionalInteger(req.query.skip, 0);
      const rawSort = req.query.sort ? String(req.query.sort) : '-updatedAt';
      const sortKey = rawSort.startsWith('-') ? rawSort.slice(1) : rawSort;
      const sortDir = rawSort.startsWith('-') ? -1 : 1;
      const sort = { [sortKey]: sortDir };

      const cursor = getCol().find(filter).sort(sort).skip(skip).limit(limit);
      const documents = await cursor.toArray();
      const total = await getCol().countDocuments(filter);
      res.json({ data: toPublicDocuments(documents), total });
    } catch (error) {
      next(error);
    }
  });

  app.post(resourceConfig.path, async (req, res, next) => {
    try {
      const now = new Date().toISOString();
      const payload = sanitizeBody(req.body);
      const result = await getCol().insertOne({
        ...payload,
        createdAt: now,
        updatedAt: now,
      });

      const inserted = await getCol().findOne({ _id: result.insertedId });
      res.status(201).json({ data: toPublicDocument(inserted) });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${resourceConfig.path}/:id`, async (req, res, next) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid document id.' });
      }

      const doc = await getCol().findOne({ _id: new ObjectId(req.params.id) });
      if (!doc) return res.status(404).json({ error: 'Document not found.' });
      return res.json({ data: toPublicDocument(doc) });
    } catch (error) {
      next(error);
    }
  });

  app.put(`${resourceConfig.path}/:id`, async (req, res, next) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid document id.' });
      }

      const payload = sanitizeBody(req.body);
      const result = await getCol().updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { ...payload, updatedAt: new Date().toISOString() } }
      );

      if (result.matchedCount === 0) return res.status(404).json({ error: 'Document not found.' });
      const updated = await getCol().findOne({ _id: new ObjectId(req.params.id) });
      return res.json({ data: toPublicDocument(updated) });
    } catch (error) {
      next(error);
    }
  });

  app.patch(`${resourceConfig.path}/:id`, async (req, res, next) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid document id.' });
      }

      const payload = sanitizeBody(req.body);
      const result = await getCol().updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { ...payload, updatedAt: new Date().toISOString() } }
      );

      if (result.matchedCount === 0) return res.status(404).json({ error: 'Document not found.' });
      const updated = await getCol().findOne({ _id: new ObjectId(req.params.id) });
      return res.json({ data: toPublicDocument(updated) });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${resourceConfig.path}/:id`, async (req, res, next) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid document id.' });
      }

      const result = await getCol().deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Document not found.' });
      return res.json({ deletedCount: result.deletedCount });
    } catch (error) {
      next(error);
    }
  });
}

function registerAuthRoutes() {
  const accounts = getCollection('accounts');
  const doctors = getCollection('doctors');

  // Login
  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      // Yêu cầu: tên đăng nhập phải có đuôi @gmail.com
      if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'invalid_email_format', message: 'Tên đăng nhập phải có đuôi @gmail.com.' });
      }

      const account = await accounts.findOne({ email: email.toLowerCase() });

      if (!account) {
        return res.status(404).json({ error: 'not_found', message: 'Account not found.' });
      }
      // LƯU Ý: Trong ứng dụng thực tế, mật khẩu phải được hash và so sánh bằng bcrypt
      if (account.password !== password) {
        return res.status(401).json({ error: 'wrong_password', message: 'Invalid credentials.' });
      }
      if (account.status !== 'active') {
        return res.status(403).json({ error: 'locked', message: 'Account is locked.' });
      }

      const publicAccount = toPublicDocument(account);
      delete publicAccount.password;

      // LƯU Ý: Đây là token giả lập, chỉ dùng cho mục đích demo.
      // Trong ứng dụng thực tế, hãy sử dụng thư viện như 'jsonwebtoken'.
      const token = publicAccount.id;

      res.json({ token, account: publicAccount });
    } catch (error) {
      next(error);
    }
  });

  // Register
  app.post('/api/auth/register', async (req, res, next) => {
    try {
        const { email, password, fullName, role } = req.body;
        if (!email || !password || !fullName || !role) {
            return res.status(400).json({ error: 'Missing required fields for registration.' });
        }

        // Yêu cầu: email đăng ký phải có đuôi @gmail.com
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            return res.status(400).json({ error: 'invalid_email_format', message: 'Email đăng ký phải là địa chỉ @gmail.com.' });
        }

        const existingAccount = await accounts.findOne({ email: email.toLowerCase() });
        if (existingAccount) {
            return res.status(409).json({ error: 'email_exists', message: 'An account with this email already exists.' });
        }

        let newDoctorId = null;
        if (role === 'Doctor') {
            const doctorCount = await doctors.countDocuments();
            const newDoctor = {
                fullName,
                email,
                doctorCode: `DOC-${String(doctorCount + 1).padStart(3, '0')}`,
                licenseNumber: 'BS-00000', // Giá trị mặc định
                phone: 'Chưa cập nhật', // Giá trị mặc định
                specialty: 'Nha khoa tổng quát',
                degree: 'Bác sĩ',
                experience: 0,
                room: 'Chưa xếp',
                consultationFee: 0,
                status: 'inactive', // Bác sĩ mới cần được admin kích hoạt
                schedule: { T2: { enabled: false, startTime: '08:00', endTime: '17:00' }, T3: { enabled: false, startTime: '08:00', endTime: '17:00' }, T4: { enabled: false, startTime: '08:00', endTime: '17:00' }, T5: { enabled: false, startTime: '08:00', endTime: '17:00' }, T6: { enabled: false, startTime: '08:00', endTime: '17:00' }, T7: { enabled: false, startTime: '09:00', endTime: '16:00' }, CN: { enabled: false, startTime: '09:00', endTime: '12:00' } },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const doctorResult = await doctors.insertOne(newDoctor);
            newDoctorId = doctorResult.insertedId;
        }

        const accountCount = await accounts.countDocuments();
        const newAccountPayload = { ...req.body, accountCode: `ACC-${String(accountCount + 1).padStart(3, '0')}`, username: email.split('@')[0], status: 'active', referenceId: newDoctorId ? newDoctorId.toString() : undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

        const accountResult = await accounts.insertOne(newAccountPayload);
        const newAccount = await accounts.findOne({ _id: accountResult.insertedId });

        const publicAccount = toPublicDocument(newAccount);
        delete publicAccount.password;

        const token = publicAccount.id;
        res.status(201).json({ token, account: publicAccount });
    } catch (error) {
        next(error);
    }
  });

  // Get current user from token
  app.get('/api/auth/me', async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided.' });
      }
      const token = authHeader.split(' ')[1];
      if (!ObjectId.isValid(token)) return res.status(401).json({ error: 'Invalid token format.' });
      const account = await accounts.findOne({ _id: new ObjectId(token) });
      if (!account) return res.status(401).json({ error: 'Invalid token.' });
      const publicAccount = toPublicDocument(account);
      delete publicAccount.password;
      res.json({ data: publicAccount });
    } catch (error) {
      next(error);
    }
  });
}

function registerMetaRoutes() {
  app.get('/api/health', async (req, res) => {
    res.json({
      status: 'ok',
      service: 'smilecare-backend',
      database: DATABASE_NAME,
    });
  });

  app.get('/api/modules', (req, res) => {
    res.json({
      data: resourceConfigs.map((rc) => ({
        path: rc.path,
        collectionName: rc.collectionName,
        seedCount: rc.seed.length,
      }))
    });
  });

  app.get('/api/dashboard/summary', async (req, res, next) => {
    try {
      const counts = {};
      for (const rc of resourceConfigs) {
        counts[rc.collectionName] = await getCollection(rc.collectionName).countDocuments();
      }
      res.json({ data: { counts } });
    } catch (error) {
      next(error);
    }
  });
}

function registerErrorHandler() {
  app.use((err, req, res, next) => {
    const message = err && err.message ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  });
}

let server;

async function main() {
  try {
    await initializeDatabase();
    console.log('MongoDB connected successfully.');

    for (const resourceConfig of resourceConfigs) {
      registerResourceRoutes(resourceConfig);
    }
    registerAuthRoutes();
    registerMetaRoutes();
    registerErrorHandler();

    server = app.listen(PORT, () => {
      console.log(`SmileCare backend is running at http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      if (error && error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
      }
      console.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    if (error.name === 'MongoServerSelectionError') {
      console.error('This usually means the MongoDB server is not running or is inaccessible.');
      console.error('Please ensure your MongoDB server is running and accessible at the configured MONGODB_URI.');
    } else {
      console.error('An unexpected error occurred during MongoDB connection.');
    }
    process.exit(1); // Exit the process as database connection is critical
  }
}

async function shutdown() {
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoClient.close();
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
