const mongoose = require('mongoose');

const pricingPolicySchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Niêm yết', 'Bảo hiểm', 'Ưu đãi', 'VIP'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

pricingPolicySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('PricingPolicy', pricingPolicySchema);
