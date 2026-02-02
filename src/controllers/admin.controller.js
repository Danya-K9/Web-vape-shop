const prisma = require('../../prisma.js');

// 📊 статистика
exports.getStats = async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    const productsCount = await prisma.product.count();

    res.json({ users: usersCount, products: productsCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка админки' });
  }
};

// 👤 пользователи
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        phone: true,
        telegram: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения пользователей' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Пользователь удалён' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка удаления пользователя' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Неверная роль" });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });

    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка обновления роли" });
  }
};

// 📦 товары
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения товаров' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    console.log("CREATE PRODUCT CALLED");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      title,
      description,
      price,
      costPrice,
      category,
      quantity,
    } = req.body;

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description,
        price: Number(price),
        costPrice: Number(costPrice),
        category,
        quantity: Number(quantity),
        imageUrl,
      },
    });

    res.json(product);
  } catch (e) {
    console.error("CREATE PRODUCT ERROR:", e);
    res.status(500).json({ message: "Ошибка создания товара" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, quantity } = req.body;

    const data = {
      title,
      description,
      price: Number(price),
      category,
      quantity: Number(quantity),
    };

    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data,
    });

    res.json(product);
  } catch (e) {
    console.error("UPDATE PRODUCT ERROR:", e);
    res.status(500).json({ message: "Ошибка обновления товара" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);

    // Нельзя удалить товар, если он участвует в заказах (FK на OrderItem)
    if (e.code === 'P2003') {
      return res.status(400).json({
        message: 'Нельзя удалить товар, так как он уже есть в оформленных заказах',
      });
    }

    res.status(500).json({ message: 'Ошибка удаления товара' });
  }
};
