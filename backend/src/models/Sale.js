const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name:  { type: String }, // denormalized
  category:      { type: String },
  quantity:      { type: Number, required: true, min: 1 },
  selling_price: { type: Number, required: true, min: 0 },
  cost_price:    { type: Number, required: true, min: 0 }
}, { _id: true });

saleItemSchema.virtual('item_profit').get(function () {
  return (this.selling_price - this.cost_price) * this.quantity;
});
saleItemSchema.set('toJSON', { virtuals: true });

const saleSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  sale_date:      { type: Date, required: true, default: Date.now },
  customer_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customer_name:  { type: String, default: null }, // denormalized
  items:          [saleItemSchema],
  total_amount:   { type: Number, required: true, default: 0 },
  amount_paid:    { type: Number, required: true, default: 0 },
  profit_amount:  { type: Number, required: true, default: 0 },
  payment_status: { type: String, enum: ['PAID', 'PARTIALLY_PAID', 'UNPAID'], default: 'UNPAID' },
  notes:          { type: String, default: null },
  created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Virtual: amount due
saleSchema.virtual('amount_due').get(function () {
  return Math.max(0, this.total_amount - this.amount_paid);
});

saleSchema.set('toJSON', { virtuals: true });
saleSchema.set('toObject', { virtuals: true });

saleSchema.index({ invoice_number: 1 });
saleSchema.index({ sale_date: -1 });
saleSchema.index({ customer_id: 1 });
saleSchema.index({ payment_status: 1 });

module.exports = mongoose.model('Sale', saleSchema);
