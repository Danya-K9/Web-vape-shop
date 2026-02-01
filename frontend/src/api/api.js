import axios from "axios";

/** Базовый URL API (для запросов и картинок). В продакшене задать VITE_API_BASE_URL. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://web-vape-shop-production.up.railway.app";

/** Ссылка на бота в Telegram (можно переопределить в .env: VITE_TELEGRAM_BOT_LINK) */
export const TELEGRAM_BOT_LINK =
  import.meta.env.VITE_TELEGRAM_BOT_LINK || "https://t.me/OrderPulseBot_bot";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Добавляем токен ТОЛЬКО если он есть
API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

/** Плейсхолдер, если картинки нет */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%232a2a3d' width='200' height='200'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";

/** URL картинки с сервера (uploads). Пустой path — плейсхолдер. */
export function getImageUrl(path) {
  if (!path || typeof path !== "string") return PLACEHOLDER_IMAGE;
  const trimmed = path.trim();
  if (!trimmed) return PLACEHOLDER_IMAGE;
  if (trimmed.startsWith("http")) return trimmed;
  const pathPart = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const uploadsPath = pathPart.startsWith("/uploads/") ? pathPart : `/uploads/${trimmed.replace(/^\//, "")}`;
  return API_BASE_URL + uploadsPath;
}

export default API;
