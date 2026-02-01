import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "./Сheckout.css";

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  const [pickupLocationId, setPickupLocationId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [message, setMessage] = useState("");
  const [changeFrom, setChangeFrom] = useState(""); // сумма, с которой нужна сдача
  const [noChange, setNoChange] = useState(false);  // флаг "сдача не нужна"

  /* ---------- ЗАГРУЗКА ---------- */
  useEffect(() => {
    async function loadData() {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (savedCart.length === 0) {
        navigate("/cart");
        return;
      }

      try {
        const [productsRes, locationsRes, profileRes] = await Promise.all([
          API.get("/api/products"),
          API.get("/api/pickup"),
          API.get("/api/users/me"),
        ]);

        // 🔒 проверка профиля — нужны телефон и Telegram для связи
        if (!profileRes.data.phone || !profileRes.data.telegram) {
          sessionStorage.setItem("profileNotice", "checkout");
          navigate("/profile");
          return;
        }

        setProducts(productsRes.data);
        setLocations(locationsRes.data.filter(l => l.active));
        setCart(savedCart);
      } catch (e) {
        console.error(e);
        setMessage("Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  /* ---------- ТОВАРЫ ---------- */
  const cartProducts = cart
    .map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;

      return {
        ...product,
        quantity: item.quantity,
      };
    })
    .filter(Boolean);

  const total = cartProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  /* ---------- ОФОРМЛЕНИЕ ---------- */
  const createOrder = async () => {
    if (!pickupLocationId || !pickupDate || !pickupTime) {
      setMessage("Выберите место и время самовывоза");
      return;
    }

    try {
      setOrdering(true);
      setMessage("");

      const pickupAt = `${pickupDate}T${pickupTime}:00`;

      await API.post("/api/orders", {
        pickupLocationId: Number(pickupLocationId),
        pickupAt,
        items: cartProducts.map(p => ({
          productId: p.id,
          quantity: p.quantity,
        })),
        changeFrom: noChange ? 0 : Number(changeFrom) || 0,
      });

      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdated"));

      navigate("/profile");
    } catch (e) {
      setMessage(
        e.response?.data?.message || "Ошибка оформления заказа"
      );
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return <p className="container">Загрузка...</p>;
  }

  /* ---------- ВРЕМЕННЫЕ СЛОТЫ ---------- */
  const getTimeSlots = (selectedDate) => {
    const slots = [];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    let hour = 18;
    let minute = 30;

    const isToday = selectedDate === todayStr;

    if (isToday) {
      hour = now.getHours();
      minute = now.getMinutes();
      if (minute < 30) {
        minute = 30;
      } else {
        hour += 1;
        minute = 0;
      }
      // Минимум 18:30
      if (hour < 18 || (hour === 18 && minute < 30)) {
        hour = 18;
        minute = 30;
      }
      // Если текущее время уже после 23:00 — нет слотов
      if (hour > 23 || (hour === 23 && minute > 0)) {
        return [];
      }
    }

    while (hour < 23 || (hour === 23 && minute === 0)) {
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
      minute += 30;
      if (minute >= 60) {
        minute = 0;
        hour++;
      }
    }

    return slots;
  };

  const timeSlots = getTimeSlots(pickupDate);

  return (
    <div className="checkout container">
      <h1>Оформление заказа</h1>

      {message && <div className="checkout-message">{message}</div>}

      {/* ---------- СПИСОК ---------- */}
      <div className="checkout-items">
        {cartProducts.map(p => (
          <div key={p.id} className="checkout-item">
            <span>{p.title}</span>
            <span>{p.quantity} × {p.price} BYN</span>
          </div>
        ))}
      </div>

      <div className="checkout-total">
        Итого: <strong>{total} BYN</strong>
      </div>

      {/* ---------- САМОВЫВОЗ ---------- */}
      <select
        value={pickupLocationId}
        onChange={e => setPickupLocationId(e.target.value)}
      >
        <option value="">Выберите место самовывоза</option>
        {locations.map(l => (
          <option key={l.id} value={l.id}>
            {l.name} — {l.address}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={pickupDate}
        min={new Date().toISOString().split("T")[0]}
        onChange={e => setPickupDate(e.target.value)}
      />

      <select
        value={pickupTime}
        onChange={e => setPickupTime(e.target.value)}
      >
        <option value="">Выберите время</option>
        {timeSlots.length > 0 ? (
          timeSlots.map(slot => (
            <option key={slot} value={slot}>{slot}</option>
          ))
        ) : (
          <option value="" disabled>Нет доступного времени</option>
        )}
      </select>

      {/* ---------- СДАЧА ---------- */}
      <div className="checkout-change">
        <label className="checkout-change-label">Сдача с:</label>
        <input
          type="number"
          className="checkout-change-input"
          placeholder="Сдача с суммы"
          value={changeFrom}
          onChange={e => setChangeFrom(e.target.value)}
          disabled={noChange}
          min="0"
        />
        <label className="checkout-change-no">
          <input
            type="checkbox"
            checked={noChange}
            onChange={e => setNoChange(e.target.checked)}
          />
          <div className="text-change">Сдача не нужна</div>
        </label>
      </div>

      {/* ---------- ИНФОРМАЦИЯ ---------- */}
      <div className="checkout-info">
        <p>
          📍 Место самовывоза: <strong>{locations.find(l => l.id === Number(pickupLocationId))?.name || '-'}</strong>
        </p>
        <p>
          ⏰ Дата и время: <strong>{pickupDate && pickupTime ? `${pickupDate} ${pickupTime}` : '-'}</strong>
        </p>
        <p>
          После оформления заказа вы получите уведомление в Telegram, когда ваш заказ будет подтверждён или отменён.
        </p>
      </div>

      <button
        className="checkout-confirm"
        onClick={createOrder}
        disabled={ordering || timeSlots.length === 0}
      >
        {ordering ? "Оформление..." : "Подтвердить заказ"}
      </button>
    </div>
  );
}
