const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const purchaseRoutes = require('./purchase.routes');
const customerRoutes = require('./customer.routes');
const saleRoutes = require('./sale.routes');
const paymentRoutes = require('./payment.routes');
const reportRoutes = require('./report.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', saleRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
