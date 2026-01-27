const express = require('express');
const router = express.Router();
const pickupController = require('../controllers/pickup.controller');

// Обычные маршруты для пользователей
router.get('/', pickupController.getPickupLocations);
router.get('/:id', pickupController.getPickupLocation);

// Админские маршруты
router.post('/admin', pickupController.createPickup);
router.put('/admin/:id', pickupController.updatePickup);
router.delete('/admin/:id', pickupController.deletePickup);

module.exports = router;
