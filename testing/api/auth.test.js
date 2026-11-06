const { test } = require('node:test');
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
test('Thiếu thông tin đăng nhập trả 400', async () => {
  assert.equal((await login({})).status, 400);
});
test('Email không đúng định dạng nghiệp vụ trả 400', async () => {
  const result = await login({ email: 'qa@example.invalid', password });
  assert.equal(result.status, 400); assert.equal(result.body.error, 'invalid_email_format');
});
test('Mật khẩu sai trả 401', async () => {
  const result = await login({ email, password: `${password}invalid` });
  assert.equal(result.status, 401); assert.equal(result.body.error, 'wrong_password');
});
test('Tài khoản khóa trả 403', async () => {
  const result = await login({ email: process.env.LOCKED_USER, password });
  assert.equal(result.status, 403); assert.equal(result.body.error, 'locked');
});
test('Đăng nhập đúng trả token và không trả mật khẩu', async () => {
  const result = await login({ email, password });
  assert.equal(result.status, 200); assert.ok(result.body.token);
  assert.equal(result.body.account.email, email); assert.equal(result.body.account.password, undefined);
});
test('API /me từ chối khi không có token', async () => {
  assert.equal((await fetch(`${base}/auth/me`)).status, 401);
});
test('API /me xác nhận đúng tài khoản của phiên', async () => {
  const loginResult = await login({ email, password });
  const response = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${loginResult.body.token}` } });
  assert.equal(response.status, 200);
  const body = await response.json(); assert.equal(body.data.email, email);
  assert.equal(body.data.password, undefined);
});
test('API /me từ chối token không hợp lệ', async () => {
  assert.equal((await fetch(`${base}/auth/me`, { headers: { Authorization: 'Bearer invalid-test-token' } })).status, 401);
});
