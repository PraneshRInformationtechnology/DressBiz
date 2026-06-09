const express = require('express');
const router = express.Router();
const {
  getPurchases, getPurchaseById, createPurchase, updatePurchase, deletePurchase
} = require('../controllers/purchase.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

module.exports = router;
