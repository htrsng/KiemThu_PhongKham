const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Service = require('../models/Service');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

exports.checkIn = async (req, res, next) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    
    if (apt.status !== 'Đã lên lịch') {
        return res.status(400).json({ error: 'Only scheduled appointments can be checked in.' });
    }

    const now = new Date();
    const aptTime = new Date(apt.startTime);
    const diffMs = now - aptTime; // Positive if now > aptTime (late), negative if early

    if (diffMs < -30 * 60000) {
       return res.status(400).json({ error: 'Không thể Check-in quá sớm (trước 30 phút)' });
    }
    if (diffMs > 30 * 60000) {
       return res.status(400).json({ error: 'Đã quá hạn Check-in (trễ hơn 30 phút)' });
    }

    apt.status = 'Đã đến';
    apt.checkInTime = now;
    await apt.save();

    res.json({ data: apt.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.walkIn = async (req, res, next) => {
    try {
      const { patientPhone, patientName, patientAge, allergies, doctorId, serviceId } = req.body;
      let patient = await Patient.findOne({ phone: patientPhone });
      
      if (!patient) {
        const count = await Patient.countDocuments();
        patient = await Patient.create({
          fullName: patientName,
          phone: patientPhone,
          dateOfBirth: new Date(new Date().getFullYear() - (patientAge || 30), 0, 1),
          gender: 'Không xác định',
          address: 'Bệnh nhân vãng lai',
          allergies: allergies || [],
          patientCode: `PAT-V${String(count + 1).padStart(3, '0')}`
        });
      }

      const doctor = await Doctor.findById(doctorId);
      const service = await Service.findById(serviceId);

      if(!doctor || !service) return res.status(400).json({ error: 'Doctor or Service not found' });

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (service.duration || 30) * 60000);

      const apt = await Appointment.create({
        patientId: patient._id,
        patientName: patient.fullName,
        doctorId: doctor._id,
        doctorName: doctor.fullName,
        serviceId: service._id,
        serviceName: service.name,
        startTime,
        endTime,
        status: 'Đã đến',
        notes: 'Bệnh nhân vãng lai',
        checkInTime: startTime,
      });

      res.status(201).json({ data: apt.toJSON() });
    } catch (error) {
      next(error);
    }
};

exports.finishTreatment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // Expect status: 'Đã hoàn thành'

    const apt = await Appointment.findById(id);
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });

    apt.status = status || 'Đã hoàn thành';
    if (notes) apt.notes = notes;
    await apt.save();

    // If finished, generate invoice
    if (apt.status === 'Đã hoàn thành') {
        const service = await Service.findById(apt.serviceId);
        const amount = service ? service.basePrice : 500000;

        await Invoice.create({
            appointmentId: apt._id,
            patientId: apt.patientId,
            patientName: apt.patientName,
            doctorId: apt.doctorId,
            serviceIds: [apt.serviceId],
            totalAmount: amount,
            finalAmount: amount,
            status: 'Chưa thanh toán'
        });
    }

    res.json({ data: apt.toJSON() });
  } catch (error) {
    next(error);
  }
};
