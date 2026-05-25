const jwt = require('jsonwebtoken');
const Account = require('../models/Account');
const Doctor = require('../models/Doctor');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'smilecare_secret_key', {
    expiresIn: '30d',
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide an email and password' });
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'invalid_email_format', message: 'Tên đăng nhập phải có đuôi @gmail.com.' });
    }

    const account = await Account.findOne({ email: email.toLowerCase() });

    if (!account) {
      return res.status(404).json({ error: 'not_found', message: 'Account not found.' });
    }

    const isMatch = await account.matchPassword(password);

    if (!isMatch) {
      await AuditLog.create({ account: email, action: 'Đăng nhập', ipAddress: req.ip, result: 'Thất bại' });
      return res.status(401).json({ error: 'wrong_password', message: 'Invalid credentials.' });
    }

    if (account.status !== 'active') {
      return res.status(403).json({ error: 'locked', message: 'Account is locked.' });
    }

    // Update last login
    account.lastLoginAt = new Date();
    await account.save();

    await AuditLog.create({ account: email, action: 'Đăng nhập', ipAddress: req.ip, result: 'Thành công' });

    const token = generateToken(account._id);
    res.json({ token, account: account.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields for registration.' });
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'invalid_email_format', message: 'Email đăng ký phải là địa chỉ @gmail.com.' });
    }

    const existingAccount = await Account.findOne({ email: email.toLowerCase() });
    if (existingAccount) {
      return res.status(409).json({ error: 'email_exists', message: 'An account with this email already exists.' });
    }

    let referenceId = null;
    if (role === 'Doctor') {
      const doctorCount = await Doctor.countDocuments();
      const newDoctor = await Doctor.create({
        fullName,
        email,
        doctorCode: `DOC-${String(doctorCount + 1).padStart(3, '0')}`,
        specialty: 'Nha khoa tổng quát',
        degree: 'Bác sĩ',
        status: 'inactive'
      });
      referenceId = newDoctor._id;
    }

    const accountCount = await Account.countDocuments();
    const newAccount = await Account.create({
      ...req.body,
      accountCode: `ACC-${String(accountCount + 1).padStart(3, '0')}`,
      username: email.split('@')[0],
      referenceId,
      status: 'active'
    });

    await AuditLog.create({ account: email, action: 'Tạo tài khoản', ipAddress: req.ip, result: 'Thành công' });

    const token = generateToken(newAccount._id);
    res.status(201).json({ token, account: newAccount.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({ data: req.user.toJSON() });
  } catch (error) {
    next(error);
  }
};
