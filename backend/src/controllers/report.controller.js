const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const { asyncHandler } = require('../middleware/errorHandler');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Build date filter helper
const buildDateFilter = (field, from_date, to_date, period) => {
  const filter = {};
  if (period === 'daily') {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    filter[field] = { $gte: start, $lte: end };
  } else if (period === 'weekly') {
    const start = new Date(); start.setDate(start.getDate() - 7); start.setHours(0,0,0,0);
    filter[field] = { $gte: start };
  } else if (period === 'monthly') {
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
    filter[field] = { $gte: start };
  } else {
    if (from_date || to_date) {
      filter[field] = {};
      if (from_date) filter[field].$gte = new Date(from_date);
      if (to_date)   filter[field].$lte = new Date(to_date + 'T23:59:59');
    }
  }
  return filter;
};

const getSalesReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', from_date, to_date } = req.query;
  const dateFilter = buildDateFilter('sale_date', from_date, to_date, period);

  const sales = await Sale.find(dateFilter).sort({ sale_date: -1 });

  const summary = sales.reduce((acc, s) => ({
    total_revenue:  acc.total_revenue  + s.total_amount,
    total_profit:   acc.total_profit   + s.profit_amount,
    total_due:      acc.total_due      + (s.total_amount - s.amount_paid),
    total_invoices: acc.total_invoices + 1
  }), { total_revenue: 0, total_profit: 0, total_due: 0, total_invoices: 0 });

  res.json({ success: true, data: { sales, summary } });
});

const getInventoryReport = asyncHandler(async (req, res) => {
  const { type = 'all', category } = req.query;

  const matchStage = { is_active: true };
  if (category) matchStage.category = category;

  let products = await Product.aggregate([
    { $match: matchStage },
    { $addFields: {
      stock_value:  { $multiply: ['$stock_quantity', '$purchase_price'] },
      is_low_stock: { $lte: ['$stock_quantity', '$minimum_stock_level'] }
    }},
    ...(type === 'low_stock' ? [{ $match: { is_low_stock: true } }] : []),
    { $sort: { product_name: 1 } }
  ]);

  const summaryAgg = await Product.aggregate([
    { $match: { is_active: true } },
    { $addFields: { is_low: { $lte: ['$stock_quantity', '$minimum_stock_level'] } } },
    { $group: {
      _id: null,
      total_products: { $sum: 1 },
      total_units:    { $sum: '$stock_quantity' },
      total_value:    { $sum: { $multiply: ['$stock_quantity', '$purchase_price'] } },
      low_stock_count:{ $sum: { $cond: ['$is_low', 1, 0] } }
    }}
  ]);

  res.json({ success: true, data: { products, summary: summaryAgg[0] || {} } });
});

const getDueReport = asyncHandler(async (req, res) => {
  const customers = await Customer.aggregate([
    { $match: { is_active: true, total_due: { $gt: 0 } } },
    { $sort: { total_due: -1 } }
  ]);

  const summaryAgg = await Customer.aggregate([
    { $match: { is_active: true, total_due: { $gt: 0 } } },
    { $group: {
      _id: null,
      customers_with_dues: { $sum: 1 },
      total_outstanding:   { $sum: '$total_due' }
    }}
  ]);

  res.json({ success: true, data: { customers, summary: summaryAgg[0] || {} } });
});

const getCashFlowReport = asyncHandler(async (req, res) => {
  const { from_date, to_date } = req.query;
  const dateFilter = buildDateFilter('payment_date', from_date, to_date, null);

  const byMethod = await Payment.aggregate([
    ...(Object.keys(dateFilter).length ? [{ $match: dateFilter }] : []),
    { $group: {
      _id:   '$payment_method',
      total: { $sum: '$amount_received' },
      count: { $sum: 1 }
    }},
    { $project: { payment_method: '$_id', total: 1, count: 1, _id: 0 } }
  ]);

  const pendingAgg = await Customer.aggregate([
    { $match: { is_active: true } },
    { $group: { _id: null, total: { $sum: '$total_due' } } }
  ]);

  res.json({
    success: true,
    data: {
      byMethod,
      pendingCollection: pendingAgg[0]?.total || 0
    }
  });
});

const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Sale.aggregate([
    { $unwind: '$items' },
    { $group: {
      _id:           '$items.product_id',
      product_name:  { $first: '$items.product_name' },
      category:      { $first: '$items.category' },
      total_sold:    { $sum: '$items.quantity' },
      total_revenue: { $sum: { $multiply: ['$items.quantity', '$items.selling_price'] } },
      total_profit:  { $sum: { $multiply: [{ $subtract: ['$items.selling_price', '$items.cost_price'] }, '$items.quantity'] } }
    }},
    { $sort: { total_sold: -1 } },
    { $limit: Number(limit) }
  ]);

  res.json({ success: true, data: products });
});

