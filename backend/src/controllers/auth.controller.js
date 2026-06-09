const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required.' });

  const user = await User.findOne({ email, is_active: true }).select('+password');
  if (!user)
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  user.last_login = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: { user, token }
  });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'Both passwords are required.' });

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch)
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = { login, logout, getMe, changePassword };
