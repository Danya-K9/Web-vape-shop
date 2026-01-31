const nodemailer = require("nodemailer");

// Проверяем наличие email конфигурации
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

if (!isEmailConfigured) {
  console.warn('⚠️ Email service not configured - missing EMAIL_USER or EMAIL_PASS');
}

const transporter = isEmailConfigured ? nodemailer.createTransport({
  service: 'gmail', // Используем Gmail напрямую
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
}) : null;

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
