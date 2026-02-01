const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const app = express();

// Папка для загрузок (должна существовать для multer и раздачи картинок)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
const prisma = new PrismaClient();

/* =========================================================
   CORS
   ========================================================= */

const allowedOrigins = [
  'https://vape-shopby.netlify.app',
  'http://localhost:5173',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (Postman, server-to-server и т.д.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Preflight для всех роутов (с теми же настройками)
app.options('*', cors(corsOptions));

/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   ROUTES
   ========================================================= */

const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes = require('./src/routes/order.routes');
const pickupRoutes = require('./src/routes/pickup.routes');
const newsRoutes = require('./src/routes/news.routes');
const userRoutes = require('./src/routes/user.routes');
const adminRoutes = require('./src/routes/admin.routes');
const pickupAdminRoutes = require('./src/routes/pickupLocation.admin.routes');

// Debug middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/pickup-locations', pickupAdminRoutes);
app.use('/api/admin', adminRoutes);

// Статика (картинки товаров) — раздаём из абсолютного пути
app.use('/uploads', express.static(uploadsDir));

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.send('API is running and DB connected ✅');
  } catch (error) {
    console.error('DB CONNECTION ERROR:', error);
    res.status(500).send('API is running but DB connection failed ❌');
  }
});

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.message);
  res.status(500).json({
    message: err.message || 'Internal server error',
  });
});

/* =========================================================
   START SERVER (Railway compatible)
   ========================================================= */

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Env variables loaded: ${Object.keys(process.env).length}`);
});
