const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['admin', 'staff'], default: 'staff' },
  phone:     { type: String, default: null },
  is_active: { type: Boolean, default: true },
  last_login:{ type: Date, default: null }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never return password in JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.password; return ret; }
});

module.exports = mongoose.model('User', userSchema);
