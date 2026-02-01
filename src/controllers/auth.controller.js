const prisma = require('../../prisma.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendCodeToUser } = require('../telegram/bot');

// Коды: ключ = telegramChatId (string) или email (для обратной совместимости)
const codes = new Map();

/**
 * Отправка кода в Telegram
 */
exports.sendCode = async (req, res) => {
  try {
    const { telegramChatId } = req.body;

    if (!telegramChatId) {
      return res.status(400).json({ message: 'Сначала откройте бота в Telegram и нажмите /start, затем перейдите по ссылке на сайт' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codes.set(String(telegramChatId), code);

    try {
      await sendCodeToUser(Number(telegramChatId), code);
      res.json({ message: 'Код отправлен в Telegram' });
    } catch (e) {
      console.error('TELEGRAM SEND CODE ERROR:', e);
      res.status(500).json({ message: 'Не удалось отправить код. Убедитесь, что вы начали диалог с ботом (/start)' });
    }
  } catch (e) {
    console.error('SEND CODE ERROR:', e);
    res.status(500).json({ message: 'Ошибка отправки кода' });
  }
};

/**
 * Регистрация по Telegram
 */
exports.register = async (req, res) => {
  try {
    const { telegramChatId, code, name, password } = req.body;
    const tgKey = String(telegramChatId);

    if (!telegramChatId || !code || !name || !password) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    if (codes.get(tgKey) !== code) {
      return res.status(400).json({ message: 'Неверный код' });
    }

    codes.delete(tgKey);

    const existingByTg = await prisma.user.findUnique({
      where: { telegramChatId: Number(telegramChatId) },
    });
    if (existingByTg) {
      return res.status(409).json({ message: 'Пользователь с этим Telegram уже зарегистрирован' });
    }

    const email = `tg_${telegramChatId}@telegram.local`;
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingByEmail) {
      return res.status(409).json({ message: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
    const role = adminChatId && Number(telegramChatId) === Number(adminChatId) ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        telegramChatId: Number(telegramChatId),
        role,
      },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка регистрации' });
  }
};

/**
 * Профиль
 */
exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        telegram: true,
        telegramChatId: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка профиля' });
  }
};

/**
 * Вход: по telegramChatId + пароль (для пользователей) или по email + пароль (только для бота/админа, не в UI)
 */
exports.login = async (req, res) => {
  try {
    const { telegramChatId, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Введите пароль' });
    }

    const hasTg = telegramChatId !== undefined && telegramChatId !== null && String(telegramChatId).trim() !== '';
    const hasEm = email !== undefined && email !== null && (typeof email !== 'string' ? true : email.trim() !== '');
    if (!hasTg && !hasEm) {
      return res.status(400).json({ message: 'Перейдите по ссылке из бота (нажмите /start в Telegram)' });
    }

    let user;
    if (hasTg) {
      user = await prisma.user.findUnique({
        where: { telegramChatId: Number(telegramChatId) },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { email: String(email).trim() },
      });
    }

    if (!user) {
      if (hasTg) {
        return res.status(400).json({ message: 'Пользователь не найден. Сначала откройте бота и перейдите по ссылке' });
      }
      return res.status(400).json({ message: 'Перейдите по ссылке из бота (нажмите /start в Telegram) или укажите корректные данные' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ message: 'Неверный пароль' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка входа' });
  }
};

/**
 * Смена пароля: код отправляется в Telegram
 */
exports.changePassword = async (req, res) => {
  try {
    const { telegramChatId, code, newPassword } = req.body;

    if (!telegramChatId || !code || !newPassword) {
      return res.status(400).json({ message: 'Не все данные переданы' });
    }

    const tgKey = String(telegramChatId);
    const savedCode = codes.get(tgKey);

    if (!savedCode || savedCode !== code) {
      return res.status(400).json({ message: 'Неверный код или код истёк' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramChatId: Number(telegramChatId) },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    codes.delete(tgKey);

    res.json({ message: 'Пароль успешно изменён' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка смены пароля' });
  }
};
