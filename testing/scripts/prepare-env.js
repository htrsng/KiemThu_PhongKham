// Chỉ tạo thông tin thử nghiệm mới; không đọc cấu hình hay bí mật triển khai.
const { randomBytes } = require('node:crypto');
const { writeFileSync, appendFileSync } = require('node:fs');
const { resolve } = require('node:path');
const id = randomBytes(6).toString('hex');
const values = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/smilecare_ci_test',
  MONGODB_DB: 'smilecare_ci_test',
  JWT_SECRET: randomBytes(32).toString('hex'),
  ADMIN_USER: `qa-${id}@gmail.com`,
  LOCKED_USER: `qa-locked-${id}@gmail.com`,
  DOCTOR_USER: `qa-doctor-${id}@gmail.com`,
  RECEPTION_USER: `qa-reception-${id}@gmail.com`,
  ADMIN_PASS: `Qa!1${randomBytes(16).toString('hex')}`,
  DOCTOR_PASS: `Qd!1${randomBytes(16).toString('hex')}`,
  RECEPTION_PASS: `Qr!1${randomBytes(16).toString('hex')}`,
  PORT: '5000', BASE_URL: 'http://localhost:5173', API_URL: 'http://localhost:5000/api',
};
const text = Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n';
if (process.env.GITHUB_ENV) {
  for (const key of ['ADMIN_PASS', 'DOCTOR_PASS', 'RECEPTION_PASS', 'JWT_SECRET']) {
    console.log(`::add-mask::${values[key]}`);
  }
  appendFileSync(process.env.GITHUB_ENV, text);
} else {
  writeFileSync(resolve(__dirname, '../.env.test'), text, { mode: 0o600 });
  console.log('Đã tạo testing/.env.test; không đưa file này vào Git.');
}
