const prisma = require('../../prisma');

// Получить все новости
async function getAllNews() {
    return prisma.productNews.findMany({
        orderBy: { createdAt: 'desc' },
        include: { product: true }
    });
}

// Получить новости для конкретного товара
async function getNewsByProduct(productId) {
    return prisma.productNews.findMany({
        where: { productId: parseInt(productId) },
        orderBy: { createdAt: 'desc' }
    });
}

// Создать новость (админ)
async function createNews(data) {
    return prisma.productNews.create({ data });
}

// Удалить новость (админ)
async function deleteNews(id) {
    return prisma.productNews.delete({ where: { id: parseInt(id) } });
}

module.exports = {
    getAllNews,
    getNewsByProduct,
    createNews,
    deleteNews
};
