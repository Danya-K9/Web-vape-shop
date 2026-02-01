import { useEffect, useState } from "react";
import API from "../api/api";
import "./AdminAnalytics.css";

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
  totalRevenue: 0,
  totalOrders: 0,
  averageCheck: 0,

  topProducts: [],
  topCustomers: [],
  productsStats: [],
  categoriesStats: [] // ✅
});


  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const money = v => `${Number(v || 0).toFixed(2)} BYN`;
  const totalProfit = analytics.productsStats.reduce(
    (sum, p) => sum + (p.profit || 0),
    0
  );
  
  const loadAnalytics = async () => {
    setLoading(true);

    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await API.get(
      "/api/orders/admin/analytics",
      { params }
    );

    setAnalytics(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) return <p className="container">Загрузка...</p>;

  return (
    <div className="admin-analytics container">
      <h1>📊 Аналитика</h1>

      {/* ФИЛЬТР */}
      <div className="analytics-filters">
        <input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
        />
        <input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
        />
        <button onClick={loadAnalytics}>
          Применить
        </button>
      </div>

      {/* ОБЩАЯ СТАТИСТИКА */}
      <div className="analytics-cards">
        <div className="card">
          <span>💰 Выручка</span>
          <strong>{analytics.totalRevenue} BYN</strong>
        </div>

        <div className="card">
          <span>🧾 Заказов</span>
          <strong>{analytics.totalOrders}</strong>
        </div>

        <div className="card">
          <span>📈 Общая прибыль</span>
          <strong className={totalProfit >= 0 ? "profit" : "loss"}>
            {money(totalProfit)}
          </strong>
        </div>

      </div>

      {/* 1️⃣ ТОП ТОВАРОВ */}
      <h2>🔥 Самые популярные товары</h2>

      <table className="analytics-table">
        <thead>
          <tr>
            <th>Товар</th>
            <th>Продано (шт)</th>
            <th>Выручка</th>
          </tr>
        </thead>
        <tbody>
          {analytics.topProducts.map(p => (
            <tr key={p.productId}>
              <td>{p.title}</td>
              <td>{p.soldQuantity}</td>
              <td>{p.revenue} BYN</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 2️⃣ ТОП ПОКУПАТЕЛЕЙ */}
      <h2>👥 Самые частые покупатели (TOP-3)</h2>

      <table className="analytics-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Заказов</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {analytics.topCustomers.map(u => (
            <tr key={u.userId}>
              <td>{u.email}</td>
              <td>{u.ordersCount}</td>
              <td>{u.totalSpent} BYN</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 3️⃣ ПОЛНАЯ АНАЛИТИКА ПО ТОВАРАМ */}
      <h2>📦 Аналитика по товарам</h2>

      <table className="analytics-table">
        <thead>
          <tr>
            <th>Товар</th>
            <th>Продано</th>
            <th>Выручка</th>
            <th>Себестоимость</th>
            <th>Прибыль</th>
          </tr>
        </thead>
        <tbody>
          {analytics.productsStats.map(p => (
            <tr key={p.productId}>
              <td>{p.title}</td>
              <td>{p.soldQuantity}</td>
              <td>{p.revenue} BYN</td>
              <td>{p.cost} BYN</td>
              <td className={p.profit >= 0 ? "profit" : "loss"}>
                {p.profit} BYN
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 4️⃣ АНАЛИТИКА ПО КАТЕГОРИЯМ */}
<h2>📦 Аналитика по категориям</h2>

<table className="analytics-table">
  <thead>
    <tr>
      <th>Категория</th>
      <th>Продано</th>
      <th>Выручка</th>
      <th>Себестоимость</th>
      <th>Прибыль</th>
    </tr>
  </thead>
  <tbody>
    {analytics.categoriesStats.map(c => (
      <tr key={c.category}>
        <td>{c.category}</td>
        <td>{c.soldQuantity}</td>
        <td>{money(c.revenue)}</td>
        <td>{money(c.cost)}</td>
        <td className={c.profit >= 0 ? "profit" : "loss"}>
          {money(c.profit)}
        </td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
}
