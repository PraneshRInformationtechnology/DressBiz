const express = require('express');
const router = express.Router();
const { getDashboardStats, getMonthlySalesTrend, getMonthlyProfitTrend, getOutstandingTrend } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/monthly-sales', getMonthlySalesTrend);
router.get('/monthly-profit', getMonthlyProfitTrend);
router.get('/outstanding-trend', getOutstandingTrend);

module.exports = router;
