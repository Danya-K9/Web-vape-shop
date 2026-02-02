const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const API_URL = process.env.API_URL || 'http://localhost:5000';

const BOT_EMAIL = (process.env.BOT_ADMIN_EMAIL || '').trim();
const BOT_PASSWORD = (process.env.BOT_ADMIN_PASSWORD || '').trim();
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vape-shopby.netlify.app';

// Бот создаётся при наличии токена (для /start и отправки кодов)
const isBotConfigured = !!BOT_TOKEN;
// Логин админа для кнопок подтверждения заказов: email+пароль (админ из БД) или telegramChatId+пароль
const adminChatIdRaw = process.env.TELEGRAM_CHAT_ID || process.env.ADMIN_TELEGRAM_CHAT_ID;
const adminChatId = adminChatIdRaw !== undefined && adminChatIdRaw !== '' && adminChatIdRaw !== null
  ? String(adminChatIdRaw).trim()
  : null;
const hasEmailLogin = BOT_EMAIL.length > 0 && BOT_PASSWORD.length > 0;
const hasChatIdLogin = adminChatId && adminChatId !== '0' && BOT_PASSWORD.length > 0;
const isAdminConfigured = hasEmailLogin || hasChatIdLogin;

if (!isBotConfigured) {
  console.warn('⚠️ Telegram bot not configured - set TELEGRAM_BOT_TOKEN');
}

const bot = isBotConfigured ? new TelegramBot(BOT_TOKEN, { polling: true }) : null;

let ADMIN_TOKEN = null;

function formatDateTimeRu(value) {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Авторизация бота (для кнопок подтверждения заказов).
 * Сначала пробуем вход по Telegram (TELEGRAM_CHAT_ID + пароль), затем по email.
 * Для входа по Telegram: в БД у админа должен быть telegramChatId = TELEGRAM_CHAT_ID (можно выставить в pgAdmin).
 */
async function loginBot() {
  if (!isAdminConfigured) {
    console.log('⚠️ Bot admin login skipped - set TELEGRAM_CHAT_ID and BOT_ADMIN_PASSWORD (или BOT_ADMIN_EMAIL и BOT_ADMIN_PASSWORD) in Railway');
    return;
  }

  const tryLogin = async (payload) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, payload);
    ADMIN_TOKEN = res.data.token;
  };

  try {
    console.log('🤖 Bot admin login...');
    if (hasEmailLogin) {
      console.log('   Using BOT_ADMIN_EMAIL + password');
      await tryLogin({ email: BOT_EMAIL, password: BOT_PASSWORD });
    }
    if (!ADMIN_TOKEN && hasChatIdLogin) {
      console.log('   Using TELEGRAM_CHAT_ID + password');
      await tryLogin({ telegramChatId: adminChatId, password: BOT_PASSWORD });
    }
    if (!ADMIN_TOKEN) {
      console.log('   Skipped: set BOT_ADMIN_EMAIL and BOT_ADMIN_PASSWORD (или TELEGRAM_CHAT_ID и BOT_ADMIN_PASSWORD) in Railway');
    }
    if (ADMIN_TOKEN) console.log('✅ Bot authorized');
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
📬 Telegram: ${order.user.telegram ? (order.user.telegram.startsWith('@') ? order.user.telegram : '@' + order.user.telegram) : '-'}

📦 Сумма: ${order.totalPrice} BYN
💰 Сдача с: ${order.changeFrom && order.changeFrom > 0 ? order.changeFrom + " BYN" : "не требуется"}
📍 Самовывоз: ${order.pickupLocation?.name || '-'}

🛍 Товары:
${itemsText}

⏰ Время: ${formatDateTimeRu(order.pickupTime)}
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
