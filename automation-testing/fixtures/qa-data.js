// Preconditions only; business actions under test still go through HTTP/UI.
const { randomBytes } = require('node:crypto');
const mongoose = require('../../server/node_modules/mongoose');
const Doctor = require('../../server/src/models/Doctor');
const Patient = require('../../server/src/models/Patient');
const Service = require('../../server/src/models/Service');
const Shift = require('../../server/src/models/Shift');
const Appointment = require('../../server/src/models/Appointment');
const Invoice = require('../../server/src/models/Invoice');
const Account = require('../../server/src/models/Account');
const jwt = require('../../server/node_modules/jsonwebtoken');
function assertLocalQa() {
  const uri = new URL(process.env.MONGODB_URI || 'mongodb://invalid');
  const api = new URL(process.env.API_URL || 'http://localhost:5000/api');
  if (![uri.hostname, api.hostname].every((host) => ['127.0.0.1', 'localhost'].includes(host))
      || !process.env.MONGODB_DB?.endsWith('_test')) {
    throw new Error('Fixtures require a loopback API/MongoDB and a database ending in _test.');
  }
}
const owned = new Map();
async function createFixture(options = {}) {
  assertLocalQa();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB });
  }
  const key = randomBytes(8).toString('hex');
  const ids = { doctorId: new mongoose.Types.ObjectId(), patientId: new mongoose.Types.ObjectId(), serviceId: new mongoose.Types.ObjectId() };
  owned.set(key, ids);
  const doctorName = `QA Fixture ${key}`;
  const patientName = `QA Patient ${key}`;
  await Doctor.create({ _id: ids.doctorId, licenseNumber: `QA-${key}`, fullName: doctorName });
  let doctorToken;
  if (options.doctorAccount) {
    const account = await Account.create({ accountCode: `QA-${key}`, fullName: doctorName,
      username: `qa-${key}`, email: `qa-fixture-${key}@gmail.com`,
      password: `Qa!1${randomBytes(16).toString('hex')}`, role: 'Doctor', status: 'active', referenceId: ids.doctorId });
    ids.accountId = account._id;
    doctorToken = jwt.sign({ id: String(account._id) }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }
  await Patient.create({ _id: ids.patientId, patientCode: `QA-${key}`, fullName: patientName, phone: '0900000000' });
  await Service.create({ _id: ids.serviceId, code: `QA${key}`, name: `QA Service ${key}`, basePrice: 100000, duration: 30 });
  const start = new Date(Date.now() + (options.offsetMinutes ?? 5) * 60000);
  const appointment = { ...ids, doctorName, patientName, serviceName: `QA Service ${key}`,
    startTime: start.toISOString(), endTime: new Date(+start + 30 * 60000).toISOString(), status: options.status || 'Đã lên lịch' };
  await Shift.create({ doctorId: ids.doctorId, doctorName, date: start.toISOString().slice(0, 10), startTime: '00:00', endTime: '23:59' });
  let appointmentId;
  let invoiceId;
  if (options.appointment !== false) {
    const record = await Appointment.create(appointment);
    appointmentId = String(record._id);
    if (options.invoice) {
      const invoice = await Invoice.create({ appointmentId, patientId: ids.patientId, patientName,
        doctorId: ids.doctorId, serviceIds: [ids.serviceId], totalAmount: 100000, finalAmount: 100000 });
      invoiceId = String(invoice._id);
    }
  }
  return JSON.parse(JSON.stringify({ key, appointment, appointmentId, invoiceId, patientName, doctorToken }));
}
async function cleanupFixture(key) {
  const ids = owned.get(key);
  if (!ids) throw new Error('Refusing to clean an unowned fixture.');
  assertLocalQa();
  await Invoice.deleteMany({ doctorId: ids.doctorId });
  await Appointment.deleteMany({ doctorId: ids.doctorId });
  await Shift.deleteMany({ doctorId: ids.doctorId });
  await Service.deleteOne({ _id: ids.serviceId });
  await Patient.deleteOne({ _id: ids.patientId });
  await Doctor.deleteOne({ _id: ids.doctorId });
  if (ids.accountId) await Account.deleteOne({ _id: ids.accountId });
  owned.delete(key);
  return null;
}
async function cleanupAll() {
  for (const key of owned.keys()) await cleanupFixture(key);
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  return null;
}
module.exports = { assertLocalQa, createFixture, cleanupFixture, cleanupAll };
