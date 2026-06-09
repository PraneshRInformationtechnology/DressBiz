const express = require('express');
const router = express.Router();
const {
  getPayments, getPaymentById, createPayment, deletePayment
} = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);
router.delete('/:id', authorize('admin'), deletePayment);

module.exports = router;
