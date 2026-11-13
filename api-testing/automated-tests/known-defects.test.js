// Requirement assertions remain active before and after fixing the documented defects.
const { after } = require('node:test');
const { test, observedFetch: fetch } = require('../../.github/qa/helpers/qa-test');
const assert = require('node:assert/strict');
const { assertLocalQa, createFixture, cleanupFixture, cleanupAll } = require('../../automation-testing/fixtures/qa-data');
assertLocalQa();
after(cleanupAll);
const base = process.env.API_URL || 'http://localhost:5000/api';
async function setup(t, status) {
  const data = await createFixture({ status });
  t.after(() => cleanupFixture(data.key));
  const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_USER, password: process.env.ADMIN_PASS }) });
  assert.equal(response.status, 200);
  const { token } = await response.json();
  async function call(path, method = 'GET', body) {
    const result = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined });
    return { status: result.status, body: await result.json() };
  }
  return { ...data, call };
}
test('BUG-002 / TC-APPT-021: completed appointment cannot move backward', async (t) => {
  const f = await setup(t, 'Đã hoàn thành');
  const response = await f.call(`/appointments/${f.appointmentId}`, 'PATCH', { status: 'Đang điều trị' });
  const stored = await f.call(`/appointments/${f.appointmentId}`);
  assert.deepEqual({ status: response.status, persisted: stored.body.data.status }, { status: 400, persisted: 'Đã hoàn thành' });
});
test('BUG-003 / TC-APPT-022: repeated completion cannot create duplicate invoices', async (t) => {
  const f = await setup(t, 'Đang điều trị');
  assert.equal((await f.call(`/appointments/${f.appointmentId}`, 'PATCH', { status: 'Đã hoàn thành' })).status, 200);
  await f.call(`/appointments/${f.appointmentId}`, 'PATCH', { status: 'Đã hoàn thành' });
  const result = await f.call(`/invoices?appointmentId=${f.appointmentId}`);
  assert.equal(result.body.data.length, 1, 'Exactly one invoice per completed appointment');
});

test('BUG-002 / TC-APPT-021: all update routes reject terminal, backward, skipped and unknown states', async (t) => {
  for (const [method, suffix] of [['PATCH', ''], ['PUT', ''], ['PATCH', '/finish']]) {
    for (const [before, target] of [['Đã hoàn thành', 'Đang điều trị'], ['Đã hủy', 'Đã đến'],
      ['Đang điều trị', 'Đã đến'], ['Đã lên lịch', 'Đã hoàn thành'], ['Đã đến', 'unknown']]) {
      const f = await setup(t, before);
      assert.equal((await f.call(`/appointments/${f.appointmentId}${suffix}`, method, { status: target })).status, 400);
      assert.equal((await f.call(`/appointments/${f.appointmentId}`)).body.data.status, before);
      assert.equal((await f.call(`/invoices?appointmentId=${f.appointmentId}`)).body.data.length, 0);
    }
  }
});

test('BUG-002 / TC-APPT-017: metadata PATCH does not implicitly complete an appointment', async (t) => {
  const f = await setup(t, 'Đã lên lịch');
  const response = await f.call(`/appointments/${f.appointmentId}`, 'PATCH', { notes: 'QA reschedule note' });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.status, 'Đã lên lịch');
  assert.equal((await f.call(`/invoices?appointmentId=${f.appointmentId}`)).body.data.length, 0);
});

test('BUG-003 / TC-APPT-022: parallel completion across PUT PATCH and finish creates exactly one invoice', async (t) => {
  const f = await setup(t, 'Đang điều trị');
  const results = await Promise.all(Array.from({ length: 12 }, (_, index) => {
    const [method, suffix] = [['PATCH', ''], ['PUT', ''], ['PATCH', '/finish']][index % 3];
    return f.call(`/appointments/${f.appointmentId}${suffix}`, method, { status: 'Đã hoàn thành' });
  }));
  assert.deepEqual(results.map((result) => result.status), Array(12).fill(200));
  assert.equal((await f.call(`/appointments/${f.appointmentId}`)).body.data.status, 'Đã hoàn thành');
  const invoices = (await f.call(`/invoices?appointmentId=${f.appointmentId}`)).body.data;
  assert.equal(invoices.length, 1);
  assert.equal(invoices[0].finalAmount, 100000);
});

test('BUG-003 / TC-APPT-022: completing again preserves a paid invoice and rejects duplicate invoice POST', async (t) => {
  const f = await setup(t, 'Đang điều trị');
  assert.equal((await f.call(`/appointments/${f.appointmentId}/finish`, 'PATCH', {})).status, 200);
  const invoice = (await f.call(`/invoices?appointmentId=${f.appointmentId}`)).body.data[0];
  assert.equal((await f.call(`/invoices/${invoice.id}`, 'PATCH', {
    status: 'Đã thanh toán', finalAmount: 100000, amountPaid: 100000, paymentMethod: 'Chuyển khoản' })).status, 200);
  assert.equal((await f.call(`/appointments/${f.appointmentId}`, 'PUT', { status: 'Đã hoàn thành' })).status, 200);
  const stored = (await f.call(`/invoices/${invoice.id}`)).body.data;
  assert.equal(stored.status, 'Đã thanh toán');
  assert.equal(stored.amountPaid, 100000);
  assert.equal(stored.paymentMethod, 'Chuyển khoản');
  const { _id, id, createdAt, updatedAt, __v, amountPaid, ...duplicate } = invoice;
  assert.equal((await f.call('/invoices', 'POST', duplicate)).status, 409);
  assert.equal((await f.call(`/invoices?appointmentId=${f.appointmentId}`)).body.data.length, 1);
});

test('BUG-003 / TC-APPT-022: retry restores a missing invoice on a completed appointment', async (t) => {
  const f = await setup(t, 'Đã hoàn thành');
  for (let index = 0; index < 2; index++) {
    assert.equal((await f.call(`/appointments/${f.appointmentId}/finish`, 'PATCH', {})).status, 200);
  }
  assert.equal((await f.call(`/invoices?appointmentId=${f.appointmentId}`)).body.data.length, 1);
});
