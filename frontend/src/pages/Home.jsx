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
    <div className="home container">
      {/* 🔍 ПОИСК */}
      <input
        type="text"
        className="search-input"
        placeholder="Поиск товара..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* ☑️ ФИЛЬТРЫ */}
      <div className="filters">
        <div className="categories">
          {categories.map(cat => (
            <label key={cat} className="checkbox">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={showOutOfStock}
            onChange={() => setShowOutOfStock(!showOutOfStock)}
          />
          Показывать недоступные
        </label>
      </div>

      {/* 🛒 ТОВАРЫ */}
      {Object.entries(productsByCategory).map(([category, items]) =>
        items.length > 0 && (
          <div key={category}>
            <h2 className="category-title">{category}</h2>
            <div className="products-grid">
              {items.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
