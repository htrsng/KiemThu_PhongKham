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
    const updated = await Appointment.findOneAndUpdate({ _id: apt._id, status: 'Đã lên lịch', updatedAt: apt.updatedAt },
      { $set: { status: apt.status, checkInTime: now } }, { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ error: 'Lịch hẹn vừa thay đổi; vui lòng tải lại' });
    res.json({ data: updated.toJSON() });
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

// One transition policy for PUT, PATCH and the explicit finish endpoint.
const transitions = {
  'Đã lên lịch': ['Đã đến', 'Đã hủy'],
  'Đã đến': ['Đang điều trị'],
  'Đang điều trị': ['Đã hoàn thành'],
  'Đã hoàn thành': [],
  'Đã hủy': [],
};
exports.updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const apt = await Appointment.findById(id);
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    const status = req.body.status ?? apt.status;
    const replay = apt.status === 'Đã hoàn thành' && status === apt.status;
    if (!Object.hasOwn(transitions, status)
        || (status !== apt.status && !transitions[apt.status].includes(status))) {
      return res.status(400).json({ error: 'Chuyển trạng thái lịch hẹn không hợp lệ' });
    }
    if (['Đã hoàn thành', 'Đã hủy'].includes(apt.status) && !replay) {
      return res.status(400).json({ error: 'Không thể sửa lịch hẹn đã kết thúc' });
    }
    let updated = apt;
    if (!replay) {
      const fields = ['patientId', 'patientName', 'doctorId', 'doctorName', 'serviceId', 'serviceName',
        'startTime', 'endTime', 'notes', 'difficulty'];
      const changes = Object.fromEntries(fields.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
      changes.status = status;
      if (status === 'Đã đến' && apt.status === 'Đã lên lịch') {
        const minutes = (Date.now() - new Date(apt.startTime)) / 60000;
        if (Math.abs(minutes) > 30) return res.status(400).json({ error: 'Check-in chỉ trong khoảng ±30 phút' });
        changes.checkInTime = new Date();
      }
      // Compare-and-set prevents a concurrent stale request from moving the state backwards.
      updated = await Appointment.findOneAndUpdate({ _id: id, status: apt.status, updatedAt: apt.updatedAt },
        { $set: changes }, { new: true, runValidators: true });
      if (!updated) {
        updated = await Appointment.findById(id);
        if (status !== 'Đã hoàn thành' || updated?.status !== status) {
          return res.status(409).json({ error: 'Lịch hẹn vừa thay đổi; tải lại trước khi cập nhật' });
        }
      }
    }
    if (status === 'Đã hoàn thành') {
        // Retry repairs a failed invoice write; $setOnInsert never resets a paid invoice.
        const service = await Service.findById(apt.serviceId);
        const amount = service ? service.basePrice : 500000;
        const invoice = {
            appointmentId: apt._id,
            patientId: apt.patientId,
            patientName: apt.patientName,
            doctorId: apt.doctorId,
            serviceIds: [apt.serviceId],
            totalAmount: amount,
            finalAmount: amount,
            status: 'Chưa thanh toán'
        };
        try {
          await Invoice.updateOne({ appointmentId: apt._id }, { $setOnInsert: invoice }, { upsert: true, runValidators: true });
        } catch (error) {
          // Another request won the unique appointmentId insert.
          if (error.code !== 11000 || !await Invoice.exists({ appointmentId: apt._id })) throw error;
        }
    }

    res.json({ data: updated.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.finishTreatment = (req, res, next) => {
  req.body = { ...req.body, status: req.body.status ?? 'Đã hoàn thành' };
  return exports.updateAppointment(req, res, next);
};
