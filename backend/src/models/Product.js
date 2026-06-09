const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_name:        { type: String, required: true, trim: true },
  category:            { type: String, required: true },
  brand:               { type: String, default: null },
  size:                { type: String, default: null },
  color:               { type: String, default: null },
  purchase_price:      { type: Number, required: true, min: 0, default: 0 },
  selling_price:       { type: Number, required: true, min: 0, default: 0 },
  stock_quantity:      { type: Number, required: true, min: 0, default: 0 },
  minimum_stock_level: { type: Number, default: 5 },
  description:         { type: String, default: null },
  is_active:           { type: Boolean, default: true }
}, { timestamps: true });

// Virtual: is low stock
productSchema.virtual('is_low_stock').get(function () {
  return this.stock_quantity <= this.minimum_stock_level;
});

// Virtual: stock value
productSchema.virtual('stock_value').get(function () {
  return this.stock_quantity * this.purchase_price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ product_name: 'text', brand: 'text', color: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ stock_quantity: 1 });

module.exports = mongoose.model('Product', productSchema);
