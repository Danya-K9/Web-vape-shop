import { useEffect, useState } from "react";
import API from "../api/api";
import ProductCard from "../components/ProductCard";
import "./Home.css";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const res = await API.get("/api/products");
      setProducts(res.data);

      const uniqueCategories = [...new Set(res.data.map(p => p.category))];
      setCategories(uniqueCategories);
      setSelectedCategories(uniqueCategories);
    }
    fetchProducts();
  }, []);

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategories.includes(p.category);

    const matchesStock =
      showOutOfStock ? true : p.quantity > 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const productsByCategory = selectedCategories.reduce((acc, category) => {
    acc[category] = filteredProducts.filter(p => p.category === category);
    return acc;
  }, {});

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content container">
          <span className="hero-badge">18+</span>
          <h1 className="hero-title">
            Технология вкуса.<br />
            <span className="hero-accent">Чистый пар.</span>
          </h1>
          <p className="hero-slogan">
            Премиум вейп-устройства и жидкости. Качество, которое чувствуется.
          </p>
        </div>
      </section>

      {/* Advantages */}
      <section className="advantages">
        <div className="container advantages-grid">
          <div className="advantage-card">
            <span className="advantage-icon">◆</span>
            <h3>Качество</h3>
            <p>Только проверенные бренды и оригинальная продукция</p>
          </div>
          <div className="advantage-card">
            <span className="advantage-icon">◆</span>
            <h3>Вкусы</h3>
            <p>Широкий выбор жидкостей и подбор под ваш вкус</p>
          </div>
          <div className="advantage-card">
            <span className="advantage-icon">◆</span>
            <h3>Самовывоз</h3>
            <p>Удобные точки выдачи в вашем городе</p>
          </div>
        </div>
      </section>

      {/* Products section */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Каталог</h2>
            <input
              type="text"
              className="search-input"
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="filters">
            <div className="categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`category-chip ${selectedCategories.includes(cat) ? "active" : ""}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={showOutOfStock}
                onChange={() => setShowOutOfStock(!showOutOfStock)}
              />
              <span>Показывать недоступные</span>
            </label>
          </div>

          {Object.entries(productsByCategory).map(([category, items]) =>
            items.length > 0 && (
              <div key={category} className="category-block">
                <h3 className="category-title">{category}</h3>
                <div className="products-grid">
                  {items.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
