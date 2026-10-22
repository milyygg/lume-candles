"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./store";
import { findProduct } from "@/data/products";
import { money, pricing } from "@/lib/config";
import { lineKey, unitPrice } from "@/lib/cart";
type Result = { id: string; total: number; mode: string; notification: string };
export function ServerCheckout() {
  const cart = useCart(),
    [token, setToken] = useState(""),
    [mode, setMode] = useState(""),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false),
    [result, setResult] = useState<Result | null>(null),
    [contactType, setContactType] = useState("telegram"),
    [available, setAvailable] = useState(false);
  const key = useRef("");
  const loadToken = async () => {
    setAvailable(false);
    try {
      const response = await fetch("/api/checkout-token", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setToken(data.token);
      setMode(data.mode);
      setError("");
      setTimeout(() => setAvailable(true), 2100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось открыть форму.");
    }
  };
  useEffect(() => {
    key.current = crypto.randomUUID();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    fetch("/api/checkout-token", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (cancelled) return;
        setToken(data.token);
        setMode(data.mode);
        timer = setTimeout(() => {
          if (!cancelled) setAvailable(true);
        }, 2100);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
  if (result)
    return (
      <section className="confirmation">
        <h1>
          {result.mode === "test"
            ? "Состав заявки сохранён"
            : "Заявка сохранена"}
        </h1>
        <p>Номер заявки</p>
        <p className="order-number">{result.id}</p>
        <p>Предварительно: {money(result.total)}, без доставки.</p>
        <p>
          {result.mode === "test"
            ? "Заявка не передана мастерской. Чтобы обсудить заказ, свяжитесь с нами в Telegram."
            : result.notification === "sent"
              ? "Уведомление отправлено в Telegram. Дальнейшая связь по оставленному контакту."
              : "Заявка надёжно сохранена и ожидает отправки уведомления. Автоматическая личная переписка не создаётся."}
        </p>
        <Link className="button" href="/catalog">
          Вернуться в коллекцию ↗
        </Link>
      </section>
    );
  if (!cart.ready) return <p>Загружаем состав заявки...</p>;
  if (!cart.items.length)
    return (
      <div className="empty">
        <h1>Сначала выберите свечу</h1>
        <Link className="button" href="/catalog">
          Открыть коллекцию
        </Link>
      </div>
    );
  return (
    <>
      <h1>Почти ваша</h1>
      <p className="page-lead">
        Оставьте контакт, чтобы обсудить детали. Платить сейчас не нужно.
      </p>
      <div className="checkout-layout">
        <form
          className="checkout-form"
          data-ui
          onSubmit={async (e) => {
            e.preventDefault();
            if (sending || !available) return;
            setSending(true);
            setError("");
            const data = new FormData(e.currentTarget);
            try {
              const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: cart.items,
                  name: data.get("name"),
                  contactType,
                  contact: data.get("contact"),
                  comment: data.get("comment"),
                  consent: data.get("consent") === "on",
                  website: data.get("website"),
                  token,
                  idempotencyKey: key.current,
                }),
              });
              const body = await response.json();
              if (!response.ok) throw new Error(body.error);
              setResult(body);
              try {
                cart.clear();
              } catch {
                /* Confirmation is durable even when local storage is blocked. */
              }
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Сервер не подтвердил заявку. Попробуйте ещё раз.",
              );
            } finally {
              setSending(false);
            }
          }}
        >
          <p className="notice">
            {mode === "real"
              ? "Заявка сохраняется на сервере и передаётся владелице. Итоговую сумму согласуем лично."
              : "Для согласования заказа воспользуйтесь связью с мастерской."}
          </p>
          <label className="field">
            Как к вам обращаться
            <input
              name="name"
              autoComplete="given-name"
              minLength={2}
              maxLength={80}
              required
              placeholder="Ваше имя"
            />
          </label>
          <label className="field">
            Удобный способ связи
            <select
              value={contactType}
              onChange={(e) => setContactType(e.target.value)}
            >
              <option value="telegram">Telegram</option>
              <option value="phone">Телефон</option>
              <option value="email">Электронная почта</option>
            </select>
          </label>
          <label className="field">
            {contactType === "telegram"
              ? "Username в Telegram"
              : contactType === "phone"
                ? "Номер телефона"
                : "Электронная почта"}
            <input
              key={contactType}
              type={
                contactType === "email"
                  ? "email"
                  : contactType === "phone"
                    ? "tel"
                    : "text"
              }
              name="contact"
              required
              minLength={5}
              maxLength={120}
              placeholder={
                contactType === "telegram"
                  ? "@username"
                  : contactType === "phone"
                    ? "+7 ..."
                    : "name@example.ru"
              }
              autoComplete={
                contactType === "telegram"
                  ? "off"
                  : contactType === "phone"
                    ? "tel"
                    : "email"
              }
            />
          </label>
          <label className="field">
            Пожелания к заказу <span className="muted">(необязательно)</span>
            <textarea
              name="comment"
              maxLength={500}
              rows={4}
              placeholder="Например, свеча в подарок. Не указывайте адрес и платёжные данные."
            />
          </label>
          <label className="honeypot" aria-hidden="true">
            Сайт
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </label>
          <label className="check consent">
            <input name="consent" type="checkbox" required />
            <span>
              Согласен на обработку указанных данных для обсуждения заявки.
              Ознакомился с{" "}
              <Link href="/privacy" target="_blank">
                политикой обработки данных
              </Link>{" "}
              и{" "}
              <Link href="/terms" target="_blank">
                условиями заказа
              </Link>
              .
            </span>
          </label>

          <button
            className="button wide"
            disabled={sending || !token || !available}
            type="submit"
          >
            {sending
              ? "Сохраняем заявку..."
              : mode === "real"
                ? "Подтвердить и отправить заявку"
                : "Сохранить состав заявки"}
          </button>
          <p role="alert">{error}</p>
          {error && (
            <button type="button" className="text-link" onClick={loadToken}>
              Обновить форму отправки
            </button>
          )}
        </form>
        <aside className="order-summary">
          <h2>Состав заявки</h2>
          {cart.items.map((item) => (
            <div className="checkout-line" key={lineKey(item)}>
              <p>
                {findProduct(item.productId)?.name} × {item.quantity}
              </p>
              <p className="field-note">
                {pricing.sizes[item.size].label} ·{" "}
                {pricing.materials[item.material].label} ·{" "}
                {item.aroma === "none" ? "Без аромата" : "С ароматом"}
                {item.decor ? " · Дополнительный декор" : ""}
              </p>
              <p>{money(unitPrice(item) * item.quantity)}</p>
            </div>
          ))}
          <p className="summary-total">{money(cart.total)}</p>
          <p>
            Предварительно, без доставки. Окончательная сумма согласовывается
            индивидуально.
          </p>
          <Link className="text-link" href="/cart">
            Изменить корзину
          </Link>
        </aside>
      </div>
    </>
  );
}
