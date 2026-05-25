const mongoose = require('mongoose');
const reportController = require('./src/controllers/reportController');
const fs = require('fs');

const MONGO_URI = 'mongodb://localhost:27017/dental_clinic';

// Mock express req/res
const req = {
    query: { month: 5, year: 2026 }
};

const res = fs.createWriteStream('Bang_Luong_T5_2026.xlsx');
res.setHeader = (k, v) => console.log(`Set header: ${k} = ${v}`);
res.end = () => console.log('✅ Bảng lương Excel đã được lưu thành công vào Bang_Luong_T5_2026.xlsx');

const run = async () => {
    await mongoose.connect(MONGO_URI);
    await reportController.exportPayrollExcel(req, res, console.error);
    process.exit(0);
};

run();
