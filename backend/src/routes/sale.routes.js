const express = require('express');
const router = express.Router();
const {
  getSales, getSaleById, createSale, updateSale, deleteSale, getInvoice
} = require('../controllers/sale.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.get('/:id/invoice', getInvoice);
router.post('/', createSale);
router.put('/:id', authorize('admin'), updateSale);
router.delete('/:id', authorize('admin'), deleteSale);

module.exports = router;
