require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function fix() {
    await connectDB();
    try {
        await mongoose.connection.collection('doctors').dropIndex('doctorCode_1');
        console.log('Dropped index');
    } catch (e) {
        console.log('Index drop error:', e.message);
    }
    await mongoose.connection.collection('doctors').updateMany({}, {
        $rename: { 'doctorCode': 'licenseNumber', 'experienceYears': 'experience' }
    });
    console.log('Done renaming fields');
    process.exit(0);
}
fix();
