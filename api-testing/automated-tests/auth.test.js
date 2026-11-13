const { test, observedFetch: fetch } = require('../../.github/qa/helpers/qa-test');
const assert = require('node:assert/strict');
const base = process.env.API_URL || 'http://localhost:5000/api';
const email = process.env.ADMIN_USER;
const password = process.env.ADMIN_PASS;
if (!email || !password || !process.env.LOCKED_USER) throw new Error('Thiếu môi trường QA.');
async function login(body) {
  const response = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
test('TC-AUTH-002 (API subset): missing both credentials returns 400', async () => {
  for (const body of [{}, { email }, { password }]) {
    const result = await login(body);
    assert.equal(result.status, 400);
    assert.equal(typeof result.body.error, 'string');
    assert.equal(result.body.token, undefined);
  }
});

test('TC-AUTH-004: uppercase gmail account is normalized', async () => {
  const result = await login({ email: email.toUpperCase(), password });
  assert.equal(result.status, 200);
  assert.equal(result.body.account.email, email.toLowerCase());
  assert.equal(result.body.account.password, undefined);
});
test('TC-AUTH-003: non-gmail email returns 400', async () => {
  const result = await login({ email: 'qa@example.invalid', password });
  assert.equal(result.status, 400); assert.equal(result.body.error, 'invalid_email_format');
});
test('TC-AUTH-005: wrong password returns 401', async () => {
  const result = await login({ email, password: `${password}invalid` });
  assert.equal(result.status, 401); assert.equal(result.body.error, 'wrong_password');
});
test('TC-AUTH-008: locked account returns 403', async () => {
  const result = await login({ email: process.env.LOCKED_USER, password });
  assert.equal(result.status, 403); assert.equal(result.body.error, 'locked');
});
test('TC-AUTH-001 / TC-AUTH-012 (API): valid login returns token without password', async () => {
  const result = await login({ email, password });
  assert.equal(result.status, 200); assert.ok(result.body.token);
  assert.equal(result.body.account.email, email); assert.equal(result.body.account.password, undefined);
});
test('TC-AUTH-010 (missing-token subset): /me rejects missing token', async () => {
  assert.equal((await fetch(`${base}/auth/me`)).status, 401);
});
test('TC-AUTH-012 (session): /me returns current account without password', async () => {
  const loginResult = await login({ email, password });
  const response = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${loginResult.body.token}` } });
  assert.equal(response.status, 200);
  const body = await response.json(); assert.equal(body.data.email, email);
  assert.equal(body.data.password, undefined);
});
test('TC-AUTH-009: /me rejects invalid token', async () => {
  assert.equal((await fetch(`${base}/auth/me`, { headers: { Authorization: 'Bearer invalid-test-token' } })).status, 401);
});

test('TC-AUTH-010 (expired-token subset): signed expired JWT cannot access current account', async () => {
  const jwt = require('../../server/node_modules/jsonwebtoken');
  const result = await login({ email, password });
  assert.equal(result.status, 200);
  const token = jwt.sign({ id: result.body.account.id }, process.env.JWT_SECRET, { expiresIn: -1 });
  const response = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(typeof body.error, 'string');
  assert.equal(body.data, undefined);
});
