import { getImageUrl } from "../api/api";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const exists = cart.find(item => item.productId === product.id);

    if (exists) {
      showCartWarning();
      return;
    }

    cart.push({
      productId: product.id,
      quantity: 1
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    window.dispatchEvent(new Event("cartUpdated"));
    showCartSuccess();
  };

  const showCartWarning = () => {
    const event = new CustomEvent("notify", {
      detail: {
        type: "warning",
        message:
          "Товар уже добавлен в корзину. Чтобы изменить количество или удалить его — перейдите в корзину."
      }
    });

    window.dispatchEvent(event);
  };

  const showCartSuccess = () => {
    const event = new CustomEvent("notify", {
      detail: {
        type: "success",
        message: "Товар добавлен в корзину"
      }
    });

    window.dispatchEvent(event);
  };

  const isOutOfStock = product.quantity === 0;

  return (
    <div className={`card ${isOutOfStock ? "out-of-stock" : ""}`}>
      <img
  src={getImageUrl(product.imageUrl)}
  alt={product.title}
/>


      <div className="card-body">
        <h3>{product.title}</h3>
        <p className="category">{product.category}</p>
        <p>{product.description}</p>

        <p className="stock">
          {isOutOfStock ? "Нет в наличии" : `В наличии: ${product.quantity}`}
        </p>

        <div className="card-footer">
          <span className="price">{product.price} BYN</span>

          <button
            disabled={isOutOfStock}
            onClick={addToCart}
            className="btn"
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}
