const router = require("express").Router();
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/my", authMiddleware, orderController.getMyOrders);
router.post("/", authMiddleware, orderController.createOrder);
router.put("/:id/cancel", authMiddleware, orderController.cancelOrder);

// Админ
router.get("/admin", authMiddleware, orderController.getAllOrders);
router.get("/admin/analytics", authMiddleware, orderController.getAnalytics);
router.patch("/admin/:id/status", authMiddleware, orderController.updateOrderStatus);

module.exports = router;
