import { useEffect, useState } from "react";
import API from "../api/api";
import "./AdminPickup.css";

export default function AdminPickupLocations() {
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const load = async () => {
    const res = await API.get("/api/admin/pickup-locations");
    setLocations(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await API.post("/api/admin/pickup-locations", { name, address });
    setName("");
    setAddress("");
    load();
  };

  const toggle = async (l) => {
    await API.patch(`/api/admin/pickup-locations/${l.id}`, {
      active: !l.active
    });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Удалить точку?")) return;
    await API.delete(`/api/admin/pickup-locations/${id}`);
    load();
  };

  return (
    <div className="admin-page">
      <h2>Точки самовывоза</h2>

      <div className="admin-form">
        <input
          placeholder="Название"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          placeholder="Адрес"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
        <button onClick={create}>Добавить</button>
      </div>

      <div className="admin-table">
        {locations.map(l => (
          <div key={l.id} className="admin-row">
            <span>{l.name}</span>
            <span>{l.address}</span>
            <span>{l.active ? "🟢" : "🔴"}</span>
            <span>
              <button onClick={() => toggle(l)}>
                {l.active ? "Отключить" : "Включить"}
              </button>
              <button onClick={() => remove(l.id)}>🗑</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
