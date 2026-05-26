const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String },
  address: { type: String },
  
  // Additional identity
  cccd: { type: String },
  email: { type: String },
  avatarUrl: { type: String },
  
  // Medical Info
  bloodType: { type: String },
  allergies: [{ type: String }],
  backgroundDisease: { type: String },
  surgicalHistory: { type: String },
  currentMedication: { type: String },
  height: { type: Number },
  weight: { type: Number },
  bmi: { type: Number },
  
  // Emergency Contact
  emergencyContactName: { type: String },
  emergencyContactRelation: { type: String },
  emergencyContactPhone: { type: String },
  
  // Insurance
  insuranceNumber: { type: String },
  insurancePlace: { type: String },
  insuranceExpirationDate: { type: Date },
  
  // Notes
  doctorNotes: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

patientSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Patient', patientSchema);
