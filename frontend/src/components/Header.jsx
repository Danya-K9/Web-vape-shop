import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import "./Header.css";

export default function Header() {
  const token = localStorage.getItem("token");
  const isAuth = !!token;
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 🔐 Проверка роли
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.role === "ADMIN");
      } catch {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [token]);

  // 🛒 считаем количество товаров
  const calculateCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  useEffect(() => {
    calculateCount();

    window.addEventListener("cartUpdated", calculateCount);
    return () => {
      window.removeEventListener("cartUpdated", calculateCount);
    };
  }, []);

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  return (
    <header className="header">
      <div className="logo">VAPE SHOP</div>

      <button
        className="header-burger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Меню"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <nav className={menuOpen ? "nav-open" : ""}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Главная</Link>
        {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>Админка</Link>}
        <Link to="/cart" className="cart-link" onClick={() => setMenuOpen(false)}>
          Корзина
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
        {!isAuth ? (
          <Link to="/login" onClick={() => setMenuOpen(false)}>Вход</Link>
        ) : (
          <Link to="/profile" onClick={() => setMenuOpen(false)}>Профиль</Link>
        )}
      </nav>
    </header>
  );
}
