const express = require('express');
const router = express.Router();
const {
  getSalesReport, getInventoryReport, getDueReport,
  getCashFlowReport, exportReportExcel, exportReportPdf,
  getTopProducts
} = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/dues', getDueReport);
router.get('/cashflow', getCashFlowReport);
router.get('/top-products', getTopProducts);
router.get('/export/excel/:type', exportReportExcel);
router.get('/export/pdf/:type', exportReportPdf);

module.exports = router;
