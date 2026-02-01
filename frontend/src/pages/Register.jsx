import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API, { TELEGRAM_BOT_LINK } from "../api/api";
import "./Auth.css";

export default function Register() {
  const [searchParams] = useSearchParams();
  const tgId = searchParams.get("tg_id");

  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (tgId) setStep(1);
  }, [tgId]);

  async function sendCode(e) {
    e.preventDefault();
    setError("");
    if (!tgId) {
      setError("Сначала откройте бота в Telegram и нажмите /start, затем перейдите по ссылке из бота");
      return;
    }
    try {
      await API.post("/api/auth/send-code", { telegramChatId: tgId });
      setStep(2);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Не удалось отправить код. Убедитесь, что перешли по ссылке из бота"
      );
    }
  }

  async function register(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/api/auth/register", {
        telegramChatId: tgId,
        code,
        password,
        name,
      });
      localStorage.setItem("token", res.data.token);
      window.location.href = "/";
    } catch (e) {
      if (e.response?.status === 409) {
        setError("Пользователь с этим Telegram уже зарегистрирован");
      } else {
        setError(e.response?.data?.message || "Неверный код или данные");
      }
    }
  }

  if (!tgId) {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card--center">
          <h2>Регистрация</h2>
          <div className="hint-box">
            <div>
              <strong>Регистрация через Telegram</strong>
              <p>
                Откройте бота, нажмите <strong>/start</strong> и перейдите по ссылке для регистрации.
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
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={step === 1 ? sendCode : register}>
        <h2>Регистрация</h2>

        {step === 1 && (
          <div className="hint-box">
            <div className="hint-icon">📱</div>
            <div>
              <strong>Код придёт в Telegram</strong>
              <p>Нажмите «Получить код» — код придёт в наш бот в Telegram.</p>
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {step === 1 && (
          <button type="submit">Получить код в Telegram</button>
        )}

        {step === 2 && (
          <>
            <input
              placeholder="Код из Telegram"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <input
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit">Зарегистрироваться</button>
          </>
        )}
      </form>
    </div>
  );
}
