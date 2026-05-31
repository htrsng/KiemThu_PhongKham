const mongoose = require('mongoose');
const Setting = require('./src/models/Setting');
const connectDB = require('./src/config/db');
require('dotenv').config();

async function addPayrollSettings() {
    await connectDB();
    const existing = await Setting.findOne({ settingCode: 'payroll.config' });
    if (!existing) {
        await Setting.create({
            settingCode: 'payroll.config',
            value: {
                baseHourlyRate: 50000,
                shiftMultipliers: {
                    morning: 1.0,
                    afternoon: 1.0,
                    evening: 1.3,
                    weekend: 1.5,
                    holiday: 2.0
                },
                defaultConsultationFee: 100000
            }
        });
        console.log('Added payroll.config to Settings');
    } else {
        console.log('payroll.config already exists');
    }
    process.exit(0);
}

addPayrollSettings();