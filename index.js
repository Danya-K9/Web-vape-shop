const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// ===== CORS =====
const allowedOrigins = ["https://vape-shopby.netlify.app"];
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Обработка preflight для всех роутов
app.options('*', cors());

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes = require('./src/routes/order.routes');
const pickupRoutes = require('./src/routes/pickup.routes');
const newsRoutes = require('./src/routes/news.routes');
const userRoutes = require('./src/routes/user.routes');
const adminRoutes = require("./src/routes/admin.routes");
const pickupAdminRoutes = require("./src/routes/pickupLocation.admin.routes");

app.use("/api/admin/pickup-locations", pickupAdminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/news', newsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Статика для загрузок
app.use("/uploads", express.static("uploads"));

// ===== TEST ROUTE =====
app.get('/', async (req, res) => {
  try {
    // Проверка подключения к базе
    await prisma.$queryRaw`SELECT 1`;
    res.send('API is running and DB connected ✅');
  } catch (e) {
    console.error("DB CONNECTION ERROR:", e);
    res.status(500).send('API is running but DB connection failed ❌');
  }
});

// ===== TELEGRAM BOT (ВРЕМЕННО ЗАКОММЕНТИРОВАНО) =====
// const TelegramBot = require('node-telegram-bot-api');
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
// bot.sendMessage(process.env.TELEGRAM_CHAT_ID, "Server started"); 

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
