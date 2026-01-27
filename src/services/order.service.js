
// Создать заказ
const prisma = require('../../prisma');
const { notifyAdmin } = require('./notify.service');

async function createOrder(userId, pickupLocationId, items) {
    // Проверка, что пользователь существует
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Пользователь не найден');

    // Проверка, что точка выдачи существует
    const pickup = await prisma.pickupLocation.findUnique({ where: { id: pickupLocationId } });
    if (!pickup || !pickup.active) throw new Error('Точка выдачи не найдена или неактивна');

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('Нельзя создать заказ без товаров');
    }

    // Получаем данные товаров
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
        throw new Error('Некоторые товары не найдены');
    }

    let totalPrice = 0;
    const orderItemsData = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error(`Товар с id=${item.productId} не найден`);
        if (!product.inStock) throw new Error(`Товар "${product.title}" сейчас отсутствует на складе`);

        const price = product.price * item.quantity;
        totalPrice += price;

        return {
            productId: item.productId,
            quantity: item.quantity,
            price: product.price
        };
    });

    // Создаём заказ
    const order = await prisma.order.create({
        data: {
            userId,
            pickupLocationId,
            totalPrice,
            items: {
                create: orderItemsData
            }
        },
        include: { items: { include: { product: true } }, pickupLocation: true }
    });

    // Оповещаем админа
    await notifyAdmin(order);

    return order;
}

module.exports = {
    createOrder
};


// Получить все заказы пользователя
async function getUserOrders(userId) {
    return prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: true } }, pickupLocation: true }
    });
}

// Получить все заказы (для админа)
async function getAllOrders() {
    return prisma.order.findMany({
        include: { items: { include: { product: true } }, user: true, pickupLocation: true }
    });
}

module.exports = {
    createOrder,
    getUserOrders,
    getAllOrders
};
