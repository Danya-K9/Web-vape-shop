const prisma = require('../../prisma');

// Получить все товары
async function getAllProducts(filters) {
    const where = {};

    if (filters.title) {
        where.title = { contains: filters.title, mode: 'insensitive' };
    }
    if (filters.minPrice) {
        where.price = { gte: parseFloat(filters.minPrice) };
    }
    if (filters.maxPrice) {
        where.price = where.price ? { ...where.price, lte: parseFloat(filters.maxPrice) } : { lte: parseFloat(filters.maxPrice) };
    }

    return prisma.product.findMany({ where });
}

// Получить товар по id
async function getProductById(id) {
    return prisma.product.findUnique({ where: { id: parseInt(id) } });
}

// Создать товар (для админа)
async function createProduct(data) {
  return prisma.product.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      category: data.category,
      quantity: data.quantity
    }
  });
}



// Обновить товар (для админа)
async function updateProduct(id, data) {
    return prisma.product.update({
        where: { id: parseInt(id) },
        data
    });
}

// Удалить товар (для админа)
async function deleteProduct(id) {
    return prisma.product.delete({ where: { id: parseInt(id) } });
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
