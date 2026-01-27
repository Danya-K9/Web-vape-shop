const prisma = require("../../prisma");

// получить все точки
exports.getAll = async (req, res) => {
  const locations = await prisma.pickupLocation.findMany({
    orderBy: { id: "asc" }
  });
  res.json(locations);
};

// создать точку
exports.create = async (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({ message: "Заполните все поля" });
  }

  const location = await prisma.pickupLocation.create({
    data: { name, address }
  });

  res.json(location);
};

// включить / выключить
exports.toggle = async (req, res) => {
  const { id } = req.params;

  const location = await prisma.pickupLocation.update({
    where: { id: Number(id) },
    data: { active: req.body.active }
  });

  res.json(location);
};

// удалить
exports.delete = async (req, res) => {
  await prisma.pickupLocation.delete({
    where: { id: Number(req.params.id) }
  });

  res.json({ success: true });
};
