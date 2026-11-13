// Run separately: requirement assertions MUST fail while documented defects remain open.
const { after } = require('node:test');
const { test, observedFetch: fetch } = require('../helpers/qa-test');
const assert = require('node:assert/strict');
const { assertLocalQa, createFixture, cleanupFixture, cleanupAll } = require('../helpers/qa-data');
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
