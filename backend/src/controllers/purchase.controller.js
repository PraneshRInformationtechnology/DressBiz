const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

const getPurchases = asyncHandler(async (req, res) => {
  const { search = '', from_date, to_date, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) query.supplier_name = new RegExp(search, 'i');
  if (from_date || to_date) {
    query.purchase_date = {};
    if (from_date) query.purchase_date.$gte = new Date(from_date);
    if (to_date)   query.purchase_date.$lte = new Date(to_date + 'T23:59:59');
  }

  const total = await Purchase.countDocuments(query);
  const purchases = await Purchase.find(query)
    .populate('created_by', 'name')
    .sort({ purchase_date: -1 })
    .skip((page - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, data: purchases, pagination: { total, page: Number(page), limit: Number(limit) } });
});

const getPurchaseById = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id).populate('created_by', 'name');
  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found.' });
  res.json({ success: true, data: purchase });
});

const createPurchase = asyncHandler(async (req, res) => {
  const { supplier_name, purchase_date, items, notes } = req.body;
  if (!supplier_name || !purchase_date || !items?.length)
    return res.status(400).json({ success: false, message: 'Supplier, date and items are required.' });

  // Validate products first
  for (const item of items) {
    const product = await Product.findById(item.product_id);
    if (!product)
      return res.status(400).json({ success: false, message: `Product ${item.product_id} not found.` });
  }

  let total_amount = 0;
  const enrichedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product_id);
    total_amount += item.quantity * item.purchase_price;
    enrichedItems.push({
      product_id:     product._id,
      product_name:   product.product_name,
      quantity:       item.quantity,
      purchase_price: item.purchase_price
    });

    // Update stock and latest purchase price
    await Product.findByIdAndUpdate(product._id, {
      $inc: { stock_quantity: item.quantity },
      $set: { purchase_price: item.purchase_price }
    });
  }

  const purchase = await Purchase.create({
    supplier_name,
    purchase_date:  new Date(purchase_date),
    total_amount,
    items:          enrichedItems,
    notes:          notes || null,
    created_by:     req.user._id
  });

  res.status(201).json({ success: true, message: 'Purchase created successfully.', data: { id: purchase._id } });
});

const updatePurchase = asyncHandler(async (req, res) => {
  const { supplier_name, purchase_date, notes } = req.body;
  await Purchase.findByIdAndUpdate(req.params.id, {
    supplier_name,
    purchase_date: new Date(purchase_date),
    notes: notes || null
  });
  res.json({ success: true, message: 'Purchase updated successfully.' });
});

const deletePurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found.' });

  // Reverse stock sequentially
  for (const item of purchase.items) {
    await Product.findByIdAndUpdate(item.product_id, { $inc: { stock_quantity: -item.quantity } });
  }

  await Purchase.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Purchase deleted successfully.' });
});

module.exports = { getPurchases, getPurchaseById, createPurchase, updatePurchase, deletePurchase };
