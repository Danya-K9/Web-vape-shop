const prisma = require('../../prisma.js');
const userService = require('../services/user.service');

// GET /api/profile/me
async function getProfile(req, res) {
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
        createdAt: true
      }
    });

    if (user && typeof user.telegramChatId === 'bigint') {
      user.telegramChatId = user.telegramChatId.toString();
    }
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка получения профиля" });
  }
}

// PUT /api/users/me
async function updateMe(req, res) {
  try {
    const userId = req.user.id;
    const { telegram, phone } = req.body;

    const data = {};

    if (telegram !== undefined) {
      data.telegram = String(telegram).trim();
    }

    if (phone !== undefined) {
      data.phone = String(phone).trim();
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        telegram: true,
        telegramChatId: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    const out = { ...user };
    if (typeof out.telegramChatId === 'bigint') {
      out.telegramChatId = out.telegramChatId.toString();
    }
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "Ошибка сохранения данных" });
  }
}

// GET /api/users
async function getAllUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

// Обновление профиля (если нужен отдельный endpoint)
async function updateProfile(req, res) {
  try {
    const user = await userService.updateUser(req.user.id, req.body);
    res.json({ message: "Profile updated", user });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
}

module.exports = {
  getProfile,
  updateMe,
  getAllUsers,
  updateProfile,
};
