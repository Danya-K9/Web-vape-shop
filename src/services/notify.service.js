const nodemailer = require('nodemailer');
const axios = require('axios');

// Настройка почты
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Отправка на почту
async function notifyByEmail(subject, message) {
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL,
        subject,
        text: message
    });
}

// Отправка в Telegram
async function notifyByTelegram(message) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message
    });
}

// Универсальная функция уведомления
async function notifyAdmin(order) {
    const subject = `Новый заказ #${order.id}`;
    let message = `Пользователь: ${order.userId}\n`;
    message += `Сумма: ${order.totalPrice}\n`;
    message += `Точка выдачи: ${order.pickupLocationId}\n`;
    message += `Товары:\n`;

    order.items.forEach(item => {
        message += ` - ${item.productId} x${item.quantity} = ${item.price}\n`;
    });

    await notifyByEmail(subject, message);
    await notifyByTelegram(message);
}

module.exports = {
    notifyAdmin
};
