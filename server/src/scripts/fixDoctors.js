require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Doctor = require('../models/Doctor');

async function fix() {
    await connectDB();
    const doctors = await Doctor.find({});
    for(let doc of doctors) {
        doc.phone = doc.phone || '09' + Math.floor(10000000 + Math.random() * 90000000);
        doc.email = doc.email || 'doctor' + doc._id.toString().substring(0,4) + '@smilecare.vn';
        doc.experienceYears = doc.experienceYears || Math.floor(Math.random() * 10) + 2;
        if (!['Đại học', 'Thạc sỹ', 'Tiến sỹ', 'Phó giáo sư', 'Giáo sư'].includes(doc.degree)) {
            doc.degree = 'Đại học';
        }
        await doc.save();
        console.log('Fixed:', doc.fullName);
    }
    console.log('Done');
    process.exit(0);
}
fix();
