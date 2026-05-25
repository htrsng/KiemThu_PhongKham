const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  account: { type: String, required: true },
  action: { type: String, required: true },
  ipAddress: { type: String },
  result: { type: String },
});

auditLogSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
