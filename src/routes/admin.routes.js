const express = require("express");
const router = express.Router();
router.post("/products-test", (req, res) => {
  console.log("TEST ROUTE WORKS");
  res.json({ ok: true });
});

const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const upload = require("../middlewares/multer.middleware");

// товары
router.post(
  "/products",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  adminController.createProduct
);
router.put(
  "/products/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  adminController.updateProduct
);
router.get("/products", authMiddleware, adminMiddleware, adminController.getProducts);
router.delete("/products/:id", authMiddleware, adminMiddleware, adminController.deleteProduct);

// пользователи
router.get("/users", authMiddleware, adminMiddleware, adminController.getUsers);
router.delete("/users/:id", authMiddleware, adminMiddleware, adminController.deleteUser);
router.put(
  "/users/:id/role",
  authMiddleware,
  adminMiddleware,
  adminController.updateUserRole
);


module.exports = router;
