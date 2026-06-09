const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customer_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customer_name:    { type: String }, // denormalized
  sale_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  invoice_number:   { type: String }, // denormalized
  amount_received:  { type: Number, required: true, min: 0.01 },
  payment_method:   { type: String, enum: ['CASH', 'UPI', 'BANK_TRANSFER'], default: 'CASH' },
  payment_date:     { type: Date, required: true, default: Date.now },
  notes:            { type: String, default: null },
  created_by:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

paymentSchema.index({ customer_id: 1 });
paymentSchema.index({ sale_id: 1 });
paymentSchema.index({ payment_date: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
