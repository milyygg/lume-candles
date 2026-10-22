"use client";
import { Photograph } from "./photograph";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./store";
import { Configurator } from "./configurator";
import { findProduct } from "@/data/products";
import { money, pricing } from "@/lib/config";
import { lineKey, unitPrice } from "@/lib/cart";
export function CartPage() {
  const cart = useCart(),
    [editing, setEditing] = useState<string | null>(null),
    [error, setError] = useState("");
  const action = (fn: () => void) => {
    try {
      fn();
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (!cart.ready) return <p>Загружаем корзину...</p>;
  if (!cart.items.length)
    return (
      <div className="empty">
        <h1>Здесь будет ваша свеча</h1>
        <p>Начните с формы, которая вам нравится.</p>
        <Link className="button" href="/catalog">
          Открыть коллекцию ↗
        </Link>
      </div>
    );
  return (
    <>
      <div className="section-heading">
        <h1>Ваша корзина</h1>
        <button
          className="text-link"
          onClick={() => action(() => cart.clear())}
        >
          Очистить корзину
        </button>
      </div>
      <div className="cart-layout">
        <div>
          {cart.items.map((item) => {
            const key = lineKey(item),
              product = findProduct(item.productId)!;
            return (
              <article className="cart-item" key={key}>
                <Photograph source={product.image} alt={product.name} />
                <div className="cart-item-content">
                  <h2>{product.name}</h2>
                  <p>
                    {pricing.sizes[item.size].label} ·{" "}
                    {pricing.materials[item.material].label}
                  </p>
                  <p>
                    {item.aroma === "none"
                      ? "Без аромата"
                      : product.aromas.find((a) => a.id === item.aroma)?.label}
                    {item.decor ? " · Дополнительный декор" : ""}
                  </p>
                  <div className="cart-line-actions" data-ui>
                    <label className="field">
                      Количество
                      <input
                        aria-label={`Количество: ${product.name}`}
                        type="number"
                        min="1"
                        max={pricing.maxQuantity}
                        value={item.quantity}
                        onChange={(e) =>
                          action(() =>
                            cart.update(key, {
                              ...item,
                              quantity: Math.min(
                                pricing.maxQuantity,
                                Math.max(1, Number(e.target.value) || 1),
                              ),
                            }),
                          )
                        }
                      />
                    </label>
                    <strong>{money(unitPrice(item) * item.quantity)}</strong>
                  </div>
                  <div className="cart-line-actions">
                    <button
                      className="text-link"
                      aria-expanded={editing === key}
                      onClick={() => setEditing(editing === key ? null : key)}
                    >
                      Изменить параметры
                    </button>
                    <button
                      className="text-link"
                      onClick={() => action(() => cart.remove(key))}
                    >
                      Удалить
                    </button>
                  </div>
                  {editing === key && (
                    <Configurator
                      product={product}
                      initial={item}
                      onSave={(s) => {
                        cart.update(key, s);
                        setEditing(null);
                      }}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <aside className="order-summary">
          <h2>Ваш выбор</h2>
          <p>Изделий: {cart.count}</p>
          <p className="summary-total">{money(cart.total)}</p>
          <p>
            Без доставки. Окончательная сумма согласовывается индивидуально.
          </p>
          <Link className="button wide" href="/checkout">
            Оформить заказ ↗
          </Link>
          <p className="field-note">
            Оплата после согласования заказа и доставки.
          </p>
        </aside>
      </div>
      <p role="alert">{error}</p>
    </>
  );
}
