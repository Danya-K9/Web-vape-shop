const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');

// Для пользователей
router.get('/', newsController.getNews);
router.get('/product/:id', newsController.getNewsForProduct);

// Для админа
router.post('/admin', newsController.createNews);
router.delete('/admin/:id', newsController.deleteNews);

module.exports = router;
