const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name:   { type: String }, // denormalized snapshot
  quantity:       { type: Number, required: true, min: 1 },
  purchase_price: { type: Number, required: true, min: 0 }
}, { _id: true });

purchaseItemSchema.virtual('total_price').get(function () {
  return this.quantity * this.purchase_price;
});
purchaseItemSchema.set('toJSON', { virtuals: true });

const purchaseSchema = new mongoose.Schema({
  supplier_name:  { type: String, required: true, trim: true },
  purchase_date:  { type: Date, required: true, default: Date.now },
  total_amount:   { type: Number, default: 0 },
  items:          [purchaseItemSchema],
  notes:          { type: String, default: null },
  created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

purchaseSchema.index({ purchase_date: -1 });
purchaseSchema.index({ supplier_name: 'text' });

module.exports = mongoose.model('Purchase', purchaseSchema);
