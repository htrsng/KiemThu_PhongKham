require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const RolePermission = require('../models/RolePermission');
const Setting = require('../models/Setting');

const defaultPermissions = {
    'Dashboard': { 'View': true },
    'Tài khoản': { 'View': true, 'Create': true, 'Edit': true, 'Delete': true },
    'Bác sĩ': { 'View': true, 'Create': true, 'Edit': true, 'Delete': true },
    'Dịch vụ': { 'View': true, 'Create': true, 'Edit': true, 'Delete': true },
    'Lịch hẹn': { 'View': true, 'Create': true, 'Edit': true, 'Delete': true },
    'Phân quyền': { 'View': true, 'Create': true, 'Edit': true },
    'Cấu hình': { 'View': true, 'Edit': true },
    'Báo cáo': { 'View': true, 'Export': true }
};

const doctorPermissions = {
    'Dashboard': { 'View': true },
    'Bác sĩ': { 'View': true, 'Edit': true },
    'Lịch hẹn': { 'View': true, 'Create': true, 'Edit': true },
    'Báo cáo': { 'View': true }
};

const receptionPermissions = {
    'Dashboard': { 'View': true },
    'Tài khoản': { 'View': true },
    'Bác sĩ': { 'View': true },
    'Dịch vụ': { 'View': true },
    'Lịch hẹn': { 'View': true, 'Create': true, 'Edit': true, 'Delete': true }
};

const defaultSettings = [
    {
        settingCode: 'clinic.profile',
        value: {
            clinicName: 'Nha Khoa SmileCare',
            hotline: '0901234567',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            email: 'contact@smilecare.vn',
            currency: 'VND'
        }
    },
    {
        settingCode: 'clinic.hours',
        value: {
            weekdays: '08:00 - 20:00',
            saturday: '08:00 - 17:00',
            sunday: 'Nghỉ'
        }
    }
];

async function seedData() {
    try {
        await connectDB();
        
        // Seed Role Permissions
        const roles = [
            { role: 'Admin', permissions: defaultPermissions },
            { role: 'Doctor', permissions: doctorPermissions },
            { role: 'Reception', permissions: receptionPermissions }
        ];

        for (const r of roles) {
            await RolePermission.findOneAndUpdate(
                { role: r.role },
                { $set: r },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }
        console.log('Role Permissions seeded successfully!');

        // Seed Settings
        for (const s of defaultSettings) {
            await Setting.findOneAndUpdate(
                { settingCode: s.settingCode },
                { $set: s },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }
        console.log('Settings seeded successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedData();
