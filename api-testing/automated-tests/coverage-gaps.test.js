// Requirement checks: failures expose coverage findings; do not weaken assertions for green CI.
const { after } = require('node:test');
const { test, observedFetch: fetch } = require('../../.github/qa/helpers/qa-test');
const assert = require('node:assert/strict');
const { assertLocalQa, createFixture, cleanupFixture, cleanupAll } = require('../../automation-testing/fixtures/qa-data');
assertLocalQa();
after(cleanupAll);
const base = process.env.API_URL || 'http://localhost:5000/api';
async function call(path, token, method = 'GET', body) {
  const response = await fetch(base + path, { method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
async function admin() {
  const result = await call('/auth/login', '', 'POST', { email: process.env.ADMIN_USER, password: process.env.ADMIN_PASS });
  assert.equal(result.status, 200);
  return result.body.token;
}
async function fixture(t, options) {
  const value = await createFixture(options);
  t.after(() => cleanupFixture(value.key));
  return value;
}

test('BUG-005 / TC-AUTHZ-008: Doctor listing and query filters cannot expose another doctor appointments', async (t) => {
  const own = await fixture(t, { doctorAccount: true, status: 'Đã đến' });
  const other = await fixture(t, { status: 'Đã đến' });
  const normal = await call('/appointments', own.doctorToken);
  const bypass = await call(`/appointments?doctorId=${other.appointment.doctorId}`, own.doctorToken);
  assert.equal(normal.status, 200);
  assert.ok(normal.body.data.some((item) => item.id === own.appointmentId), 'Assigned appointment is visible');
  assert.ok(normal.body.data.every((item) => item.doctorId === own.appointment.doctorId), 'Only assigned doctor records');
  assert.ok([200, 403, 404].includes(bypass.status));
  assert.ok(!bypass.body.data?.some((item) => item.id === other.appointmentId), 'A doctorId query cannot bypass ownership');
});

test('BUG-005 / TC-AUTHZ-008: Doctor may read own appointment but not foreign appointment by ID', async (t) => {
  const own = await fixture(t, { doctorAccount: true });
  const other = await fixture(t);
  const permitted = await call(`/appointments/${own.appointmentId}`, own.doctorToken);
  const forbidden = await call(`/appointments/${other.appointmentId}`, own.doctorToken);
  assert.equal(permitted.status, 200);
  assert.equal(permitted.body.data.id, own.appointmentId);
  assert.ok([403, 404].includes(forbidden.status), `Foreign appointment must be forbidden/hidden, actual ${forbidden.status}`);
  assert.equal(forbidden.body.data, undefined);
});

test('BUG-005 / TC-AUTHZ-008: Doctor cannot change treatment status on a foreign appointment', async (t) => {
  const own = await fixture(t, { doctorAccount: true });
  const other = await fixture(t, { status: 'Đã đến' });
  const result = await call(`/appointments/${other.appointmentId}`, own.doctorToken, 'PATCH', { status: 'Đang điều trị' });
  const stored = await call(`/appointments/${other.appointmentId}`, await admin());
  assert.ok([403, 404].includes(result.status), `Foreign mutation must be rejected, actual ${result.status}; persisted ${stored.body.data.status}`);
  assert.equal(stored.body.data.status, 'Đã đến');
  for (const [method, suffix, body] of [
    ['PUT', '', { notes: 'forbidden replacement' }],
    ['PATCH', '/checkin', {}], ['PATCH', '/finish', {}], ['DELETE', '', undefined],
  ]) {
    const denied = await call(`/appointments/${other.appointmentId}${suffix}`, own.doctorToken, method, body);
    assert.ok([403, 404].includes(denied.status), `${method} ${suffix} must enforce ownership`);
  }
  const unchanged = await call(`/appointments/${other.appointmentId}`, await admin());
  assert.equal(unchanged.body.data.status, stored.body.data.status);
  const ownUpdate = await call(`/appointments/${own.appointmentId}`, own.doctorToken, 'PATCH', { notes: 'allowed own update' });
  assert.equal(ownUpdate.status, 200);
  assert.equal(ownUpdate.body.data.notes, 'allowed own update');
  const reassigned = await call(`/appointments/${own.appointmentId}`, own.doctorToken, 'PATCH', { doctorId: other.appointment.doctorId });
  assert.equal(reassigned.status, 403);
  const stillOwn = await call(`/appointments/${own.appointmentId}`, own.doctorToken);
  assert.equal(stillOwn.body.data.doctorId, own.appointment.doctorId);

});

for (const field of ['doctorId', 'patientId', 'startTime', 'endTime']) {
  test(`BUG-006 / TC-APPT-025: missing ${field} returns client error and creates no appointment`, async (t) => {
    const f = await fixture(t, { appointment: false });
    const token = await admin();
    const payload = { ...f.appointment };
    delete payload[field];
    const result = await call('/appointments', token, 'POST', payload);
    const persisted = await call(`/appointments?patientId=${f.appointment.patientId}`, token);
    assert.equal(persisted.body.data.length, 0);
    assert.ok(result.status >= 400 && result.status < 500, `Invalid input must return 4xx, actual ${result.status}`);
  });
}
for (const [field, value] of [['doctorId', 'not-an-object-id'], ['startTime', 'not-a-date']]) {
  test(`BUG-006 / TC-APPT-025: malformed ${field} returns client error without creating data`, async (t) => {
    const f = await fixture(t, { appointment: false });
    const token = await admin();
    const result = await call('/appointments', token, 'POST', { ...f.appointment, [field]: value });
    const persisted = await call(`/appointments?patientId=${f.appointment.patientId}`, token);
    assert.equal(persisted.body.data.length, 0);
    assert.ok(result.status >= 400 && result.status < 500, `Invalid input must return 4xx, actual ${result.status}`);
  });
}
for (const [method, suffix] of [['GET', ''], ['PATCH', ''], ['PATCH', '/checkin']]) {
  test(`BUG-006 / TC-APPT-026: ${method} malformed appointment ID ${suffix || 'detail'} returns client error`, async (t) => {
    const f = await fixture(t);
    const token = await admin();
    const result = await call(`/appointments/not-an-object-id${suffix}`, token, method,
      method === 'PATCH' && !suffix ? { status: 'Đang điều trị' } : undefined);
    const stored = await call(`/appointments/${f.appointmentId}`, token);
    assert.equal(stored.body.data.status, 'Đã lên lịch');
    assert.ok(result.status >= 400 && result.status < 500, `Malformed ID must return 4xx, actual ${result.status}`);
  });
}
