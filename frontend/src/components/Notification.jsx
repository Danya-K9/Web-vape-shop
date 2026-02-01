import { useEffect, useState } from "react";
import "./Notification.css";

export default function Notification() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const handler = e => {
      setData(e.detail);
      setTimeout(() => setData(null), 4000);
    };

    window.addEventListener("notify", handler);
    return () => window.removeEventListener("notify", handler);
  }, []);

  if (!data) return null;

  return (
    <div className={`notification ${data.type}`}>
      {data.message}
    </div>
  );
}
