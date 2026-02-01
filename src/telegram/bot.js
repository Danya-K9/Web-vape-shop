const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const API_URL = process.env.API_URL || 'http://localhost:5000';

const BOT_EMAIL = process.env.BOT_ADMIN_EMAIL;
const BOT_PASSWORD = process.env.BOT_ADMIN_PASSWORD;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vape-shopby.netlify.app';

// Бот создаётся при наличии токена (для /start и отправки кодов)
const isBotConfigured = !!BOT_TOKEN;
// Логин админа нужен только для кнопок подтверждения заказов (TELEGRAM_CHAT_ID админа + пароль)
const adminChatId = process.env.TELEGRAM_CHAT_ID || process.env.ADMIN_TELEGRAM_CHAT_ID;
const isAdminConfigured = !!(adminChatId && BOT_PASSWORD);

if (!isBotConfigured) {
  console.warn('⚠️ Telegram bot not configured - set TELEGRAM_BOT_TOKEN');
}

const bot = isBotConfigured ? new TelegramBot(BOT_TOKEN, { polling: true }) : null;

let ADMIN_TOKEN = null;

/**
 * Авторизация бота (для кнопок подтверждения заказов — нужны BOT_ADMIN_EMAIL и BOT_ADMIN_PASSWORD)
 */
async function loginBot() {
  if (!isAdminConfigured) {
    console.log('⚠️ Bot admin login skipped - set BOT_ADMIN_EMAIL and BOT_ADMIN_PASSWORD for order buttons');
    return;
  }

  try {
    console.log('🤖 Bot admin login...');

    const res = await axios.post(`${API_URL}/api/auth/login`, {
      telegramChatId: adminChatId,
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
 * Отправить код подтверждения пользователю в Telegram (для авторизации на сайте)
 */
async function sendCodeToUser(chatId, code) {
  if (!bot) throw new Error('Telegram bot not configured');
  await bot.sendMessage(chatId, `🔐 Ваш код подтверждения: ${code}\n\nВведите его на сайте.`);
}

/**
 * Команда /start — даём ссылку на регистрацию/вход
 */
if (bot) {
  bot.on('message', (msg) => {
    const text = msg.text || '';
    const chatId = msg.chat.id;
    if (text === '/start') {
      const tgId = msg.from.id;
      const link = `${FRONTEND_URL}/register?tg_id=${tgId}`;
      const linkLogin = `${FRONTEND_URL}/login?tg_id=${tgId}`;
      bot.sendMessage(
        chatId,
        `👋 Добро пожаловать!\n\n` +
        `📝 Регистрация: ${link}\n\n` +
        `🔑 Вход: ${linkLogin}\n\n` +
        `Перейдите по ссылке и следуйте инструкциям на сайте.`
      );
    }
  });
}

/**
 * Обработка кнопок подтверждения / отмены
 */
if (bot) {
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
}

/**
 * Старт
 */
(async () => {
  await loginBot();
  if (isBotConfigured) {
    console.log('🤖 Telegram bot started ( /start works )');
  } else {
    console.log('⚠️ Telegram bot disabled - set TELEGRAM_BOT_TOKEN to enable');
  }
})();

module.exports = {
  bot,
  ADMIN_CHAT_ID,
  sendCodeToUser
};
