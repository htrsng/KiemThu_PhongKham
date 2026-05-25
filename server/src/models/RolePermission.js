const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g., { 'Dashboard': { 'View': true } }
}, { timestamps: true });

rolePermissionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
