const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const LedgerEntry = require('../models/LedgerEntry');
const { asyncHandler } = require('../middleware/errorHandler');

const getCustomers = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;

  const query = { is_active: true };
  if (search) {
    query.$or = [
      { customer_name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') }
    ];
  }

  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .sort({ customer_name: 1 })
    .skip((page - 1) * Number(limit))
    .limit(Number(limit));

  // Add invoice count
  const ids = customers.map(c => c._id);
  const counts = await Sale.aggregate([
    { $match: { customer_id: { $in: ids } } },
    { $group: { _id: '$customer_id', count: { $sum: 1 } } }
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[c._id.toString()] = c.count; });

  const result = customers.map(c => ({
    ...c.toJSON(),
    total_invoices: countMap[c._id.toString()] || 0
  }));

  res.json({ success: true, data: result, pagination: { total, page: Number(page), limit: Number(limit) } });
});

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

  const total_invoices = await Sale.countDocuments({ customer_id: req.params.id });
  res.json({ success: true, data: { ...customer.toJSON(), total_invoices } });
});

const createCustomer = asyncHandler(async (req, res) => {
  const { customer_name, phone, email, address } = req.body;
  if (!customer_name)
    return res.status(400).json({ success: false, message: 'Customer name is required.' });

  const customer = await Customer.create({
    customer_name,
    phone: phone || null,
    email: email || null,
    address: address || null
  });

  res.status(201).json({ success: true, message: 'Customer created successfully.', data: { id: customer._id } });
});

const updateCustomer = asyncHandler(async (req, res) => {
  const { customer_name, phone, email, address } = req.body;
  await Customer.findByIdAndUpdate(req.params.id, {
    customer_name,
    phone: phone || null,
    email: email || null,
    address: address || null
  }, { runValidators: true });

  res.json({ success: true, message: 'Customer updated successfully.' });
});

const deleteCustomer = asyncHandler(async (req, res) => {
  await Customer.findByIdAndUpdate(req.params.id, { is_active: false });
  res.json({ success: true, message: 'Customer deleted successfully.' });
});

const getCustomerLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const total = await LedgerEntry.countDocuments({ customer_id: req.params.id });
  const entries = await LedgerEntry.find({ customer_id: req.params.id })
    .sort({ entry_date: 1, createdAt: 1 })
    .skip((page - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, data: entries, pagination: { total, page: Number(page), limit: Number(limit) } });
});

const getCustomerSales = asyncHandler(async (req, res) => {
  const sales = await Sale.find({ customer_id: req.params.id })
    .sort({ sale_date: -1 });
  res.json({ success: true, data: sales });
});

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, getCustomerLedger, getCustomerSales };
