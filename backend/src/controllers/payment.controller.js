const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const LedgerEntry = require('../models/LedgerEntry');
const { asyncHandler } = require('../middleware/errorHandler');

const getPayments = asyncHandler(async (req, res) => {
  const { customer_id, sale_id, from_date, to_date, page = 1, limit = 20 } = req.query;

  const query = {};
  if (customer_id) query.customer_id = customer_id;
  if (sale_id)     query.sale_id = sale_id;
  if (from_date || to_date) {
    query.payment_date = {};
    if (from_date) query.payment_date.$gte = new Date(from_date);
    if (to_date)   query.payment_date.$lte = new Date(to_date + 'T23:59:59');
  }

  const payments = await Payment.find(query)
    .sort({ payment_date: -1, createdAt: -1 })
    .skip((page - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, data: payments });
});

const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
  res.json({ success: true, data: payment });
});

const createPayment = asyncHandler(async (req, res) => {
  const { customer_id, sale_id, amount_received, payment_method, payment_date, notes } = req.body;

  if (!customer_id || !sale_id || !amount_received)
    return res.status(400).json({ success: false, message: 'Customer, sale and amount are required.' });

  // ── 1. Validate ────────────────────────────────────────────────────────────
  const sale = await Sale.findOne({ _id: sale_id, customer_id });
  if (!sale)
    return res.status(404).json({ success: false, message: 'Sale not found for this customer.' });

  const remainingDue = sale.total_amount - sale.amount_paid;
  const received     = Number(amount_received);

  if (received > remainingDue + 0.01)
    return res.status(400).json({ success: false, message: `Amount exceeds outstanding due of ₹${remainingDue.toFixed(2)}.` });

  const customer = await Customer.findById(customer_id);
  if (!customer)
    return res.status(404).json({ success: false, message: 'Customer not found.' });

  const payDate = payment_date ? new Date(payment_date) : new Date();

  // ── 2. Create payment record ───────────────────────────────────────────────
  const payment = await Payment.create({
    customer_id,
    customer_name:   customer.customer_name,
    sale_id,
    invoice_number:  sale.invoice_number,
    amount_received: received,
    payment_method:  payment_method || 'CASH',
    payment_date:    payDate,
    notes:           notes || null,
    created_by:      req.user._id
  });

  // ── 3. Update sale payment status ──────────────────────────────────────────
  const newAmountPaid = sale.amount_paid + received;
  const newStatus     = newAmountPaid >= sale.total_amount ? 'PAID'
    : newAmountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

  await Sale.findByIdAndUpdate(sale_id, {
    $inc: { amount_paid: received },
    $set: { payment_status: newStatus }
  });

  // ── 4. Update customer totals ──────────────────────────────────────────────
  await Customer.findByIdAndUpdate(customer_id, {
    $inc: { total_paid: received, total_due: -received }
  });

  // ── 5. Ledger entry ────────────────────────────────────────────────────────
  const updatedCustomer = await Customer.findById(customer_id);

  await LedgerEntry.create({
    customer_id,
    entry_date:       payDate,
    transaction_type: 'PAYMENT',
    reference_number: sale.invoice_number,
    debit:            0,
    credit:           received,
    running_balance:  updatedCustomer.total_due,
    notes:            `Payment received for ${sale.invoice_number}`
  });

  res.status(201).json({ success: true, message: 'Payment recorded successfully.', data: { id: payment._id } });
});

const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

  const received = payment.amount_received;

  // Reverse sale
  const sale = await Sale.findById(payment.sale_id);
  if (sale) {
    const newPaid = Math.max(0, sale.amount_paid - received);
    await Sale.findByIdAndUpdate(payment.sale_id, {
      $inc: { amount_paid: -received },
      $set: {
        payment_status: newPaid <= 0 ? 'UNPAID' : newPaid < sale.total_amount ? 'PARTIALLY_PAID' : 'PAID'
      }
    });
  }

  // Reverse customer totals
  await Customer.findByIdAndUpdate(payment.customer_id, {
    $inc: { total_paid: -received, total_due: received }
  });

  await Payment.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Payment deleted successfully.' });
});

module.exports = { getPayments, getPaymentById, createPayment, deletePayment };
