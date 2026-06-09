const express = require('express');
const router = express.Router();
const {
  getCustomers, getCustomerById, createCustomer, updateCustomer,
  deleteCustomer, getCustomerLedger, getCustomerSales
} = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/ledger', getCustomerLedger);
router.get('/:id/sales', getCustomerSales);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;
