const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("AUTH HEADERS:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ message: "Нет токена" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 ВОТ ЭТОГО У ТЕБЯ НЕТ
    req.user = decoded;

    next();
  } catch (e) {
    return res.status(401).json({ message: "Неверный токен" });
  }
};
