require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = Number(process.env.PORT || 3000);
const DATABASE_NAME = process.env.MONGODB_DB || 'smilecare';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required to start the SmileCare backend.');
}

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '2mb' }));

const client = new MongoClient(MONGODB_URI);
const collections = new Map();

const resourceConfigs = [
  {
    path: '/api/accounts',
    collectionName: 'accounts',
    seed: [
      {
        accountCode: 'ACC-001',
        fullName: 'Nguyen Thi An',
        username: 'an.nguyen',
        roleCode: 'ROLE_ADMIN',
        department: 'Ban dieu hanh',
        phone: '0903123456',
        email: 'an.nguyen@smilecare.vn',
        status: 'active',
        permissions: ['dashboard.view', 'accounts.manage', 'settings.manage'],
        lastLoginAt: '2026-04-24T08:10:00.000Z'
      },
      {
        accountCode: 'ACC-002',
        fullName: 'Tran Van Minh',
        username: 'minh.tran',
        roleCode: 'ROLE_DOCTOR',
        department: 'Khoa implant',
        phone: '0918123456',
        email: 'minh.tran@smilecare.vn',
        status: 'active',
        permissions: ['dashboard.view', 'patients.view', 'services.view'],
        lastLoginAt: '2026-04-24T13:45:00.000Z'
      },
      {
        accountCode: 'ACC-003',
        fullName: 'Le Thi Hanh',
        username: 'hanh.le',
        roleCode: 'ROLE_RECEPTIONIST',
        department: 'Tiep nhan',
        phone: '0987123456',
        email: 'hanh.le@smilecare.vn',
        status: 'active',
        permissions: ['appointments.manage', 'patients.view', 'billing.create'],
        lastLoginAt: '2026-04-25T07:30:00.000Z'
      }
    ]
  },
  {
    path: '/api/roles',
    collectionName: 'roles',
    seed: [
      {
        roleCode: 'ROLE_ADMIN',
        roleName: 'Quan tri he thong',
        description: 'Toan quyen quan ly du lieu va cau hinh',
        scope: 'global',
        status: 'active'
      },
      {
        roleCode: 'ROLE_DOCTOR',
        roleName: 'Bac si',
        description: 'Quan ly kham, dieu tri va phac do lam sang',
        scope: 'clinical',
        status: 'active'
      },
      {
        roleCode: 'ROLE_RECEPTIONIST',
        roleName: 'Le tan',
        description: 'Tiep nhan, xep lich va lap phieu dich vu',
        scope: 'frontdesk',
        status: 'active'
      }
    ]
  },
  {
    path: '/api/permissions',
    collectionName: 'permissions',
    seed: [
      {
        moduleCode: 'dashboard',
        moduleName: 'Bang dieu khien',
        actions: ['view'],
        description: 'Tong hop KPI, lich lam viec va canh bao he thong',
        status: 'active'
      },
      {
        moduleCode: 'accounts',
        moduleName: 'Tai khoan',
        actions: ['view', 'create', 'update', 'delete'],
        description: 'Quan ly tai khoan va phan quyen nguoi dung',
        status: 'active'
      },
      {
        moduleCode: 'pricing-policies',
        moduleName: 'Chinh sach gia',
        actions: ['view', 'create', 'update', 'delete', 'approve'],
        description: 'Dieu chinh gia va chiet khau theo doi tuong benh nhan',
        status: 'active'
      }
    ]
  },
  {
    path: '/api/doctors',
    collectionName: 'doctors',
    seed: [
      {
        doctorCode: 'DOC-001',
        fullName: 'Dr. Nguyen Quang Huy',
        specialty: 'Implant',
        degree: 'Thac si RHM',
        experienceYears: 12,
        room: 'Phong 201',
        status: 'active',
        consultationFee: 250000,
        workSchedule: {
          monFri: '08:00-17:30',
          sat: '08:00-12:00'
        },
        serviceCategoryCodes: ['IMPLANT', 'SURGERY']
      },
      {
        doctorCode: 'DOC-002',
        fullName: 'Dr. Pham Thu Ha',
        specialty: 'Nieng rang',
        degree: 'Bac si chuyen khoa I',
        experienceYears: 9,
        room: 'Phong 305',
        status: 'active',
        consultationFee: 180000,
        workSchedule: {
          monFri: '08:30-18:00',
          sat: '08:30-16:00'
        },
        serviceCategoryCodes: ['ORTHO', 'CONSULTATION']
      },
      {
        doctorCode: 'DOC-003',
        fullName: 'Dr. Le Hoang Nam',
        specialty: 'Nha khoa tong quat',
        degree: 'Bac si RHM',
        experienceYears: 6,
        room: 'Phong 102',
        status: 'on_leave',
        consultationFee: 150000,
        workSchedule: {
          monFri: '13:00-20:00',
          sat: 'Off'
        },
        serviceCategoryCodes: ['GENERAL', 'PREVENTIVE']
      }
    ]
  },
  {
    path: '/api/service-categories',
    collectionName: 'service_categories',
    seed: [
      {
        categoryCode: 'GENERAL',
        name: 'Nha khoa tong quat',
        description: 'Kham, ve sinh rang mieng va dieu tri co ban',
        status: 'active',
        priority: 1
      },
      {
        categoryCode: 'IMPLANT',
        name: 'Cay ghep Implant',
        description: 'Phuc hinh rang mat bang implant',
        status: 'active',
        priority: 2
      },
      {
        categoryCode: 'ORTHO',
        name: 'Nieng rang',
        description: 'Dieu chinh khop can va tham my ham rang',
        status: 'active',
        priority: 3
      }
    ]
  },
  {
    path: '/api/services',
    collectionName: 'services',
    seed: [
      {
        serviceCode: 'SV-001',
        categoryCode: 'GENERAL',
        name: 'Kham tong quat',
        standardPrice: 120000,
        durationMinutes: 20,
        taxRate: 0,
        status: 'active'
      },
      {
        serviceCode: 'SV-010',
        categoryCode: 'IMPLANT',
        name: 'Cay implant don',
        standardPrice: 15000000,
        durationMinutes: 90,
        taxRate: 0,
        status: 'active'
      },
      {
        serviceCode: 'SV-021',
        categoryCode: 'ORTHO',
        name: 'Nieng rang kim loai co ban',
        standardPrice: 18000000,
        durationMinutes: 45,
        taxRate: 0,
        status: 'active'
      }
    ]
  },
  {
    path: '/api/pricing-policies',
    collectionName: 'pricing_policies',
    seed: [
      {
        policyCode: 'POL-2026-01',
        serviceCode: 'SV-010',
        serviceName: 'Cay implant don',
        basePrice: 15000000,
        patientType: 'student',
        studentDiscountPercent: 5,
        memberDiscountPercent: 8,
        ageDiscountRules: [
          { minAge: 60, maxAge: 120, discountPercent: 4, label: 'Nguoi cao tuoi' }
        ],
        seasonalPromotions: [
          {
            label: 'Khai truong quy II',
            discountPercent: 10,
            startsOn: '2026-04-01',
            endsOn: '2026-06-30'
          }
        ],
        effectiveFrom: '2026-01-01',
        effectiveTo: '2026-12-31',
        status: 'active'
      },
      {
        policyCode: 'POL-2026-02',
        serviceCode: 'SV-021',
        serviceName: 'Nieng rang kim loai co ban',
        basePrice: 18000000,
        patientType: 'family',
        studentDiscountPercent: 4,
        memberDiscountPercent: 6,
        ageDiscountRules: [
          { minAge: 12, maxAge: 18, discountPercent: 3, label: 'Hoc sinh' }
        ],
        seasonalPromotions: [
          {
            label: 'Mua he hoc duong',
            discountPercent: 7,
            startsOn: '2026-05-01',
            endsOn: '2026-08-31'
          }
        ],
        effectiveFrom: '2026-01-01',
        effectiveTo: '2026-12-31',
        status: 'active'
      }
    ]
  },
  {
    path: '/api/settings',
    collectionName: 'settings',
    seed: [
      {
        settingCode: 'clinic.profile',
        group: 'clinic',
        name: 'Ho so phong kham',
        value: {
          clinicName: 'SmileCare Dental Clinic',
          hotline: '19001234',
          address: '123 Nguyen Trai, Quan 1, TP.HCM',
          email: 'contact@smilecare.vn',
          currency: 'VND'
        },
        status: 'active'
      },
      {
        settingCode: 'clinic.working-hours',
        group: 'schedule',
        name: 'Gio lam viec',
        value: {
          weekdays: '08:00-20:00',
          saturday: '08:00-17:00',
          sunday: '08:00-12:00'
        },
        status: 'active'
      },
      {
        settingCode: 'billing.rules',
        group: 'billing',
        name: 'Quy tac thanh toan',
        value: {
          depositPercent: 30,
          taxRate: 0,
          allowInstallment: true,
          refundPolicyDays: 7
        },
        status: 'active'
      }
    ]
  }
];

