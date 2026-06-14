const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  totalAmount: { type: Number, required: true },
  finalAmount: { type: Number },
  amountPaid: { type: Number, default: 0 },
  debt: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng', 'Thẻ ATM'], default: 'Tiền mặt' },
  status: { type: String, enum: ['Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền'], default: 'Chưa thanh toán' },
}, { timestamps: true });

invoiceSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Invoice', invoiceSchema);
