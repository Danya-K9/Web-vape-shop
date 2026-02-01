import { useEffect, useState } from "react";
import API, { getImageUrl } from "../api/api";
import "./AdminOrders.css";

export default function AdminOrders() {
  const [confirmData, setConfirmData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  function formatPickupDisplay(dateValue) {
    if (dateValue == null || dateValue === undefined || dateValue === "") return "—";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  async function loadOrders() {
    try {
      const res = await API.get("/api/orders/admin");
      setOrders(res.data);
    } catch {
      alert("Нет доступа");
    } finally {
      setLoading(false);
    }
  }

  function requestStatusChange(id, status) {
    setConfirmData({ id, status });
  }

  async function confirmStatusChange() {
    if (!confirmData) return;

    try {
      await API.patch(
        `/api/orders/admin/${confirmData.id}/status`,
        { status: confirmData.status }
      );

      loadOrders();
    } catch {
      alert("Ошибка");
    } finally {
      setConfirmData(null);
    }
  }

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="admin-orders">
      <h1>Заказы</h1>

      {orders.map(order => (
        <div key={order.id} className="admin-order-card">

          {/* Заголовок */}
          <div className="admin-order-header">
            <b>Заказ #{order.id}</b>

            <div className="admin-order-date">
              {new Date(order.createdAt).toLocaleString()}
            </div>

            <span className={`status ${order.status}`}>
              {order.status}
            </span>
          </div>

          {/* Пользователь */}
          <div className="admin-user">
            <h4>Покупатель</h4>

            <p>Email: {order.user.email}</p>
            <p>Имя: {order.user.name || "—"}</p>
            <p>Телефон: {order.user.phone || "—"}</p>
            <p>Telegram: {order.user.telegram || "—"}</p>
          </div>

          {/* Товары */}
          <div className="admin-items">
            <h4>Товары</h4>

            {order.items.map(i => (
              <div key={i.id} className="admin-item">
                <img
                  src={getImageUrl(i.product.imageUrl)}
                  alt=""
                />

                <div className="admin-item-info">
                  <b>{i.product.title}</b>

                  {i.product.description && (
                    <p className="admin-item-description">
                      {i.product.description}
                    </p>
                  )}

                  <div className="admin-item-meta">
                    {i.quantity} × {i.price} BYN
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Самовывоз */}
          <div className="admin-pickup">
            <h4>Самовывоз:</h4>

            <p>{order.pickupLocation?.name ?? "—"}</p>
            <p>{order.pickupLocation?.address ?? "—"}</p>

            <p className="pickup-time">
              Встреча {formatPickupDisplay(order.pickupTime)}
            </p>
          </div>

          {/* Итог */}
          <div className="admin-footer">
            <b>Итого: {order.totalPrice} BYN</b>

            {order.status === "PENDING" && (
              <div className="admin-actions">
                <button
                  className="confirm"
                  onClick={() =>
                    requestStatusChange(order.id, "CONFIRMED")
                  }
                >
                  Подтвердить
                </button>

                <button
                  className="cancel"
                  onClick={() =>
                    requestStatusChange(order.id, "CANCELLED")
                  }
                >
                  Отменить
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {confirmData && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <h3>
              {confirmData.status === "CONFIRMED"
                ? "Подтвердить заказ?"
                : "Отменить заказ?"}
            </h3>

            <p>
              Вы уверены, что хотите{" "}
              {confirmData.status === "CONFIRMED"
                ? "подтвердить"
                : "отменить"}{" "}
              заказ №{confirmData.id}?
            </p>

            <div className="confirm-actions">
              <button
                className={`confirm-btn ${
                  confirmData.status === "CANCELLED" ? "danger" : ""
                }`}
                onClick={confirmStatusChange}
              >
                Да
              </button>

              <button
                className="confirm-btn"
                onClick={() => setConfirmData(null)}
              >
                Нет
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
