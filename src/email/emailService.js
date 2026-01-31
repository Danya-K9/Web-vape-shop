const nodemailer = require("nodemailer");

// Проверяем наличие email конфигурации
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

if (!isEmailConfigured) {
  console.warn('⚠️ Email service not configured - missing EMAIL_USER or EMAIL_PASS');
}

// Gmail SMTP с явными настройками
const transporter = isEmailConfigured ? nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 секунд
  greetingTimeout: 10000,
  socketTimeout: 15000,
}) : null;

// Проверяем подключение при старте
if (transporter) {
  transporter.verify()
    .then(() => console.log('✅ Email service connected'))
    .catch(err => console.error('❌ Email service error:', err.message));
}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    throw new Error('Email service not configured');
  }
  
  return transporter.sendMail({
    from: `"VAPE SHOP" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };
