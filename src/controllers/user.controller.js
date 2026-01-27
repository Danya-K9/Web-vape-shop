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
        phone: true,
        role: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка получения профиля" });
  }
}

// PUT /api/profile/me
async function updateMe(req, res) {
  try {
    const userId = req.user.id;
    const { telegram, phone } = req.body;

    const data = {};

    if (telegram !== undefined) {
      data.telegram = telegram;
    }

    if (phone !== undefined) {
      data.phone = phone;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    res.json(user);
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
