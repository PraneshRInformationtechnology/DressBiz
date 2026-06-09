const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customer_name:   { type: String, required: true, trim: true },
  phone:           { type: String, default: null },
  email:           { type: String, default: null, lowercase: true },
  address:         { type: String, default: null },
  total_purchased: { type: Number, default: 0 },
  total_paid:      { type: Number, default: 0 },
  total_due:       { type: Number, default: 0 },
  is_active:       { type: Boolean, default: true }
}, { timestamps: true });

customerSchema.index({ customer_name: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