function getCollection(collectionName) {
  const collection = collections.get(collectionName);

  if (!collection) {
    throw new Error(`Collection not initialized: ${collectionName}`);
  }

  return collection;
}

function toPublicDocument(document) {
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

function buildFilter(query) {
  const filter = {};

  for (const [key, value] of Object.entries(query)) {
    if (key === 'limit' || key === 'skip' || key === 'sort' || key === 'fields') {
      continue;
    }

    filter[key] = value;
  }

  return filter;
}

function parseOptionalInteger(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
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
  const count = await collection.countDocuments();

  if (count > 0 || seed.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  const documents = seed.map((document) => ({
    ...document,
    createdAt: now,
    updatedAt: now
  }));

  await collection.insertMany(documents);
}

async function initializeDatabase() {
  await client.connect();
  console.log('MongoDB connected successfully.');

  const db = client.db(DATABASE_NAME);

  for (const resourceConfig of resourceConfigs) {
    const collection = db.collection(resourceConfig.collectionName);
    collections.set(resourceConfig.collectionName, collection);

    await seedCollection(collection, resourceConfig.seed);
    await collection.createIndex({ updatedAt: -1 });
  }
}

function registerResourceRoutes(resourceConfig) {
  const collection = () => getCollection(resourceConfig.collectionName);

  app.get(resourceConfig.path, async (req, res) => {
    try {
      const filter = buildFilter(req.query);
      const limit = parseOptionalInteger(req.query.limit, 100);
      const skip = parseOptionalInteger(req.query.skip, 0);
      const sort = req.query.sort ? { [String(req.query.sort)]: 1 } : { updatedAt: -1 };

      const documents = await collection().find(filter).sort(sort).skip(skip).limit(limit).toArray();
      res.json({ data: toPublicDocuments(documents), total: documents.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(resourceConfig.path, async (req, res) => {
    try {
      const now = new Date().toISOString();
      const payload = sanitizeBody(req.body);
      const result = await collection().insertOne({
        ...payload,
        createdAt: now,
        updatedAt: now
      });

      const insertedDocument = await collection().findOne({ _id: result.insertedId });
      res.status(201).json({ data: toPublicDocument(insertedDocument) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get(`${resourceConfig.path}/:id`, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid document id.' });
      }

      const document = await collection().findOne({ _id: new ObjectId(req.params.id) });

      if (!document) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      return res.json({ data: toPublicDocument(document) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put(`${resourceConfig.path}/:id`, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid document id.' });
      }

      const payload = sanitizeBody(req.body);
      const result = await collection().updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            ...payload,
            updatedAt: new Date().toISOString()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      const updatedDocument = await collection().findOne({ _id: new ObjectId(req.params.id) });
      return res.json({ data: toPublicDocument(updatedDocument) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete(`${resourceConfig.path}/:id`, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid document id.' });
      }

      const result = await collection().deleteOne({ _id: new ObjectId(req.params.id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      return res.json({ deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

function registerMetaRoutes() {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'smilecare-backend', database: DATABASE_NAME });
  });

  app.get('/api/dashboard/summary', async (req, res) => {
    try {
      const [accounts, doctors, services, policies, settings, permissions] = await Promise.all([
        getCollection('accounts').countDocuments(),
        getCollection('doctors').countDocuments(),
        getCollection('services').countDocuments(),
        getCollection('pricing_policies').countDocuments(),
        getCollection('settings').countDocuments(),
        getCollection('permissions').countDocuments()
      ]);

      res.json({
        data: {
          counts: {
            accounts,
            doctors,
            services,
            pricingPolicies: policies,
            settings,
            permissions
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/modules', (req, res) => {
    res.json({
      data: resourceConfigs.map((resourceConfig) => ({
        path: resourceConfig.path,
        collectionName: resourceConfig.collectionName,
        seedCount: resourceConfig.seed.length
      }))
    });
  });
}

async function main() {
  try {
    await initializeDatabase();

    for (const resourceConfig of resourceConfigs) {
      registerResourceRoutes(resourceConfig);
    }

    registerMetaRoutes();

    app.listen(PORT, () => {
      console.log(`SmileCare backend is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

main();
