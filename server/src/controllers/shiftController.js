const Shift = require('../models/Shift');

// Helper: convert "HH:mm" string to minutes
const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Check if a proposed shift conflicts with existing shifts for the same doctor on the same date.
 * @param {string} doctorId
 * @param {string} date       - "YYYY-MM-DD"
 * @param {string} startTime  - "HH:mm"
 * @param {string} endTime    - "HH:mm"
 * @param {string} [excludeId] - shift _id to exclude (for updates)
 * @returns {Promise<object|null>} the conflicting shift document, or null
 */
const findConflict = async (doctorId, date, startTime, endTime, excludeId = null) => {
  const query = {
    doctorId,
    date,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  };

  const existingShifts = await Shift.find(query);

  const newStart = toMinutes(startTime);
  const newEnd   = toMinutes(endTime);

  for (const shift of existingShifts) {
    const existStart = toMinutes(shift.startTime);
    const existEnd   = toMinutes(shift.endTime);
    // Overlap condition: newStart < existEnd && newEnd > existStart
    if (newStart < existEnd && newEnd > existStart) {
      return shift;
    }
  }
  return null;
};

// POST /api/shifts — create a new shift with conflict check
exports.createShift = async (req, res, next) => {
  try {
    const { doctorId, doctorName, date, startTime, endTime, coefficient } = req.body;

    if (!doctorId || !doctorName || !date || !startTime || !endTime) {
      return res.status(400).json({
        error: 'Thiếu thông tin bắt buộc: doctorId, doctorName, date, startTime, endTime.',
      });
    }

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res.status(400).json({ error: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    if (new Date(date) < today) {
      return res.status(400).json({ error: 'Không thể thêm lịch trực vào ngày trong quá khứ' });
    }

    const LeaveRequest = require('../models/LeaveRequest');
    const onLeave = await LeaveRequest.findOne({
      doctorId,
      status: 'Approved',
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) }
    });
    if (onLeave) {
      return res.status(400).json({ error: 'Bác sĩ đang nghỉ phép vào ngày này' });
    }

    function timeToMinutes(timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    }
    
    const shifts = await Shift.find({ doctorId, date });
    if (shifts.length >= 3) {
      return res.status(400).json({ error: 'Bác sĩ không thể trực quá 3 ca một ngày' });
    }

    const st = timeToMinutes(startTime);
    const et = timeToMinutes(endTime);

    for (let s of shifts) {
      const existingSt = timeToMinutes(s.startTime);
      const existingEt = timeToMinutes(s.endTime);
      if (Math.max(st, existingSt) < Math.min(et, existingEt)) {
        return res.status(400).json({ error: 'Lịch trực bị trùng với ca đã có' });
      }
    }

    const newShift = await Shift.create(req.body);
    res.status(201).json({ data: newShift.toJSON() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/shifts/:id — update shift with conflict check (exclude self)
exports.updateShift = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doctorId, doctorName, date, startTime, endTime, coefficient, status } = req.body;

    const existing = await Shift.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy ca làm việc.' });
    }

    // Merge: use provided values or fall back to existing
    const resolvedDoctorId   = doctorId   ?? existing.doctorId.toString();
    const resolvedDoctorName = doctorName ?? existing.doctorName;
    const resolvedDate       = date       ?? existing.date;
    const resolvedStart      = startTime  ?? existing.startTime;
    const resolvedEnd        = endTime    ?? existing.endTime;

    if (toMinutes(resolvedEnd) <= toMinutes(resolvedStart)) {
      return res.status(400).json({ error: 'Giờ kết thúc phải sau giờ bắt đầu.' });
    }

    // Only run conflict check if schedule-related fields actually changed
    const scheduleChanged =
      (doctorId   && doctorId   !== existing.doctorId.toString()) ||
      (date       && date       !== existing.date) ||
      (startTime  && startTime  !== existing.startTime) ||
      (endTime    && endTime    !== existing.endTime);

    if (scheduleChanged) {
      const conflict = await findConflict(resolvedDoctorId, resolvedDate, resolvedStart, resolvedEnd, id);
      if (conflict) {
        return res.status(409).json({
          error: `Xung đột ca làm việc: Bác sĩ ${resolvedDoctorName} đã có ca từ ${conflict.startTime} đến ${conflict.endTime} vào ngày ${resolvedDate}. Vui lòng chọn khung giờ khác.`,
          conflictingShift: conflict.toJSON ? conflict.toJSON() : conflict,
        });
      }
    }

    // Apply updates
    if (doctorId   !== undefined) existing.doctorId   = doctorId;
    if (doctorName !== undefined) existing.doctorName = doctorName;
    if (date       !== undefined) existing.date       = date;
    if (startTime  !== undefined) existing.startTime  = startTime;
    if (endTime    !== undefined) existing.endTime    = endTime;
    if (coefficient !== undefined) existing.coefficient = coefficient;
    if (status     !== undefined) existing.status     = status;

    await existing.save();
    res.json({ data: existing.toJSON() });
  } catch (error) {
    next(error);
  }
};

// GET /api/shifts — get all shifts (pass-through to factory or inline)
exports.getAllShifts = async (req, res, next) => {
  try {
    const shifts = await Shift.find({}).sort({ date: 1, startTime: 1 });
    res.json({ data: shifts.map((s) => (s.toJSON ? s.toJSON() : s)) });
  } catch (error) {
    next(error);
  }
};

// GET /api/shifts/:id
exports.getShift = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Không tìm thấy ca làm việc.' });
    res.json({ data: shift.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.deleteShift = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Không tìm thấy ca làm việc.' });

    const Appointment = require('../models/Appointment');
    
    // Tạo đối tượng Date cho ca làm việc
    const [startH, startM] = shift.startTime.split(':');
    const [endH, endM] = shift.endTime.split(':');
    const shiftStart = new Date(`${shift.date}T${startH}:${startM}:00`);
    const shiftEnd = new Date(`${shift.date}T${endH}:${endM}:00`);

    const count = await Appointment.countDocuments({
       doctorId: shift.doctorId,
       startTime: { $gte: shiftStart, $lt: shiftEnd }
    });

    if (count > 0) {
      return res.status(400).json({ error: 'Không thể xóa lịch trực đã có bệnh nhân đặt hẹn' });
    }

    await Shift.findByIdAndDelete(req.params.id);
    res.json({ deletedCount: 1 });
  } catch (error) {
    next(error);
  }
};
