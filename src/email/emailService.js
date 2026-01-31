const { Resend } = require('resend');

// Проверяем наличие API ключа Resend
const isEmailConfigured = !!process.env.RESEND_API_KEY;

if (!isEmailConfigured) {
  console.warn('⚠️ Email service not configured - missing RESEND_API_KEY');
}

const resend = isEmailConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

// Email отправителя (Resend предоставляет бесплатный домен для тестов)
const FROM_EMAIL = process.env.EMAIL_FROM || 'VapeShop <onboarding@resend.dev>';

async function sendEmail(to, subject, html) {
  if (!resend) {
    throw new Error('Email service not configured - missing RESEND_API_KEY');
  }

  console.log(`📧 Sending email to: ${to}`);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }

    console.log('✅ Email sent successfully:', data?.id);
    return data;
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    throw err;
  }
}

// Проверка работоспособности при старте
if (resend) {
  console.log('✅ Resend email service initialized');
}

module.exports = { sendEmail };
