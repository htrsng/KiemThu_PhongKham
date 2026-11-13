const { after } = require('node:test');
const { test, observedFetch: fetch } = require('../../.github/qa/helpers/qa-test');
const assert = require('node:assert/strict');
const { assertLocalQa, createFixture, cleanupFixture, cleanupAll } = require('../../automation-testing/fixtures/qa-data');
assertLocalQa();
const base = process.env.API_URL || 'http://localhost:5000/api';
after(cleanupAll);
async function request(path, token, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, { method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
async function login(role) {
  const result = await request('/auth/login', null, 'POST', {
    email: process.env[`${role}_USER`], password: process.env[`${role}_PASS`] });
  assert.equal(result.status, 200, `QA ${role} login`);
  return result.body.token;
}
async function fixture(t, options) {
  const data = await createFixture(options);
  t.after(() => cleanupFixture(data.key));
  return data;
}
async function read(path, token) {
  const result = await request(path, token);
  assert.equal(result.status, 200);
  return result.body.data;
}
for (const [role, status] of [['ADMIN', 200], ['DOCTOR', 403], ['RECEPTION', 403]]) {
  test(`TC-AUTHZ-00${role === 'ADMIN' ? 1 : role === 'DOCTOR' ? 2 : 3}: ${role} account access returns ${status}`, async () => {
    const result = await request('/accounts', await login(role));
    assert.equal(result.status, status);
    if (status === 200) {
      assert.ok(Array.isArray(result.body.data));
      for (const account of result.body.data) {
        assert.equal(typeof account.id, 'string');
        assert.ok(['Admin', 'Doctor', 'Reception'].includes(account.role));
        assert.equal(account.password, undefined);
      }
    }
    else assert.equal(result.body.data, undefined);
  });
}
test('TC-APPT-001: create appointment and read persisted fields', async (t) => {
  const data = await fixture(t, { appointment: false });
  const token = await login('ADMIN');
  const result = await request('/appointments', token, 'POST', data.appointment);
  assert.equal(result.status, 201);
  const stored = await read(`/appointments/${result.body.data.id}`, token);
  assert.equal(stored.status, 'Đã lên lịch');
  assert.equal(stored.patientId, data.appointment.patientId);
  assert.equal(stored.startTime, data.appointment.startTime);
});
test('TC-APPT-002: past appointment returns 400 and creates no data', async (t) => {
  const data = await fixture(t, { appointment: false, offsetMinutes: -60 });
  const token = await login('ADMIN');
  assert.equal((await request('/appointments', token, 'POST', data.appointment)).status, 400);
  assert.equal((await read(`/appointments?doctorId=${data.appointment.doctorId}`, token)).length, 0);
});
test('TC-APPT-009: duplicate patient/doctor/day returns 400 without duplicate data', async (t) => {
  const data = await fixture(t);
  const token = await login('ADMIN');
  assert.equal((await request('/appointments', token, 'POST', data.appointment)).status, 400);
  assert.equal((await read(`/appointments?doctorId=${data.appointment.doctorId}`, token)).length, 1);
});
for (const [id, offset, expected] of [['011', 29, 200], ['013', -31, 400], ['014', 0, 200]]) {
  test(`TC-APPT-${id}: check-in offset ${offset} minutes returns ${expected}`, async (t) => {
    const data = await fixture(t, { offsetMinutes: offset });
    const token = await login('RECEPTION');
    assert.equal((await request(`/appointments/${data.appointmentId}/checkin`, token, 'PATCH')).status, expected);
    const stored = await read(`/appointments/${data.appointmentId}`, token);
    assert.equal(stored.status, expected === 200 ? 'Đã đến' : 'Đã lên lịch');
    assert.equal(Boolean(stored.checkInTime), expected === 200);
  });
}
test('TC-APPT-015: repeated check-in returns 400 without modifying state', async (t) => {
  const data = await fixture(t, { status: 'Đã đến' });
  const token = await login('RECEPTION');
  assert.equal((await request(`/appointments/${data.appointmentId}/checkin`, token, 'PATCH')).status, 400);
  assert.equal((await read(`/appointments/${data.appointmentId}`, token)).status, 'Đã đến');
});
test('TC-APPT-018: complete treatment and verify exactly one unpaid invoice', async (t) => {
  const data = await fixture(t, { status: 'Đang điều trị' });
  const token = await login('ADMIN');
  assert.equal((await request(`/appointments/${data.appointmentId}`, token, 'PATCH', { status: 'Đã hoàn thành' })).status, 200);
  assert.equal((await read(`/appointments/${data.appointmentId}`, token)).status, 'Đã hoàn thành');
  const invoices = await read(`/invoices?appointmentId=${data.appointmentId}`, token);
  assert.equal(invoices.length, 1);
  assert.equal(invoices[0].status, 'Chưa thanh toán');
  assert.equal(invoices[0].finalAmount, 100000);
});
for (const [id, paid, debtAllowed, expected, method = 'Tiền mặt'] of [['003', 100000, false, 200],
  ['004', 100000, false, 200, 'Chuyển khoản'], ['005', 100000, false, 200, 'Thẻ tín dụng'], ['006', 100000, false, 200, 'Thẻ ATM'],
  ['007', 1, false, 400], ['008', 40000, true, 200], ['010', -1, false, 400]]) {
  test(`TC-PAY-${id}: paid=${paid}, allowDebt=${debtAllowed} returns ${expected} and persists balance`, async (t) => {
    const data = await fixture(t, { invoice: true, status: 'Đã hoàn thành' });
    const token = await login('RECEPTION');
    assert.equal((await request(`/invoices/${data.invoiceId}`, token, 'PATCH', {
      amountPaid: paid, finalAmount: 100000, allowDebt: debtAllowed, status: 'Đã thanh toán', paymentMethod: method })).status, expected);
    const stored = await read(`/invoices/${data.invoiceId}`, token);
    assert.equal(stored.status, expected === 200 ? 'Đã thanh toán' : 'Chưa thanh toán');
    assert.equal(stored.amountPaid, expected === 200 ? paid : 0);
    assert.equal(stored.debt, expected === 200 ? 100000 - paid : 0);
    assert.equal(stored.paymentMethod, expected === 200 ? method : 'Tiền mặt');
  });
}

for (const method of ['GET', 'PATCH']) {
  test(`TC-AUTHZ-005: Doctor ${method} invoice returns 403 without exposing or modifying data`, async (t) => {
    const data = await fixture(t, { invoice: true });
    const result = await request(`/invoices/${data.invoiceId}`, await login('DOCTOR'), method,
      method === 'PATCH' ? { status: 'Đã thanh toán', amountPaid: 100000, finalAmount: 100000 } : undefined);
    assert.equal(result.status, 403);
    assert.equal(result.body.data, undefined);
    assert.equal(typeof result.body.error, 'string');
    const stored = await read(`/invoices/${data.invoiceId}`, await login('ADMIN'));
    assert.equal(stored.status, 'Chưa thanh toán');
    assert.equal(stored.amountPaid, 0);
  });
}

test('TC-AUTH-010 (invoice subset): missing token cannot list invoices', async () => {
  const result = await request('/invoices');
  assert.equal(result.status, 401);
  assert.equal(result.body.data, undefined);
  assert.equal(typeof result.body.error, 'string');
});
for (const [role, expected] of [['ADMIN', 200], ['DOCTOR', 403], ['RECEPTION', 403]]) {
  test(`TC-AUTHZ-${role === 'ADMIN' ? '004' : role === 'DOCTOR' ? '005' : '007'}: ${role} invoice deletion returns ${expected}`, async (t) => {
    const data = await fixture(t, { invoice: true });
    assert.equal((await request(`/invoices/${data.invoiceId}`, await login(role), 'DELETE')).status, expected);
    const admin = await login('ADMIN');
    assert.equal((await request(`/invoices/${data.invoiceId}`, admin)).status, expected === 200 ? 404 : 200);
    assert.equal((await request(`/appointments/${data.appointmentId}`, admin)).status, 200);
  });
}
