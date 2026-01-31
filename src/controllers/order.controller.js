const prisma = require('../../prisma.js');
const { bot, ADMIN_CHAT_ID } = require('../telegram/bot');
const { sendEmail } = require('../email/emailService');

// 🧾 Мои заказы
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        pickupLocation: true
      }
    });

    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Ошибка загрузки заказов"
    });
  }
};

// 👮‍♂️ Админ: все заказы
exports.getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Нет доступа" });
    }

    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            telegram: true
          }
        },
        pickupLocation: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка загрузки заказов" });
  }
};

// 🔄 Админ: изменить статус заказа

exports.updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Нет доступа" });
    }

    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowed = ["CONFIRMED", "CANCELLED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Неверный статус" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true, pickupLocation: true } // <- добавляем user и pickupLocation
    });

    if (!order) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    // ⚠️ нельзя отменять подтверждённый заказ
    if (order.status === "CONFIRMED" && status === "CANCELLED") {
      return res.status(400).json({
        message: "Нельзя отменить подтверждённый заказ"
      });
    }

    await prisma.$transaction(async (tx) => {

      // 🔄 возврат товара при отмене
      if (status === "CANCELLED" && order.status === "PENDING") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: { increment: item.quantity }
            }
          });
        }
      }

      // обновление статуса
      await tx.order.update({
        where: { id: orderId },
        data: { status }
      });

    });

    // -------------------
    // ✅ Отправка письма пользователю
    if (order.user?.email) {
      let subject = '';
      let message = '';

      if (status === "CONFIRMED") {
        subject = `Ваш заказ #${order.id} подтверждён`;
        message = `
          <p>Здравствуйте, ${order.user.name}!</p>
          <p>Ваш заказ #${order.id} был подтверждён.</p>
          <p>Сумма: ${order.totalPrice} BYN</p>
          <p>Самовывоз: ${order.pickupLocation?.name || '-'}</p>
          <p>Дата и время: ${order.pickupTime ? new Date(order.pickupTime).toLocaleString('ru-RU') : '-'}</p>
        `;
      } else if (status === "CANCELLED") {
        subject = `Ваш заказ #${order.id} был отменён`;
        message = `
          <p>Здравствуйте, ${order.user.name}!</p>
          <p>Ваш заказ #${order.id} был отменён.</p>
          <p>Если это ошибка, свяжитесь с нами.</p>
        `;
      }

      try {
        await sendEmail(order.user.email, subject, message);
      } catch (e) {
        console.error("EMAIL SEND ERROR:", e);
      }
    }
    // -------------------

    res.json({ message: "Статус обновлён" });
  } catch (e) {
    console.error("ADMIN STATUS ERROR:", e);
    res.status(500).json({ message: "Ошибка обновления заказа" });
  }
};


// 🛒 Создание заказа
// 🛒 Создание заказа
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pickupLocationId, pickupAt, items } = req.body;

    const date = new Date(pickupAt);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Неверная дата и время самовывоза"
      });
    }

    // 1️⃣ Проверяем пользователя и точку
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const pickup = await prisma.pickupLocation.findUnique({
      where: { id: pickupLocationId }
    });

    if (!pickup || !pickup.active) {
      return res.status(400).json({
        message: "Неверная точка самовывоза"
      });
    }

    if (!user.phone || !user.telegram) {
      return res.status(400).json({
        message: "Заполните телефон и Telegram"
      });
    }

    if (!items || !items.length) {
      return res.status(400).json({
        message: "Корзина пуста"
      });
    }

    let totalPrice = 0;

    // 2️⃣ Создаём заказ в транзакции
    const order = await prisma.$transaction(async (tx) => {
      const orderItems = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product || product.quantity < item.quantity) {
          throw new Error(`Недостаточно товара: ${product?.title || 'Неизвестно'}`);
        }

        totalPrice += product.price * item.quantity;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        });

        // резервируем товар
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return tx.order.create({
  data: {
    userId,
    pickupLocationId,
    pickupTime: date,
    totalPrice,
    status: "PENDING",
    changeFrom: req.body.changeFrom || 0,
    items: {
      create: orderItems
    }
  }
});

    });

    // 3️⃣ Загружаем заказ полностью (с include)
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: true,
        pickupLocation: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!fullOrder) {
      return res.status(500).json({
        message: "Ошибка загрузки заказа"
      });
    }

    // 4️⃣ Отправка админу в Telegram
