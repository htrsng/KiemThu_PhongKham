require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const payrollRoutes = require('./src/routes/payrollRoutes');

const { createResourceRouter } = require('./src/routes/resourceRoutes');

// Import models for generic routes
const Account = require('./src/models/Account');
const Doctor = require('./src/models/Doctor');
const Patient = require('./src/models/Patient');
const Service = require('./src/models/Service');
const Appointment = require('./src/models/Appointment');
const Invoice = require('./src/models/Invoice');
const Material = require('./src/models/Material');
const InventoryLog = require('./src/models/InventoryLog');
const Shift = require('./src/models/Shift');
const AuditLog = require('./src/models/AuditLog');
const RolePermission = require('./src/models/RolePermission');
const WorkShift = require('./src/models/WorkShift');
const PricingPolicy = require('./src/models/PricingPolicy');
const Holiday = require('./src/models/Holiday');
const Setting = require('./src/models/Setting');

// Import custom controllers
const appointmentController = require('./src/controllers/appointmentController');
const shiftController = require('./src/controllers/shiftController');
const { protect } = require('./src/middlewares/auth');

// Import Jobs
require('./src/jobs/reminderJob');

const app = express();

// Connect to database
connectDB();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Mount Auth routes
app.use('/api/auth', authRoutes);

// Mount Report routes
app.use('/api/reports', reportRoutes);

// Mount Payroll routes
app.use('/api/payroll', payrollRoutes);

// Mount Inventory Custom routes
app.use('/api/inventory', inventoryRoutes);

// Mount Dashboard route
app.use('/api/dashboard', dashboardRoutes);



// Custom Appointment Routes
app.patch('/api/appointments/:id/checkin', protect, appointmentController.checkIn);
app.post('/api/appointments/walk-in', protect, appointmentController.walkIn);
app.patch('/api/appointments/:id', protect, appointmentController.finishTreatment); // Overrides generic patch for logic

// Mount generic resource routes
app.use('/api/accounts', protect, createResourceRouter(Account));
app.use('/api/doctors', createResourceRouter(Doctor)); // Publicly readable?
app.use('/api/patients', protect, createResourceRouter(Patient));
app.use('/api/services', createResourceRouter(Service));
app.use('/api/appointments', protect, createResourceRouter(Appointment));
app.use('/api/invoices', protect, createResourceRouter(Invoice));
app.use('/api/materials', protect, createResourceRouter(Material));
app.use('/api/inventory-logs', protect, createResourceRouter(InventoryLog));
// Custom Shift Routes (with conflict detection)
app.get('/api/shifts', protect, shiftController.getAllShifts);
app.get('/api/shifts/:id', protect, shiftController.getShift);
app.post('/api/shifts', protect, shiftController.createShift);
app.put('/api/shifts/:id', protect, shiftController.updateShift);
app.patch('/api/shifts/:id', protect, shiftController.updateShift);
app.delete('/api/shifts/:id', protect, shiftController.deleteShift);
app.use('/api/work-shifts', protect, createResourceRouter(WorkShift));
app.use('/api/pricing-policies', protect, createResourceRouter(PricingPolicy));
app.use('/api/holidays', protect, createResourceRouter(Holiday));
app.use('/api/settings', protect, createResourceRouter(Setting));
app.use('/api/audit-logs', protect, createResourceRouter(AuditLog));
app.use('/api/role_permissions', protect, createResourceRouter(RolePermission));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const message = err.message || 'Internal Server Error';
  res.status(500).json({ error: message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SmileCare backend is running on port ${PORT}`);
});