// ─── Export Excel ────────────────────────────────────────────────────────────

const exportReportExcel = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(type.toUpperCase());

  if (type === 'sales') {
    const sales = await Sale.find().sort({ sale_date: -1 });
    sheet.columns = [
      { header: 'Invoice No',   key: 'invoice_number', width: 22 },
      { header: 'Date',         key: 'sale_date',       width: 14 },
      { header: 'Customer',     key: 'customer_name',   width: 25 },
      { header: 'Total Amount', key: 'total_amount',    width: 15 },
      { header: 'Amount Paid',  key: 'amount_paid',     width: 15 },
      { header: 'Amount Due',   key: 'amount_due',      width: 15 },
      { header: 'Profit',       key: 'profit_amount',   width: 15 },
      { header: 'Status',       key: 'payment_status',  width: 16 },
    ];
    sales.forEach(s => sheet.addRow({
      ...s.toObject(),
      sale_date:    s.sale_date?.toLocaleDateString('en-IN'),
      customer_name: s.customer_name || 'Walk-in',
      amount_due:   s.total_amount - s.amount_paid
    }));
  } else if (type === 'inventory') {
    const products = await Product.find({ is_active: true }).sort({ product_name: 1 });
    sheet.columns = [
      { header: 'Product Name',  key: 'product_name',    width: 30 },
      { header: 'Category',      key: 'category',         width: 15 },
      { header: 'Brand',         key: 'brand',            width: 15 },
      { header: 'Size',          key: 'size',             width: 10 },
      { header: 'Color',         key: 'color',            width: 10 },
      { header: 'Stock',         key: 'stock_quantity',   width: 10 },
      { header: 'Purchase Price',key: 'purchase_price',   width: 16 },
      { header: 'Selling Price', key: 'selling_price',    width: 16 },
      { header: 'Stock Value',   key: 'stock_value',      width: 15 },
    ];
    products.forEach(p => sheet.addRow({
      ...p.toObject(),
      stock_value: p.stock_quantity * p.purchase_price
    }));
  } else if (type === 'dues') {
    const customers = await Customer.find({ is_active: true, total_due: { $gt: 0 } }).sort({ total_due: -1 });
    sheet.columns = [
      { header: 'Customer',        key: 'customer_name',   width: 25 },
      { header: 'Phone',           key: 'phone',            width: 15 },
      { header: 'Total Purchased', key: 'total_purchased',  width: 18 },
      { header: 'Total Paid',      key: 'total_paid',       width: 15 },
      { header: 'Outstanding Due', key: 'total_due',        width: 18 },
    ];
    customers.forEach(c => sheet.addRow(c.toObject()));
  }

  // Style header
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

// ─── Export PDF ──────────────────────────────────────────────────────────────

const exportReportPdf = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text('Dress Business Management System', { align: 'center' });
  doc.fontSize(13).text(`${type.toUpperCase()} REPORT`, { align: 'center' });
  doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
  doc.moveDown(2);

  if (type === 'sales') {
    const sales = await Sale.find().sort({ sale_date: -1 }).limit(200);
    doc.fontSize(11).text('Sales Report', { underline: true });
    doc.moveDown();
    sales.forEach(s => {
      doc.fontSize(8).text(
        `${s.invoice_number} | ${s.sale_date?.toLocaleDateString('en-IN')} | ${s.customer_name || 'Walk-in'} | ₹${s.total_amount} | Due: ₹${(s.total_amount - s.amount_paid).toFixed(2)} | ${s.payment_status}`
      );
    });
  } else if (type === 'inventory') {
    const products = await Product.find({ is_active: true, $expr: { $lte: ['$stock_quantity', '$minimum_stock_level'] } });
    doc.fontSize(11).text('Low Stock Report', { underline: true });
    doc.moveDown();
    products.forEach(p => {
      doc.fontSize(8).text(`${p.product_name} | Stock: ${p.stock_quantity} | Min: ${p.minimum_stock_level} | ₹${p.selling_price}`);
    });
  } else if (type === 'dues') {
    const customers = await Customer.find({ is_active: true, total_due: { $gt: 0 } }).sort({ total_due: -1 });
    doc.fontSize(11).text('Outstanding Dues Report', { underline: true });
    doc.moveDown();
    customers.forEach(c => {
      doc.fontSize(8).text(`${c.customer_name} | ${c.phone || 'N/A'} | Outstanding: ₹${c.total_due.toFixed(2)}`);
    });
  }

  doc.end();
});

module.exports = { getSalesReport, getInventoryReport, getDueReport, getCashFlowReport, exportReportExcel, exportReportPdf, getTopProducts };
