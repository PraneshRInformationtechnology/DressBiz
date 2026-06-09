const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { asyncHandler } = require('../middleware/errorHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    revenueResult,
    profitResult,
    duesResult,
    inventoryResult,
    customerCount,
    todaySales,
    monthlySales,
    lowStockResult
  ] = await Promise.all([
    Sale.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    Sale.aggregate([{ $group: { _id: null, total: { $sum: '$profit_amount' } } }]),
    Customer.aggregate([{ $match: { is_active: true } }, { $group: { _id: null, total: { $sum: '$total_due' } } }]),
    Product.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock_quantity', '$purchase_price'] } } } }
    ]),
    Customer.countDocuments({ is_active: true }),
    Sale.aggregate([
      { $match: { sale_date: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$total_amount' }, count: { $sum: 1 } } }
    ]),
    Sale.aggregate([
      { $match: { sale_date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total_amount' }, count: { $sum: 1 } } }
    ]),
    Product.aggregate([
      { $match: { is_active: true } },
      { $addFields: { is_low: { $lte: ['$stock_quantity', '$minimum_stock_level'] } } },
      { $match: { is_low: true } },
      { $count: 'total' }
    ])
  ]);

  res.json({
    success: true,
    data: {
      totalRevenue:        revenueResult[0]?.total || 0,
      totalProfit:         profitResult[0]?.total || 0,
      totalOutstandingDues: duesResult[0]?.total || 0,
      totalInventoryValue: inventoryResult[0]?.total || 0,
      totalCustomers:      customerCount,
      todaySales:  { amount: todaySales[0]?.total || 0,   count: todaySales[0]?.count || 0 },
      monthlySales:{ amount: monthlySales[0]?.total || 0, count: monthlySales[0]?.count || 0 },
      lowStockCount: lowStockResult[0]?.total || 0
    }
  });
});

const getMonthlySalesTrend = asyncHandler(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const rows = await Sale.aggregate([
    { $match: { sale_date: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id:     { year: { $year: '$sale_date' }, month: { $month: '$sale_date' } },
        revenue: { $sum: '$total_amount' },
        count:   { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = rows.map(r => ({
    month: `${r._id.year}-${String(r._id.month).padStart(2,'0')}`,
    label: `${months[r._id.month - 1]} ${r._id.year}`,
    revenue: r.revenue,
    count:   r.count
  }));

  res.json({ success: true, data });
});

const getMonthlyProfitTrend = asyncHandler(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const rows = await Sale.aggregate([
    { $match: { sale_date: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id:     { year: { $year: '$sale_date' }, month: { $month: '$sale_date' } },
        revenue: { $sum: '$total_amount' },
        profit:  { $sum: '$profit_amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = rows.map(r => ({
    month:   `${r._id.year}-${String(r._id.month).padStart(2,'0')}`,
    label:   `${months[r._id.month - 1]} ${r._id.year}`,
    revenue: r.revenue,
    profit:  r.profit
  }));

  res.json({ success: true, data });
});

const getOutstandingTrend = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const rows = await Sale.aggregate([
    { $match: { sale_date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id:        { year: { $year: '$sale_date' }, month: { $month: '$sale_date' } },
        new_dues:   { $sum: { $subtract: ['$total_amount', '$amount_paid'] } },
        collections:{ $sum: '$amount_paid' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = rows.map(r => ({
    month:       `${r._id.year}-${String(r._id.month).padStart(2,'0')}`,
    label:       `${months[r._id.month - 1]} ${r._id.year}`,
    new_dues:    r.new_dues,
    collections: r.collections
  }));

  res.json({ success: true, data });
});

module.exports = { getDashboardStats, getMonthlySalesTrend, getMonthlyProfitTrend, getOutstandingTrend };
