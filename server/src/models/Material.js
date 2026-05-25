const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  materialCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  unit: { type: String, required: true }, // e.g., 'ống', 'lọ', 'hộp'
  quantity: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 5 }, // Alert threshold
  costPrice: { type: Number, default: 0 },
}, { timestamps: true });

materialSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Material', materialSchema);
