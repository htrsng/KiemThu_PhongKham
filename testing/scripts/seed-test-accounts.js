// Tạo đúng hai tài khoản tổng hợp trong DB thử nghiệm trên máy cục bộ.
const mongoose = require('../../server/node_modules/mongoose');
const Account = require('../../server/src/models/Account');
async function main() {
  const { MONGODB_URI, MONGODB_DB, ADMIN_USER, LOCKED_USER, ADMIN_PASS } = process.env;
  const uri = new URL(MONGODB_URI || 'mongodb://invalid');
  if (!['localhost', '127.0.0.1'].includes(uri.hostname) || !MONGODB_DB?.endsWith('_test')) {
    throw new Error('Chỉ được chuẩn bị dữ liệu trên MongoDB cục bộ có tên DB kết thúc bằng _test.');
  }
  if (![ADMIN_USER, LOCKED_USER].every((email) => email?.startsWith('qa-') && email.endsWith('@gmail.com')) || !ADMIN_PASS) {
    throw new Error('Thiếu thông tin tài khoản thử nghiệm sinh bằng prepare-env.js.');
  }
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  try {
    for (const [email, status] of [[ADMIN_USER, 'active'], [LOCKED_USER, 'locked']]) {
      const account = await Account.findOne({ email }) || new Account({ email });
      Object.assign(account, { accountCode: `QA-${email}`, username: email,
        fullName: 'Tài khoản kiểm thử', password: ADMIN_PASS, role: 'Admin', status });
      await account.save();
    }
    console.log('Đã chuẩn bị hai tài khoản trong DB thử nghiệm.');
  } finally { await mongoose.disconnect(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
