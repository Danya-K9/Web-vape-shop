const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// GET /api/products
router.get('/', productController.getProducts);

// GET /api/products/:id
router.get('/:id', productController.getProduct);

module.exports = router;
