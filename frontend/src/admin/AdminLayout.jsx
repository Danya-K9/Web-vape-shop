import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="admin-layout">
      <button className="admin-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню">
        {menuOpen ? "✕" : "☰"}
      </button>
      <aside className={`admin-sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <h2 className="admin-title">Админка</h2>

        <NavLink to="/admin" end onClick={() => setMenuOpen(false)}>
          Dashboard
        </NavLink>

        <NavLink to="/admin/products" onClick={() => setMenuOpen(false)}>
          Товары
        </NavLink>

        <NavLink to="/admin/users" onClick={() => setMenuOpen(false)}>
          Пользователи
        </NavLink>

        <NavLink to="/admin/pickup" onClick={() => setMenuOpen(false)}>
          📍 Точки самовывоза
        </NavLink>
        
        <NavLink to="/admin/orders" onClick={() => setMenuOpen(false)}>
          Заказы
        </NavLink>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
