const newsService = require('../services/news.service');

// GET /news
async function getNews(req, res) {
    try {
        const news = await newsService.getAllNews();
        res.json(news);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// GET /news/product/:id
async function getNewsForProduct(req, res) {
    try {
        const news = await newsService.getNewsByProduct(req.params.id);
        res.json(news);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// POST /news/admin
async function createNews(req, res) {
    try {
        const news = await newsService.createNews(req.body);
        res.json(news);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

// DELETE /news/admin/:id
async function deleteNews(req, res) {
    try {
        await newsService.deleteNews(req.params.id);
        res.json({ message: 'News deleted' });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

module.exports = {
    getNews,
    getNewsForProduct,
    createNews,
    deleteNews
};
