const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const API_URL = process.env.API_URL || 'http://localhost:5000';

const BOT_EMAIL = process.env.BOT_ADMIN_EMAIL;
const BOT_PASSWORD = process.env.BOT_ADMIN_PASSWORD;

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN missing');
if (!BOT_EMAIL) throw new Error('BOT_ADMIN_EMAIL missing');
if (!BOT_PASSWORD) throw new Error('BOT_ADMIN_PASSWORD missing');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let ADMIN_TOKEN = null;

/**
 * Авторизация бота
 */
async function loginBot() {
  try {
    console.log('🤖 Bot login...');

    const res = await axios.post(`${API_URL}/api/auth/login`, {
      email: BOT_EMAIL,
      password: BOT_PASSWORD
    });

    ADMIN_TOKEN = res.data.token;
    console.log('✅ Bot authorized');
  } catch (e) {
    console.error('LOGIN ERROR FULL:');
    console.error('Status:', e.response?.status);
    console.error('Data:', e.response?.data);
    console.error('Message:', e.message);
  }
}

/**
 * Axios с токеном
 */
function api() {
  if (!ADMIN_TOKEN) throw new Error('Bot not authorized');

  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`
    }
  });
}

/**
 * Получить заказ по ID (вариант 1: ищем в списке всех заказов)
 */
async function getOrder(orderId) {
const res = await api().get(`/api/orders/admin`);
  const order = res.data.find(o => o.id === Number(orderId));
  if (!order) throw new Error('Заказ не найден');
  return order;
}

/**
 * Обработка кнопок подтверждения / отмены
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  const [action, orderId] = query.data.split(':');

  if (!['confirm', 'cancel'].includes(action)) return;

  try {
    const status = action === 'confirm' ? 'CONFIRMED' : 'CANCELLED';

    // Обновление статуса через PATCH
    await api().patch(`/api/orders/admin/${orderId}/status`, { status });

    // Получаем заказ
    const order = await getOrder(orderId);

    // Формируем текст с товарами
    const itemsText = order.items.map(i => {
      return `• ${i.product.title}
${i.product.description || 'Без описания'}
Кол-во: ${i.quantity} шт.
Цена: ${i.price} BYN`;
    }).join('\n\n');

const text = `
🛒 Заказ #${order.id}
Статус: ${order.status}

📧 Email: ${order.user.email}
📞 Телефон: ${order.user.phone}
📬 Telegram: ${order.user.telegram}

📦 Сумма: ${order.totalPrice} BYN
💰 Сдача с: ${order.changeFrom && order.changeFrom > 0 ? order.changeFrom + " BYN" : "не требуется"}
📍 Самовывоз: ${order.pickupLocation?.name || '-'}

🛍 Товары:
${itemsText}

⏰ Время: ${new Date(order.pickupTime).toLocaleString('ru-RU')}
`;


    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId
    });

    await bot.answerCallbackQuery(query.id, { text: 'Готово ✅' });
  } catch (e) {
    console.error('BOT ERROR:', e.response?.data || e.message);

    if (e.response?.status === 401) {
      // если токен протух — логинимся заново
      await loginBot();
    }

    await bot.answerCallbackQuery(query.id, { text: 'Ошибка ❌' });
  }
});

/**
 * Старт
 */
(async () => {
  await loginBot();
  console.log('🤖 Telegram bot started');
})();

module.exports = {
  bot,
  ADMIN_CHAT_ID
};
