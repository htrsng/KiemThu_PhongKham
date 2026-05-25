const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String },
  address: { type: String },
  allergies: [{ type: String }],
}, { timestamps: true });

patientSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Patient', patientSchema);
