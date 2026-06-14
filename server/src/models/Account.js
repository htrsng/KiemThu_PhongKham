const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accountSchema = new mongoose.Schema({
  accountCode: { type: String, required: true, unique: true, default: () => `ACC${Date.now()}` },
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        if (!this.isModified('password')) return true;
        // Require at least 8 chars, 1 uppercase, 1 number, 1 special character
        return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
      },
      message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt.'
    }
  },
  role: { type: String, enum: ['Admin', 'Doctor', 'Reception'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'locked'], default: 'active' },
  referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  lastLoginAt: { type: Date }
}, { timestamps: true });

// Hash password before saving
accountSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
accountSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Exclude password from JSON responses
accountSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  obj.id = obj._id.toString(); // Map _id to id for frontend compatibility
  return obj;
};

module.exports = mongoose.model('Account', accountSchema);
