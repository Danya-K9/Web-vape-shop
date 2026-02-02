import { useEffect, useState } from "react";
import API, { getImageUrl } from "../api/api";
import "./AdminProducts.css";

const CATEGORY_OPTIONS = [
  "Под системы",
  "Одноразовые электронные сигареты",
  "Жидкости",
  "Картриджи",
  "Снюс",
  "Другая",
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [customCategory, setCustomCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    costPrice: "",
    category: "",
    quantity: "",
    image: null,
  });


  /* ---------- ЗАГРУЗКА ---------- */
  const fetchProducts = async () => {
    const res = await API.get("/api/admin/products");
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ---------- HANDLERS ---------- */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, image: e.target.files[0] });
  };

  /* ---------- УДАЛЕНИЕ ---------- */
  const deleteProduct = async (id) => {
    if (!window.confirm("Удалить товар?")) return;
    try {
      await API.delete(`/api/admin/products/${id}`);
      await fetchProducts();
      setSelectedProduct(null);
    } catch (e) {
      alert(e.response?.data?.message || "Ошибка удаления товара");
    }
  };

  /* ---------- СОЗДАНИЕ / ОБНОВЛЕНИЕ ---------- */
  const submitProduct = async (e) => {
    e.preventDefault();

    const finalCategory =
      form.category === "Другая" ? customCategory : form.category;

    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("price", Number(form.price));
    data.append("costPrice", Number(form.costPrice));
    data.append("quantity", Number(form.quantity));
    data.append("category", finalCategory);

    if (form.image) {
      data.append("image", form.image);
    }

    if (editingProduct) {
      await API.put(`/api/admin/products/${editingProduct.id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      await API.post("/api/admin/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    resetForm();
    fetchProducts();
  };

  /* ---------- РЕДАКТИРОВАНИЕ ---------- */
  const startEdit = (product) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      category: product.category,
      quantity: product.quantity,
      image: null,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      price: "",
      costPrice: "", // ✅ ОБЯЗАТЕЛЬНО
      category: "",
      quantity: "",
      image: null,
    });
    setCustomCategory("");
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleRowClick = (event, product) => {
    // Не открываем панель, если клик по кнопке
    if (event.target.closest("button")) return;
    setSelectedProduct(product);
  };

  return (
    <div className="admin-products">
      {/* ---------- HEADER ---------- */}
      <div className="admin-header">
        <h2>Товары</h2>
        <button
  className="add-btn"
  onClick={() => {
    resetForm();
    setShowForm(true);
  }}
>

          ➕ Добавить товар
        </button>
      </div>

      {/* ---------- ФОРМА ---------- */}
      {showForm && (
        <form className="admin-form" onSubmit={submitProduct}>
          <h3>
            {editingProduct ? "Редактирование товара" : "Создание товара"}
          </h3>

          {editingProduct?.imageUrl && (
            <img
              src={getImageUrl(editingProduct.imageUrl)}
              alt="Текущее фото"
              className="admin-preview-image"
            />
          )}

          <input
            name="title"
            placeholder="Название"
            value={form.title}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Описание"
            value={form.description}
            onChange={handleChange}
            required
          />

          <input
            name="price"
            type="number"
            placeholder="Цена"
            value={form.price}
            onChange={handleChange}
            required
          />

          <input
            name="costPrice"
            type="number"
            placeholder="Оптовая цена"
            value={form.costPrice}
            onChange={handleChange}
            required
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Выберите категорию</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {form.category === "Другая" && (
            <input
              placeholder="Своя категория"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              required
            />
          )}

          <input
            name="quantity"
            type="number"
            placeholder="Количество"
            value={form.quantity}
            onChange={handleChange}
            required
          />

          <input type="file" accept="image/*" onChange={handleFileChange} />

          <div className="form-actions">
            <button type="submit">
              {editingProduct ? "Сохранить" : "Создать"}
            </button>
            <button type="button" onClick={resetForm}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* ---------- ТАБЛИЦА ---------- */}
      <div className="admin-table">
        <div className="admin-row header">
          <span>Фото</span>
          <span>Название</span>
          <span>Описание</span>
          <span>Цена</span>
          <span>Категория</span>
          <span>Кол-во</span>
          <span>Действия</span>
        </div>

        {products.map((p) => (
<div
  key={p.id}
  className="admin-row"
  onClick={(e) => handleRowClick(e, p)}
>
  <span className="image-cell">
    {p.imageUrl ? (
      <img
        src={getImageUrl(p.imageUrl)}
        alt={p.title}
        className="admin-product-image"
      />
    ) : "—"}
  </span>

  <span>{p.title}</span>

  {/* ОПИСАНИЕ — ТОЛЬКО ОНО */}
  <span className="description-cell">{p.description}</span>

  {/* ЦЕНА — ОТДЕЛЬНО */}
  <span>{p.price} BYN</span>

  {/* КАТЕГОРИЯ */}
  <span>{p.category}</span>

  {/* КОЛ-ВО */}
  <span>{p.quantity}</span>

  {/* ДЕЙСТВИЯ */}
  <span className="actions">
    <button
      className="edit"
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        startEdit(p);
      }}
    >
      ✏️
    </button>
    <button
      className="delete"
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        deleteProduct(p.id);
      }}
    >
      🗑
    </button>
  </span>
</div>

        ))}
      </div>

      {/* Панель с деталями товара (мобильная/общая) */}
      {selectedProduct && (
        <div className="admin-detail-overlay" onClick={() => setSelectedProduct(null)}>
          <div
            className="admin-detail-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Товар #{selectedProduct.id}</h3>

            {selectedProduct.imageUrl && (
              <img
                src={getImageUrl(selectedProduct.imageUrl)}
                alt={selectedProduct.title}
                className="admin-detail-image"
              />
            )}

            <p><strong>Название:</strong> {selectedProduct.title}</p>
            <p><strong>Описание:</strong> {selectedProduct.description}</p>
            <p><strong>Категория:</strong> {selectedProduct.category}</p>
            <p><strong>Цена:</strong> {selectedProduct.price} BYN</p>
            <p><strong>Количество:</strong> {selectedProduct.quantity}</p>

            <div className="admin-detail-actions">
              <button
                type="button"
                className="edit"
                onClick={() => {
                  startEdit(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                Редактировать
              </button>
              <button
                type="button"
                className="delete"
                onClick={() => deleteProduct(selectedProduct.id)}
              >
                Удалить
              </button>
              <button
                type="button"
                className="close-detail"
                onClick={() => setSelectedProduct(null)}
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
