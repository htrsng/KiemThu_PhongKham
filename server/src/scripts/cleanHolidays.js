require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Holiday = require('../models/Holiday');

async function fix() {
    await connectDB();
    const holidays = await Holiday.find({});
    // the dates in DB might be Date objects. The frontend uses YYYY-MM-DD
    const holidayDates = holidays.map(h => {
        const d = h.date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    
    const shiftsCollection = mongoose.connection.collection('shifts');
    const shifts = await shiftsCollection.find({}).toArray();
    let deleted = 0;
    for (let s of shifts) {
        if (holidayDates.includes(s.date)) {
            await shiftsCollection.deleteOne({ _id: s._id });
            deleted++;
        }
    }
    
    const appointmentsCollection = mongoose.connection.collection('appointments');
    const appointments = await appointmentsCollection.find({}).toArray();
    let aptDeleted = 0;
    for (let a of appointments) {
        // appointment startTime is ISO string
        if (a.startTime) {
            const d = new Date(a.startTime);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const aptDateStr = `${year}-${month}-${day}`;
            
            if (holidayDates.includes(aptDateStr)) {
                await appointmentsCollection.deleteOne({ _id: a._id });
                aptDeleted++;
            }
        }
    }
    console.log('Deleted shifts on holidays:', deleted);
    console.log('Deleted appointments on holidays:', aptDeleted);
    process.exit(0);
}
fix();
