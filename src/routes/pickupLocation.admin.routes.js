const router = require("express").Router();
const controller = require("../controllers/pickupLocation.controller");
const auth = require("../middlewares/auth.middleware");
const admin = require("../middlewares/admin.middleware");

router.get("/", auth, admin, controller.getAll);
router.post("/", auth, admin, controller.create);
router.patch("/:id", auth, admin, controller.toggle);
router.delete("/:id", auth, admin, controller.delete);

module.exports = router;
