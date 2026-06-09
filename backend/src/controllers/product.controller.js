const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

const getProducts = asyncHandler(async (req, res) => {
  const { search = '', category = '', page = 1, limit = 20 } = req.query;

  const query = { is_active: true };
  if (search) {
    query.$or = [
      { product_name: new RegExp(search, 'i') },
      { brand: new RegExp(search, 'i') },
      { color: new RegExp(search, 'i') }
    ];
  }
  if (category) query.category = category;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort({ product_name: 1 })
    .skip((page - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, data: products, pagination: { total, page: Number(page), limit: Number(limit) } });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, is_active: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const { product_name, category, brand, size, color, purchase_price, selling_price, stock_quantity, minimum_stock_level, description } = req.body;
  if (!product_name || !category || purchase_price == null || selling_price == null)
    return res.status(400).json({ success: false, message: 'Product name, category, purchase price and selling price are required.' });

  const product = await Product.create({
    product_name, category,
    brand: brand || null,
    size: size || null,
    color: color || null,
    purchase_price, selling_price,
    stock_quantity: stock_quantity || 0,
    minimum_stock_level: minimum_stock_level || 5,
    description: description || null
  });

  res.status(201).json({ success: true, message: 'Product created successfully.', data: { id: product._id } });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { product_name, category, brand, size, color, purchase_price, selling_price, stock_quantity, minimum_stock_level, description } = req.body;
  await Product.findByIdAndUpdate(req.params.id, {
    product_name, category,
    brand: brand || null,
    size: size || null,
    color: color || null,
    purchase_price, selling_price, stock_quantity,
    minimum_stock_level: minimum_stock_level || 5,
    description: description || null
  }, { runValidators: true });

  res.json({ success: true, message: 'Product updated successfully.' });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { is_active: false });
  res.json({ success: true, message: 'Product deleted successfully.' });
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  // Use aggregation to compare stock_quantity <= minimum_stock_level
  const products = await Product.aggregate([
    { $match: { is_active: true } },
    { $addFields: { is_low_stock: { $lte: ['$stock_quantity', '$minimum_stock_level'] } } },
    { $match: { is_low_stock: true } },
    { $sort: { stock_quantity: 1 } }
  ]);
  res.json({ success: true, data: products });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { is_active: true });
  res.json({ success: true, data: categories.sort() });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getLowStockProducts, getCategories };
