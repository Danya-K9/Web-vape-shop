import { useEffect, useState } from "react";
import API from "../api/api";
import "./AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const currentUserId = Number(localStorage.getItem("userId"));
  const [selectedUser, setSelectedUser] = useState(null);

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

  const handleRowClick = (event, user) => {
    if (event.target.closest("button") || event.target.closest("select")) return;
    setSelectedUser(user);
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
          <div
            key={u.id}
            className="admin-row"
            onClick={(e) => handleRowClick(e, u)}
          >
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteUser(u.id);
                  }}
                >
                  🗑
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      {selectedUser && (
        <div className="admin-detail-overlay" onClick={() => setSelectedUser(null)}>
          <div
            className="admin-detail-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Пользователь #{selectedUser.id}</h3>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Телефон:</strong> {selectedUser.phone || "—"}</p>
            <p><strong>Telegram:</strong> {selectedUser.telegram || "—"}</p>
            <p>
              <strong>Регистрация:</strong>{" "}
              {selectedUser.createdAt
                ? new Date(selectedUser.createdAt).toLocaleString("ru-RU")
                : "—"}
            </p>

            <div className="admin-detail-actions">
              <label>
                Роль:
                <select
                  value={selectedUser.role}
                  onChange={async (e) => {
                    const role = e.target.value;
                    await changeRole(selectedUser.id, role);
                    setSelectedUser({ ...selectedUser, role });
                  }}
                  disabled={selectedUser.id === currentUserId}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>

              {selectedUser.id !== currentUserId && (
                <button
                  type="button"
                  className="delete"
                  onClick={async () => {
                    await deleteUser(selectedUser.id);
                    setSelectedUser(null);
                  }}
                >
                  Удалить
                </button>
              )}

              <button
                type="button"
                className="close-detail"
                onClick={() => setSelectedUser(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
