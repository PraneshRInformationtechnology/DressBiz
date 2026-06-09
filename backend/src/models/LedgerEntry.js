const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  customer_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  entry_date:        { type: Date, required: true, default: Date.now },
  transaction_type:  { type: String, enum: ['SALE', 'PAYMENT', 'ADJUSTMENT'], required: true },
  reference_number:  { type: String, default: null },
  debit:             { type: Number, default: 0 },
  credit:            { type: Number, default: 0 },
  running_balance:   { type: Number, required: true, default: 0 },
  notes:             { type: String, default: null }
}, { timestamps: true });

ledgerEntrySchema.index({ customer_id: 1, entry_date: 1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
