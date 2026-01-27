const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Отправка письма
 * @param {string} to - получатель
 * @param {string} subject - тема письма
 * @param {string} html - html контент письма
 */
async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: `"VAPE SHOP" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendEmail };
