const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:      { type: String, required: true },
  collection_name: { type: String },
  record_id:  { type: mongoose.Schema.Types.ObjectId, default: null },
  old_values: { type: mongoose.Schema.Types.Mixed },
  new_values: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
