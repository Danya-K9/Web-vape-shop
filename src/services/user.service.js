const prisma = require("../../prisma");

// Получить всех пользователей
async function getAllUsers() {
  return prisma.user.findMany({
    select: {
     id: true,
    email: true,
    name: true,
    birthDate: true,
    passwordHash: true,
    createdAt: true
    },
  });
}

// Получить пользователя по id
async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id: Number(id) },
  });
}

// Обновить пользователя
async function updateUser(id, data) {
  return prisma.user.update({
    where: { id: Number(id) },
    data,
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
};
