const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const LedgerEntry = require('../models/LedgerEntry');
const { asyncHandler } = require('../middleware/errorHandler');

// Generate invoice number: INV-YYYYMMDD-0001
const generateInvoiceNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay   = new Date(today); endOfDay.setHours(23, 59, 59, 999);
  const count = await Sale.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
  return `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

const getSales = asyncHandler(async (req, res) => {
  const { search = '', status = '', from_date, to_date, customer_id, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) query.$or = [{ invoice_number: new RegExp(search, 'i') }, { customer_name: new RegExp(search, 'i') }];
  if (status)      query.payment_status = status;
  if (customer_id) query.customer_id = customer_id;
  if (from_date || to_date) {
    query.sale_date = {};
    if (from_date) query.sale_date.$gte = new Date(from_date);
    if (to_date)   query.sale_date.$lte = new Date(to_date + 'T23:59:59');
  }

  const total = await Sale.countDocuments(query);
  const sales = await Sale.find(query)
    .sort({ sale_date: -1, createdAt: -1 })
    .skip((page - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, data: sales, pagination: { total, page: Number(page), limit: Number(limit) } });
});

const getSaleById = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('customer_id', 'customer_name phone address')
    .populate('created_by', 'name');
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found.' });

  const payments = await Payment.find({ sale_id: req.params.id }).sort({ payment_date: 1 });
  res.json({ success: true, data: { ...sale.toJSON(), payments } });
});

const createSale = asyncHandler(async (req, res) => {
  const { customer_id, sale_date, items, amount_paid, notes } = req.body;
  if (!items?.length)
    return res.status(400).json({ success: false, message: 'Sale items are required.' });

  // ── 1. Validate stock & build items ───────────────────────────────────────
  const enrichedItems = [];
  let totalAmount  = 0;
  let profitAmount = 0;

  for (const item of items) {
    const product = await Product.findById(item.product_id);
    if (!product || !product.is_active)
      return res.status(400).json({ success: false, message: 'Product not found.' });
    if (product.stock_quantity < item.quantity)
      return res.status(400).json({ success: false, message: `Insufficient stock for "${product.product_name}". Available: ${product.stock_quantity}` });

    const sellingPrice = item.selling_price != null ? Number(item.selling_price) : product.selling_price;
    const costPrice    = product.purchase_price;
    const qty          = Number(item.quantity);

    totalAmount  += sellingPrice * qty;
    profitAmount += (sellingPrice - costPrice) * qty;

    enrichedItems.push({
      product_id:    product._id,
      product_name:  product.product_name,
      category:      product.category,
      quantity:      qty,
      selling_price: sellingPrice,
      cost_price:    costPrice
    });
  }

  // ── 2. Deduct stock ────────────────────────────────────────────────────────
  for (const item of enrichedItems) {
    await Product.findByIdAndUpdate(item.product_id, { $inc: { stock_quantity: -item.quantity } });
  }

  const paidAmount    = Math.min(Number(amount_paid) || 0, totalAmount);
  const dueAmount     = totalAmount - paidAmount;                          // ← correct due
  const paymentStatus = paidAmount >= totalAmount ? 'PAID'
    : paidAmount > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

  // ── 3. Resolve customer ────────────────────────────────────────────────────
  let customerName = null;
  let customer     = null;
  if (customer_id) {
    customer = await Customer.findById(customer_id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    customerName = customer.customer_name;
  }

  const invoiceNumber = await generateInvoiceNumber();
  const saleDate      = sale_date ? new Date(sale_date) : new Date();

  // ── 4. Create sale record ──────────────────────────────────────────────────
  const sale = await Sale.create({
    invoice_number: invoiceNumber,
    sale_date:      saleDate,
    customer_id:    customer_id || null,
    customer_name:  customerName,
    items:          enrichedItems,
    total_amount:   totalAmount,
    amount_paid:    paidAmount,
    profit_amount:  profitAmount,
    payment_status: paymentStatus,
    notes:          notes || null,
    created_by:     req.user._id
  });

  // ── 5. Update customer totals & ledger ─────────────────────────────────────
  if (customer_id && customer) {
    // IMPORTANT: Only increment total_paid here if paidAmount > 0.
    // The payment record below is just for history — customer totals are
    // the single source of truth updated here only.
    await Customer.findByIdAndUpdate(customer_id, {
      $inc: {
        total_purchased: totalAmount,
        total_paid:      paidAmount,   // ← add what was actually paid now
        total_due:       dueAmount     // ← add only the unpaid portion
      }
    });

    const afterSale = await Customer.findById(customer_id);

    // Ledger: SALE debit — running balance after adding full invoice
    const balanceAfterSale = afterSale.total_due;

    await LedgerEntry.create({
      customer_id,
      entry_date:       saleDate,
      transaction_type: 'SALE',
      reference_number: invoiceNumber,
      debit:            totalAmount,
      credit:           0,
      // running_balance shows the net due AFTER this sale (already includes paidAmount deduction)
      running_balance:  balanceAfterSale,
      notes:            `Sale Invoice: ${invoiceNumber}`
    });

    // Ledger + Payment record for initial payment (if any)
    if (paidAmount > 0) {
      // Balance after payment = same as afterSale.total_due because we
      // incremented total_due by dueAmount (not totalAmount) above
      await LedgerEntry.create({
        customer_id,
        entry_date:       saleDate,
        transaction_type: 'PAYMENT',
        reference_number: invoiceNumber,
        debit:            0,
        credit:           paidAmount,
        running_balance:  balanceAfterSale,
        notes:            `Payment on Invoice: ${invoiceNumber}`
      });

      // Payment record for history/cash flow tracking
      await Payment.create({
        customer_id,
        customer_name:   customerName,
        sale_id:         sale._id,
        invoice_number:  invoiceNumber,
        amount_received: paidAmount,
        payment_method:  'CASH',
        payment_date:    saleDate,
        notes:           'Initial payment at sale',
        created_by:      req.user._id
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Sale created successfully.',
    data: { id: sale._id, invoice_number: invoiceNumber }
  });
});

const updateSale = asyncHandler(async (req, res) => {
  const { notes, sale_date } = req.body;
  await Sale.findByIdAndUpdate(req.params.id, {
    notes: notes || null,
    ...(sale_date && { sale_date: new Date(sale_date) })
  });
  res.json({ success: true, message: 'Sale updated successfully.' });
});

const deleteSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found.' });

  // Restore stock
  for (const item of sale.items) {
    await Product.findByIdAndUpdate(item.product_id, { $inc: { stock_quantity: item.quantity } });
  }

  // Reverse customer totals exactly (using what was stored on the sale)
  if (sale.customer_id) {
    const dueOnSale = sale.total_amount - sale.amount_paid;
    await Customer.findByIdAndUpdate(sale.customer_id, {
      $inc: {
        total_purchased: -sale.total_amount,
        total_paid:      -sale.amount_paid,
        total_due:       -dueOnSale
      }
    });
    await LedgerEntry.deleteMany({ reference_number: sale.invoice_number });
  }

  await Payment.deleteMany({ sale_id: sale._id });
  await Sale.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Sale deleted successfully.' });
});

const getInvoice = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('customer_id', 'customer_name phone address')
    .populate('created_by', 'name');
  if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found.' });
  res.json({ success: true, data: sale });
});

module.exports = { getSales, getSaleById, createSale, updateSale, deleteSale, getInvoice };
