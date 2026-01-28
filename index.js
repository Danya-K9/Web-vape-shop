const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ===== CORS =====
const allowedOrigins = ["https://vape-shopby.netlify.app"];
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // Postman / server-to-server
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

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

// ===== TEST =====
app.get('/', (req, res) => {
  res.send('API is running');
});

// ===== START =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
