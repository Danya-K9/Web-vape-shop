const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware"); 

router.post("/send-code", authController.sendCode);
router.post("/register", authController.register);
router.post("/login", authController.login); 
router.get("/me", authMiddleware, authController.me);
router.post("/change-password", authController.changePassword);

module.exports = router;
