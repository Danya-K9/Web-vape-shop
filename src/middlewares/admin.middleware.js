module.exports = function (req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Пользователь не авторизован" });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Доступ запрещён" });
  }

  next();
};
