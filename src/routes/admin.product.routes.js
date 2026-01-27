const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.post(
  '/products',
  upload.single("image"),
  adminController.createProduct
);

router.put(
  '/products/:id',
  upload.single("image"),
  adminController.updateProduct
);

router.delete(
  '/products/:id',
  adminController.deleteProduct
);

module.exports = router;
