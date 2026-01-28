const prisma = require('../../prisma.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../email/emailService'); // Gmail

// Храним коды в памяти
const codes = new Map();

/**
 * Отправка кода на email (через Gmail)
 */
exports.sendCode = async (req, res) => {
  try {
    console.log("SEND CODE START", req.body);
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email обязателен" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    codes.set(email, code);
    console.log("CODE GENERATED:", code);

    // Отправка через Gmail
    try {
      await sendEmail(email, "Код подтверждения", `<h2>${code}</h2>`);
      console.log("EMAIL SENT");
      res.json({ message: "Код отправлен" });
    } catch (e) {
      console.error("EMAIL ERROR:", e);
      res.status(500).json({ message: "Ошибка отправки email" });
    }
  } catch (e) {
    console.error("SEND CODE ERROR:", e);
    res.status(500).json({ message: "Ошибка sendCode" });
  }
};


/**
 * Регистрация
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, code } = req.body;
    const role = email === process.env.ADMIN_EMAIL ? "ADMIN" : "USER";

    if (codes.get(email) !== code) {
      return res.status(400).json({ message: "Неверный код" });
    }

    codes.delete(email);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка регистрации" });
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
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (e) {
    res.status(500).json({ message: "Ошибка профиля" });
  }
};

/**
 * Логин
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка входа" });
  }
};

/**
 * Смена пароля
 */
exports.changePassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Не все данные переданы" });
    }

    const savedCode = codes.get(email);

    if (!savedCode) {
      return res.status(400).json({ message: "Код не найден или истёк" });
    }

    if (savedCode !== code) {
      return res.status(400).json({ message: "Неверный код" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Пароль слишком короткий" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    codes.delete(email);

    res.json({ message: "Пароль успешно изменён" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка смены пароля" });
  }
};
