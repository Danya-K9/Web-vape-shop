import { Link } from "react-router-dom";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import API, { TELEGRAM_BOT_LINK } from "../api/api";

export default function Login() {
  const [searchParams] = useSearchParams();
  const tgId = searchParams.get("tg_id");

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");
    if (!tgId) {
      setError("Перейдите по ссылке из бота (нажмите /start в Telegram)");
      return;
    }
    try {
      const res = await API.post("/api/auth/login", {
        telegramChatId: tgId,
        password,
      });
      localStorage.setItem("token", res.data.token);
      window.location.href = "/";
    } catch (e) {
      setError(e.response?.data?.message || "Неверный пароль или пользователь не найден");
    }
  }

  if (!tgId) {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card--center">
          <h2>Вход</h2>
          <div className="hint-box">
            <div>
              <strong>Вход через Telegram</strong>
              <p>
                Откройте бота, нажмите <strong>/start</strong> и перейдите по ссылке для входа.
              </p>
              <a
                href={TELEGRAM_BOT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="auth-bot-link"
              >
                Открыть бота в Telegram →
              </a>
            </div>
          </div>
          <p className="auth-footer">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={login}>
        <h2>Вход</h2>
        <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 12 }}>
          Вы вошли по ссылке из Telegram. Введите пароль.
        </p>

        {error && <p className="error">{error}</p>}

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Войти</button>

        <p className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  );
}
