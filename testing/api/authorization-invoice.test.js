const { test } = require('node:test');
const assert = require('node:assert/strict');

const base = process.env.API_URL || 'http://localhost:5000/api';
const credentials = {
  admin: [process.env.ADMIN_USER, process.env.ADMIN_PASS],
  doctor: [process.env.DOCTOR_USER, process.env.DOCTOR_PASS],
  reception: [process.env.RECEPTION_USER, process.env.RECEPTION_PASS],
};

if (Object.values(credentials).some(([email, password]) => !email || !password)) {
  throw new Error('Thiếu credential QA cho Admin, Doctor hoặc Reception.');
}

const state = {};

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  return { status: response.status, body };
}

async function login(role) {
  const [email, password] = credentials[role];
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.account.role, role === 'reception' ? 'Reception' : role[0].toUpperCase() + role.slice(1));
  return result.body.token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

test('RBAC: Admin can list accounts', async () => {
  state.admin = await login('admin');
  const result = await request('/accounts', { headers: auth(state.admin) });
  assert.equal(result.status, 200);
  assert.ok(Array.isArray(result.body.data));
});

test('RBAC: Doctor cannot list accounts', async () => {
  state.doctor = await login('doctor');
  const result = await request('/accounts', { headers: auth(state.doctor) });
  assert.equal(result.status, 403);
});

test('RBAC: Reception cannot list accounts', async () => {
  state.reception = await login('reception');
  const result = await request('/accounts', { headers: auth(state.reception) });
  assert.equal(result.status, 403);
});

test('RBAC: Missing and invalid tokens are rejected', async () => {
  assert.equal((await request('/auth/me')).status, 401);
  assert.equal((await request('/auth/me', { headers: auth('invalid-token') })).status, 401);
});

test('Invoice flow: create an appointment in a QA shift', async () => {
  const now = new Date();
  const start = new Date(now.getTime() + 5 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const doctors = await request('/doctors', { headers: auth(state.admin) });
  const patients = await request('/patients', { headers: auth(state.admin) });
  const services = await request('/services', { headers: auth(state.admin) });
  const doctor = doctors.body.data.find((item) => item.licenseNumber === 'QA-DOC-001');
  const patient = patients.body.data.find((item) => item.patientCode === 'QA-PAT-001');
  const service = services.body.data.find((item) => item.code === 'QA-SRV-001');
  assert.ok(doctor && patient && service);

  const newPatient = await request('/patients', {
    method: 'POST',
    headers: auth(state.admin),
    body: JSON.stringify({
      patientCode: `QA-API-${Date.now()}`,
      fullName: 'QA API Patient',
      phone: `090${String(Date.now()).slice(-7)}`,
      dateOfBirth: '1990-01-01',
      gender: 'Khác',
      address: 'QA',
    }),
  });
  assert.equal(newPatient.status, 201);

  state.appointment = {
    patientId: newPatient.body.data.id,
    patientName: newPatient.body.data.fullName,
    doctorId: doctor.id,
    doctorName: doctor.fullName,
    serviceId: service.id,
    serviceName: service.name,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: 'Đã lên lịch',
    difficulty: 0,
  };
  const shiftStart = `${String(Math.max(0, start.getHours() - 1)).padStart(2, '0')}:00`;
  const shiftEnd = start.getHours() === 23
    ? '23:59'
    : `${String(start.getHours() + 2).padStart(2, '0')}:00`;
  await request('/shifts', {
    method: 'POST',
    headers: auth(state.admin),
    body: JSON.stringify({
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      date: start.toISOString().slice(0, 10),
      startTime: shiftStart,
      endTime: shiftEnd,
    }),
  });
  const result = await request('/appointments', {
    method: 'POST',
    headers: auth(state.admin),
    body: JSON.stringify(state.appointment),
  });
  assert.equal(result.status, 201);
  state.appointmentId = result.body.data.id;
});

test('Invoice flow: check in and complete treatment', async () => {
  const checkIn = await request(`/appointments/${state.appointmentId}/checkin`, {
    method: 'PATCH',
    headers: auth(state.reception),
  });
  assert.equal(checkIn.status, 200);

  const treatment = await request(`/appointments/${state.appointmentId}`, {
    method: 'PATCH',
    headers: auth(state.doctor),
    body: JSON.stringify({ status: 'Đang điều trị' }),
  });
  assert.equal(treatment.status, 200);

  const completed = await request(`/appointments/${state.appointmentId}`, {
    method: 'PATCH',
    headers: auth(state.doctor),
    body: JSON.stringify({ status: 'Đã hoàn thành' }),
  });
  assert.equal(completed.status, 200);
});

test('Invoice flow: completed appointment creates an unpaid invoice', async () => {
  const result = await request('/invoices', { headers: auth(state.reception) });
  assert.equal(result.status, 200);
  const invoice = result.body.data.find((item) => item.appointmentId === state.appointmentId);
  assert.ok(invoice);
  assert.equal(invoice.status, 'Chưa thanh toán');
  state.invoiceId = invoice.id;
});

test('Invoice validation: underpayment without debt approval is rejected', async () => {
  const result = await request(`/invoices/${state.invoiceId}`, {
    method: 'PATCH',
    headers: auth(state.reception),
    body: JSON.stringify({
      amountPaid: 1,
      finalAmount: 100000,
      status: 'Đã thanh toán',
      allowDebt: false,
    }),
  });
  assert.equal(result.status, 400);
});

test('RBAC: Doctor cannot delete an invoice', async () => {
  const result = await request(`/invoices/${state.invoiceId}`, {
    method: 'DELETE',
    headers: auth(state.doctor),
  });
  assert.equal(result.status, 403);
});
