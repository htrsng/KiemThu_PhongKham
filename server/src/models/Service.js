const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, match: [/^[A-Za-z0-9]+$/, 'Mã Dịch vụ chỉ được chứa chữ cái và số'] },
  name: { type: String, required: true },
  category: { type: String },
  basePrice: { type: Number, required: true },
  duration: { type: Number, required: true }, // in minutes
  commissionRate: { type: Number, default: 0.1 }, // Tỷ lệ hoa hồng (0.1 = 10%)
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

serviceSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Service', serviceSchema);
