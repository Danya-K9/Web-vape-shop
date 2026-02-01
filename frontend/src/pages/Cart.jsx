import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../api/api";
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCart() {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (cart.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const res = await API.get("/api/products");
      setProducts(res.data);
      setItems(cart);
      setLoading(false);
    }

    loadCart();
  }, []);

  const updateQuantity = (productId, quantity) => {
    if (!Number.isFinite(quantity) || quantity < 1) return;

    const updated = items.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    );

    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (productId) => {
    const updated = items.filter(item => item.productId !== productId);
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const clearCart = () => {
    localStorage.removeItem("cart");
    setItems([]);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const cartProducts = items
    .map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;

      return {
        ...product,
        cartQuantity: item.quantity
      };
    })
    .filter(Boolean);

  const total = cartProducts.reduce(
    (sum, p) => sum + p.price * p.cartQuantity,
    0
  );

  if (loading) return <p className="container">Загрузка...</p>;

  if (cartProducts.length === 0) {
    return <p className="container empty">Корзина пуста</p>;
  }

  return (
    <div className="cart container">
      <h1>Корзина</h1>

      <div className="cart-list">
        {cartProducts.map(p => (
          <div key={p.id} className="cart-item">
            <img
              src={getImageUrl(p.imageUrl)}
              alt={p.title}
            />

            <div className="cart-info">
              <h3>{p.title}</h3>
              <p>{p.price} BYN</p>
            </div>

            <input
              type="number"
              min={1}
              max={p.quantity}
              value={p.cartQuantity}
              onChange={e => {
                let value = Number(e.target.value);
                if (!Number.isFinite(value)) return;
                value = Math.max(1, Math.min(value, p.quantity));
                updateQuantity(p.id, value);
              }}
            />

            <span className="item-total">
              {p.price * p.cartQuantity} BYN
            </span>

            <button
              className="remove-btn"
              onClick={() => removeItem(p.id)}
            >
              ✖
            </button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <button className="clear-btn" onClick={clearCart}>
          Очистить корзину
        </button>

        <div className="total">
          Итого: <strong>{total} BYN</strong>
        </div>


        <button
          className="checkout-btn"
          onClick={() => navigate("/checkout")}
        >
          Перейти к оформлению
        </button>
      </div>
    </div>
  );
}
