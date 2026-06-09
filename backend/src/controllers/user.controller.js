const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

const getUsers = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const query = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
    : {};

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: users, pagination: { total, page: Number(page), limit: Number(limit) } });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: user });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });

  const user = await User.create({ name, email, password, role: role || 'staff', phone: phone || null });
  res.status(201).json({ success: true, message: 'User created successfully.', data: { id: user._id } });
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phone, is_active } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (phone !== undefined) updates.phone = phone;
  if (is_active !== undefined) updates.is_active = is_active;

  await User.findByIdAndUpdate(req.params.id, updates, { runValidators: true });
  res.json({ success: true, message: 'User updated successfully.' });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString())
    return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted successfully.' });
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  user.is_active = !user.is_active;
  await user.save();
  res.json({ success: true, message: 'User status updated.' });
});

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus };
