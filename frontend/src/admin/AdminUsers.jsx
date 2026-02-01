import { useEffect, useState } from "react";
import API from "../api/api";
import "./AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const currentUserId = Number(localStorage.getItem("userId"));

  const fetchUsers = async () => {
    const res = await API.get("/api/admin/users");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Удалить пользователя?")) return;
    await API.delete(`/api/admin/users/${id}`);
    fetchUsers();
  };

  const changeRole = async (id, role) => {
    await API.put(`/api/admin/users/${id}/role`, { role });
    fetchUsers();
  };

  return (
    <div className="admin-users">
      <h2>Пользователи</h2>

      <div className="admin-table">
        <div className="admin-row header">
          <span>ID</span>
          <span>Email</span>
          <span>Телефон</span>
          <span>Telegram</span>
          <span>Роль</span>
          <span>Регистрация</span>
          <span>Действия</span>
        </div>

        {users.map((u) => (
          <div key={u.id} className="admin-row">
            <span>{u.id}</span>
            <span>{u.email}</span>
            <span>{u.phone || "—"}</span>
            <span>{u.telegram || "—"}</span>

            <span>
              <select
                value={u.role}
                onChange={(e) => changeRole(u.id, e.target.value)}
                disabled={u.id === currentUserId}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </span>

            <span>
              {new Date(u.createdAt).toLocaleDateString()}
            </span>

            <span>
              {u.id !== currentUserId && (
                <button
                  className="delete"
                  onClick={() => deleteUser(u.id)}
                >
                  🗑
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
