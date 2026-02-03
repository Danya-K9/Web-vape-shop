import { useEffect, useState } from "react";
import API, { getImageUrl } from "../api/api";
import "./Profile.css";

export default function Profile() {
  const [showCheckoutNotice, setShowCheckoutNotice] = useState(false);

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOrderId, setConfirmOrderId] = useState(null);

  // Telegram и телефон
  const [telegram, setTelegram] = useState("");
  const [editTelegram, setEditTelegram] = useState(false);

  const [phone, setPhone] = useState("");
  const [editPhone, setEditPhone] = useState(false);

  // смена пароля
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState(0);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    async function loadData() {
      try {
        const [userRes, ordersRes] = await Promise.all([
          API.get("/api/users/me"),
          API.get("/api/orders/my"),
        ]);

        setUser(userRes.data);
        setTelegram(userRes.data.telegram || "");
        setPhone(userRes.data.phone || "");
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("PROFILE ERROR:", err);
        localStorage.removeItem("token");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("profileNotice") === "checkout") {
      sessionStorage.removeItem("profileNotice");
      setShowCheckoutNotice(true);
    }
  }, []);

  function showMessage(text) {
    setMessage(text);
    setTimeout(() => setMessage(""), 5000);
  }

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  async function saveTelegram() {
    try {
      const res = await API.put("/api/users/me", { telegram });
      setUser((prev) => ({ ...prev, telegram: res.data?.telegram ?? telegram }));
      showMessage("Telegram сохранён");
      setEditTelegram(false);
    } catch (e) {
      showMessage(e.response?.data?.message || "Ошибка сохранения Telegram");
    }
  }

  async function savePhone() {
    try {
      const res = await API.put("/api/users/me", { phone });
      setUser((prev) => ({ ...prev, phone: res.data?.phone ?? phone }));
      showMessage("Телефон сохранён");
      setEditPhone(false);
    } catch (e) {
      showMessage(e.response?.data?.message || "Ошибка сохранения телефона");
    }
  }

  async function sendPasswordCode() {
    if (!user.telegramChatId) {
      showMessage("Для смены пароля откройте бота в Telegram и нажмите /start");
      return;
    }
    try {
      await API.post("/api/auth/send-code", { telegramChatId: user.telegramChatId });
      setPasswordStep(2);
      showMessage("Код отправлен в Telegram");
    } catch (e) {
      showMessage(e.response?.data?.message || "Ошибка отправки кода");
    }
  }

  async function changePassword() {
    if (!user.telegramChatId) {
      showMessage("Привяжите Telegram через бота");
      return;
    }
    try {
      await API.post("/api/auth/change-password", {
        telegramChatId: user.telegramChatId,
        code,
        newPassword,
      });
      showMessage("Пароль успешно изменён");
      setShowPasswordModal(false);
      setPasswordStep(0);
      setCode("");
      setNewPassword("");
    } catch (e) {
      showMessage(e.response?.data?.message || "Неверный код");
    }
  }

  async function cancelOrderConfirmed() {
    if (!confirmOrderId) return;
    try {
      await API.put(`/api/orders/${confirmOrderId}/cancel`);
      const res = await API.get("/api/orders/my");
      setOrders(res.data);
      showMessage("Заказ отменён");
    } catch (e) {
      showMessage(e.response?.data?.message || "Ошибка отмены заказа");
    } finally {
      setConfirmOrderId(null);
    }
  }

  function formatPickupDateTime(dateString) {
    if (dateString == null || dateString === undefined || dateString === "") return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return "—";
    const d = String(day).padStart(2, "0");
    const m = String(month).padStart(2, "0");
    const h = String(hours).padStart(2, "0");
    const min = String(minutes).padStart(2, "0");
    return `${d}.${m}.${year} в ${h}:${min}`;
  }

  if (loading)
    return (
      <div className="profile-page">
        <p>Загрузка профиля...</p>
      </div>
    );

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Профиль</h2>

        {showCheckoutNotice && (
          <div className="profile-notice profile-notice--checkout">
            <strong>Перед оформлением заказа</strong> укажите, пожалуйста, <strong>Telegram</strong> и <strong>номер телефона</strong> ниже — так мы сможем с вами связаться и подтвердить заказ.
          </div>
        )}

        {message && <div className="profile-message">{message}</div>}

        <div className="profile-info">
          <div>
            <span>Email:</span> {user.email}
          </div>

          <div>
            <span>Имя:</span> {user.name || "Не указано"}
          </div>

          {/* Telegram */}
          <div className="profile-inline">
            <span className="profile-label">Telegram:</span>
            {editTelegram ? (
              <>
                <input
                  className="telegram-input"
                  placeholder="@username"
                  value={telegram}
                  onChange={(e) =>
                    setTelegram(e.target.value.replace("@", ""))
                  }
                />
                <button className="save-btn" onClick={saveTelegram}>
                  Сохранить
                </button>
              </>
            ) : (
              <>
                <span className="telegram-value">
                  {user.telegram ? "@" + user.telegram : "Не указан"}
                </span>
                <button
                  className="icon-btn"
                  onClick={() => setEditTelegram(true)}
                  title="Изменить Telegram"
                >
                  ✏️
                </button>
              </>
            )}
          </div>

          {/* Телефон */}
          <div className="profile-inline">
            <span className="profile-label">Телефон:</span>
            {editPhone ? (
              <>
                <input
                  className="phone-input"
                  placeholder="+375 (___) ___-__-__"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button className="save-btn" onClick={savePhone}>
                  Сохранить
                </button>
              </>
            ) : (
              <>
                <span className="phone-value">
                  {user.phone || "Не указан"}
                </span>
                <button
                  className="icon-btn"
                  onClick={() => setEditPhone(true)}
                  title="Изменить телефон"
                >
                  ✏️
                </button>
              </>
            )}
          </div>

          <div>
            <span>Дата регистрации:</span>{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="password-btn"
            onClick={() => {
              setPasswordStep(1);
              setShowPasswordModal(true);
            }}
          >
            Сменить пароль
          </button>

          <button className="logout-btn" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      {/* История заказов — последние 5 */}
      <div className="orders-card">
        <h3>История заказов</h3>
        {orders.length > 5 && (
          <p className="orders-hint">Показаны последние 5 заказов</p>
        )}

        {orders.length === 0 ? (
          <p className="empty">У вас пока нет заказов</p>
        ) : (
          <div className="orders-list">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="order-item">
                <div className="order-header">
                  <div>
                    <strong>Заказ №{order.id}</strong>
                    <div className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status === "PENDING" && "Ожидает"}
                    {order.status === "CONFIRMED" && "Подтверждён"}
                    {order.status === "CANCELLED" && "Отменён"}
                  </span>
                </div>

                <div className="order-header1">
                  Дата и время самовывоза
                  <p className="order-date-time">
                    {formatPickupDateTime(order.pickupTime)}
                  </p>
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-product">
                      <img
                        src={getImageUrl(item.productImageUrl ?? item.product?.imageUrl)}
                        alt={item.productTitle || item.product?.title || 'Товар'}
                      />
                      <div className="order-product-info">
                        <div className="product-title">{item.productTitle || item.product?.title || 'Товар'}</div>
                        {(item.productDescription ?? item.product?.description) && (
                          <div className="product-description">
                            {item.productDescription ?? item.product?.description}
                          </div>
                        )}
                        <div className="product-meta">
                          {item.quantity} × {item.price} BYN
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    Итого: <strong>{order.totalPrice} BYN</strong>
                  </div>

                  {order.status === "PENDING" && (
                    <button
                      className="cancel-btn"
                      onClick={() => setConfirmOrderId(order.id)}
                    >
                      Отменить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно смены пароля */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Смена пароля</h3>

            {passwordStep === 1 && (
              <>
                <p>Мы отправим код подтверждения в Telegram (в наш бот). Нажмите «Отправить код» — код придёт в чат с ботом.</p>
                <button onClick={sendPasswordCode}>Отправить код в Telegram</button>
              </>
            )}

            {passwordStep === 2 && (
              <>
                <input
                  placeholder="Код из Telegram"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button onClick={changePassword}>Сменить пароль</button>
              </>
            )}

            <button
              className="close-btn"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordStep(0);
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Подтверждение отмены заказа */}
      {confirmOrderId && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <h3>Отменить заказ?</h3>
            <p>Вы уверены, что хотите отменить заказ №{confirmOrderId}?</p>

            <div className="confirm-actions">
              <button
                className="confirm-btn danger"
                onClick={cancelOrderConfirmed}
              >
                Да, отменить
              </button>
              <button
                className="confirm-btn"
                onClick={() => setConfirmOrderId(null)}
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
