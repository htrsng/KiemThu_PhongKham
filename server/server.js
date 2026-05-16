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
      }
    ]
  },
  {
    path: '/api/shifts',
    collectionName: 'shifts',
    seed: [
      {
        doctorId: 'doc-001',
        doctorName: 'Nguyễn Văn A',
        date: new Date().toISOString().slice(0, 10),
        startTime: '08:00',
        endTime: '17:00',
      }
    ]
  },
  {
    path: '/api/appointments',
    collectionName: 'appointments',
    seed: [
      {
        patientId: "pat-seed-1",
        patientName: "Trần Thị B",
        doctorId: "placeholder-doctor-id", // LƯU Ý: ID này chỉ là giữ chỗ.
        doctorName: "Dr. Nguyen Quang Huy",
        serviceId: "SV-001",
        serviceName: "Kham tong quat",
        startTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).getTime() + 30 * 60000).toISOString(),
        status: 'Đã lên lịch',
      }
    ]
  },
  {
    path: '/api/appointments',
    collectionName: 'appointments',
    seed: [
      {
        patientId: "pat-seed-1",
        patientName: "Trần Thị B",
        doctorId: "placeholder-doctor-id", // LƯU Ý: ID này chỉ là giữ chỗ.
        doctorName: "Dr. Nguyen Quang Huy",
        serviceId: "SV-001",
        serviceName: "Kham tong quat",
        startTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).getTime() + 30 * 60000).toISOString(),
        status: 'Đã lên lịch',
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
      }
    ]
  },
  {
    path: '/api/pricing-policies',
    collectionName: 'pricing_policies',
    seed: []
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
    process.exit(1);
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
