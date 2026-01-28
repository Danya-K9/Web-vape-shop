const prisma = require('../../prisma.js');
const productService = require('../services/product.service');

// GET /api/products
async function getProducts(req, res) {
  try {
    const products = await productService.getAllProducts(req.query);
    res.json(products);
  } catch (e) {
    console.error("🔥 getProducts error:", e);
    res.status(500).json({ error: e.message });
  }
}


// GET /api/products/:id
async function getProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    res.json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка загрузки товара" });
  }
}

module.exports = {
  getProducts,
  getProduct,
};