// 4️⃣ Отправка админу в Telegram
if (ADMIN_CHAT_ID) {

  const itemsText = fullOrder.items.map(i => {
    return `• ${i.product.title}
${i.product.description || 'Без описания'}
Кол-во: ${i.quantity} шт.
Цена: ${i.price} BYN`;
  }).join('\n\n');

const text = `
🛒 НОВЫЙ ЗАКАЗ #${fullOrder.id}

📧 Email: ${fullOrder.user.email}
📞 Телефон: ${fullOrder.user.phone}
📬 Telegram: ${fullOrder.user.telegram}

📦 Сумма: ${fullOrder.totalPrice} BYN
💰 Сдача с: ${fullOrder.changeFrom && fullOrder.changeFrom > 0 ? fullOrder.changeFrom + " BYN" : "не требуется"}
📍 Самовывоз: ${fullOrder.pickupLocation?.name || '-'}

🛍 Товары:
${itemsText}

⏰ Время: ${new Date(fullOrder.pickupTime).toLocaleString('ru-RU')}
`;


  if (bot && ADMIN_CHAT_ID) {
    try {
      // ❗ Здесь добавляем присвоение message
      const message = await bot.sendMessage(ADMIN_CHAT_ID, text, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Подтвердить', callback_data: `confirm:${fullOrder.id}` },
              { text: '❌ Отменить', callback_data: `cancel:${fullOrder.id}` }
            ]
          ]
        }
      });

      // Сохраняем в заказе chat_id и message_id для дальнейшего редактирования кнопок
      await prisma.order.update({
        where: { id: fullOrder.id },
        data: {
          telegramChatId: message.chat.id,
          telegramMessageId: message.message_id
        }
      });
    } catch (e) {
      console.error("TELEGRAM SEND ERROR:", e);
    }
  } else {
    console.log('⚠️ Telegram bot not configured - skipping notification');
  }
}


    // 5️⃣ Ответ клиенту
    res.json(fullOrder);

  } catch (e) {
    console.error("ORDER CREATE ERROR:", e);

    res.status(400).json({
      message: e.message || "Ошибка создания заказа"
    });
  }
};

// ❌ Отмена заказа пользователем
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);

    // Находим заказ и подключаем все необходимые связи
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: true,
        pickupLocation: true,
      },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({ message: "Этот заказ нельзя отменить" });
    }

    // Транзакция: возвращаем товары и меняем статус
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    });

    // --------------------------
    // 🟢 Уведомление админа в Telegram
    const { bot, ADMIN_CHAT_ID } = require('../telegram/bot');

    if (ADMIN_CHAT_ID) {
      const itemsText = order.items.map(i => {
        const title = i.product?.title || 'Неизвестный товар';
        const desc = i.product?.description || '-';
        const quantity = i.quantity;
        const price = i.price;
        return `• ${title} (${quantity} × ${price} BYN)\n${desc}`;
      }).join('\n\n');

      const text = `
⚠️ Заказ #${order.id} был отменён пользователем
📧 Email: ${order.user?.email || '-'}
📞 Телефон: ${order.user?.phone || '-'}
📬 Telegram: ${order.user?.telegram || '-'}

📦 Сумма: ${order.totalPrice} BYN
📍 Самовывоз: ${order.pickupLocation?.title || '-'}

🛍 Товары:
${itemsText}

⏰ Время: ${order.pickupTime ? new Date(order.pickupTime).toLocaleString('ru-RU') : '-'}
`;

      if (bot && ADMIN_CHAT_ID) {
        try {
          await bot.sendMessage(ADMIN_CHAT_ID, text);
        } catch (e) {
          console.error("TELEGRAM NOTIFY ERROR:", e.message);
        }
      }
    }
    // --------------------------

    res.json({ message: "Заказ отменён" });
  } catch (e) {
    console.error("CANCEL ERROR:", e);
    res.status(500).json({ message: "Ошибка отмены" });
  }
};


// 📊 Админская аналитика
exports.getAnalytics = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Нет доступа" });
    }

    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const orders = await prisma.order.findMany({
      where: {
        status: "CONFIRMED",
        ...(from || to ? { createdAt: dateFilter } : {})
      },
      include: {
        user: true,
        items: {
          include: { product: true }
        }
      }
    });

    const productStats = {};
    const customerStats = {};
    const categoryStats = {};

    for (const order of orders) {
      if (!customerStats[order.userId]) {
        customerStats[order.userId] = {
          userId: order.userId,
          email: order.user.email,
          ordersCount: 0,
          totalSpent: 0
        };
      }

      customerStats[order.userId].ordersCount++;
      customerStats[order.userId].totalSpent += order.totalPrice;

      for (const item of order.items) {
        const p = item.product;

        if (!productStats[p.id]) {
          productStats[p.id] = {
            productId: p.id,
            title: p.title,
            soldQuantity: 0,
            revenue: 0,
            cost: 0
          };
        }

        productStats[p.id].soldQuantity += item.quantity;
        productStats[p.id].revenue += item.quantity * item.price;
        productStats[p.id].cost += item.quantity * p.costPrice;

        if (!categoryStats[p.category]) {
          categoryStats[p.category] = {
            category: p.category,
            soldQuantity: 0,
            revenue: 0,
            cost: 0
          };
        }

        categoryStats[p.category].soldQuantity += item.quantity;
        categoryStats[p.category].revenue += item.quantity * item.price;
        categoryStats[p.category].cost += item.quantity * p.costPrice;
      }
    }

    const products = Object.values(productStats).map(p => ({
      ...p,
      profit: p.revenue - p.cost
    }));

    const categories = Object.values(categoryStats).map(c => ({
      ...c,
      profit: c.revenue - c.cost
    }));

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = orders.length;
    const averageCheck = totalOrders ? totalRevenue / totalOrders : 0;

    res.json({
      totalRevenue,
      totalOrders,
      averageCheck,
      topProducts: products.sort((a, b) => b.soldQuantity - a.soldQuantity),
      topCustomers: Object.values(customerStats)
        .sort((a, b) => b.ordersCount - a.ordersCount)
        .slice(0, 3),
      productsStats: products,
      categoriesStats: categories
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка аналитики" });
  }
};
