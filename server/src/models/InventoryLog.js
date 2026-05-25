const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  action: { type: String, enum: ['import', 'export'], required: true },
  quantity: { type: Number, required: true },
  reference: { type: String }, // e.g., 'Appointment ID' or 'Import Receipt ID'
  notes: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
}, { timestamps: true });

inventoryLogSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
