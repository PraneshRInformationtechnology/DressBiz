const express = require('express');
const router = express.Router();
const {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, getLowStockProducts, getCategories
} = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.post('/', authorize('admin'), createProduct);
router.put('/:id', authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
