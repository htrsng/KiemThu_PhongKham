require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Service = require('../models/Service');

async function fix() {
    await connectDB();
    const services = await Service.find({});
    let counter = 1;
    for(let svc of services) {
        if (!svc.code) {
            svc.code = svc.serviceCode || `DV-${String(counter).padStart(3, '0')}`;
            // Mongoose might complain if serviceCode is missing in schema now, so we use document update
            await Service.updateOne({ _id: svc._id }, { $set: { code: svc.code }, $unset: { serviceCode: 1 } });
            console.log('Fixed service:', svc.name, 'with code:', svc.code);
        }
        counter++;
    }
    console.log('Done');
    process.exit(0);
}
fix();
