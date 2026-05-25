require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');

async function seedRevenueData() {
    try {
        await connectDB();
        console.log('Connected to DB');

        // 1. Create or get some services
        const services = await Service.find();
        if (!services.length) {
            console.error('No services found. Please create services first.');
            process.exit(1);
        }

        // 2. Create or get a doctor
        const doctors = await Doctor.find();
        if (!doctors.length) {
            console.error('No doctors found. Please create doctors first.');
            process.exit(1);
        }

        // 3. Create or get a patient
        const patients = await Patient.find();
        if (!patients.length) {
            console.error('No patients found. Please create patients first.');
            process.exit(1);
        }

        // 4. Generate random invoices over the last 30 days
        const now = new Date();
        const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng'];

        for (let i = 0; i < 20; i++) {
            // Random days ago from 0 to 30
            const daysAgo = Math.floor(Math.random() * 30);
            const date = new Date(now);
            date.setDate(date.getDate() - daysAgo);
            
            // Random service
            const service = services[Math.floor(Math.random() * services.length)];
            
            // Random patient and doctor
            const patient = patients[Math.floor(Math.random() * patients.length)];
            const doctor = doctors[Math.floor(Math.random() * doctors.length)];
            
            // Create Appointment
            const apt = await Appointment.create({
                patientId: patient._id,
                patientName: patient.fullName,
                doctorId: doctor._id,
                doctorName: doctor.fullName,
                serviceId: service._id,
                serviceName: service.name,
                startTime: date,
                endTime: new Date(date.getTime() + service.duration * 60000),
                status: 'Đã hoàn thành'
            });

            // Create Invoice
            await Invoice.create({
                appointmentId: apt._id,
                patientId: patient._id,
                patientName: patient.fullName,
                doctorId: doctor._id,
                serviceIds: [service._id],
                totalAmount: service.basePrice,
                finalAmount: service.basePrice,
                status: 'Đã thanh toán',
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                createdAt: date,
                updatedAt: date
            });
        }

        // Create a few invoices for specifically TODAY
        for (let i = 0; i < 5; i++) {
            const service = services[Math.floor(Math.random() * services.length)];
            const patient = patients[Math.floor(Math.random() * patients.length)];
            const doctor = doctors[Math.floor(Math.random() * doctors.length)];
            
            const apt = await Appointment.create({
                patientId: patient._id,
                patientName: patient.fullName,
                doctorId: doctor._id,
                doctorName: doctor.fullName,
                serviceId: service._id,
                serviceName: service.name,
                startTime: now,
                endTime: new Date(now.getTime() + service.duration * 60000),
                status: 'Đã hoàn thành'
            });

            await Invoice.create({
                appointmentId: apt._id,
                patientId: patient._id,
                patientName: patient.fullName,
                doctorId: doctor._id,
                serviceIds: [service._id],
                totalAmount: service.basePrice,
                finalAmount: service.basePrice,
                status: 'Đã thanh toán',
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                createdAt: now,
                updatedAt: now
            });
        }
        
        // Also create 2 unpaid invoices for today
        for (let i = 0; i < 2; i++) {
            const service = services[Math.floor(Math.random() * services.length)];
            const patient = patients[Math.floor(Math.random() * patients.length)];
            const doctor = doctors[Math.floor(Math.random() * doctors.length)];
            
            const apt = await Appointment.create({
                patientId: patient._id,
                patientName: patient.fullName,
                doctorId: doctor._id,
                doctorName: doctor.fullName,
                serviceId: service._id,
                serviceName: service.name,
                startTime: now,
                endTime: new Date(now.getTime() + service.duration * 60000),
                status: 'Đã hoàn thành'
            });

            await Invoice.create({
                appointmentId: apt._id,
                patientId: patient._id,
                patientName: patient.fullName,
                doctorId: doctor._id,
                serviceIds: [service._id],
                totalAmount: service.basePrice,
                finalAmount: service.basePrice,
                status: 'Chưa thanh toán',
                createdAt: now,
                updatedAt: now
            });
        }

        console.log('Revenue data seeded successfully!');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedRevenueData();
