"use client";
import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";
import { money, pricing, type Material, type Size } from "@/lib/config";
import { unitPrice, type Selection } from "@/lib/cart";
import { useCart } from "./store";
import { Arrow } from "./arrow";
export function Configurator({
  product,
  initial,
  onSave,
}: {
  product: Product;
  initial?: Selection;
  onSave?: (s: Selection) => void;
}) {
  const [selection, setSelection] = useState<Selection>(
    initial || {
      productId: product.id,
      size: product.sizes[0],
      material: product.materials[0],
      aroma: "none",
      decor: false,
      quantity: 1,
    },
  );
  const [message, setMessage] = useState(""),
    [added, setAdded] = useState(false),
    cart = useCart();
  const set = (change: Partial<Selection>) => {
    setSelection((s) => ({ ...s, ...change }));
    setAdded(false);
    setMessage("");
  };
  return (
    <form
      className="configurator"
      data-ui
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (onSave) onSave(selection);
          else cart.add(selection);
          setAdded(true);
          setMessage(
            onSave ? "Параметры сохранены." : "Свеча добавлена в корзину.",
          );
        } catch (error) {
          setMessage((error as Error).message);
        }
      }}
    >
      <fieldset>
        <legend>Размер</legend>
        <div className="choices">
          {product.sizes.map((size) => (
            <label
              className={selection.size === size ? "choice selected" : "choice"}
              key={size}
            >
              <input
                type="radio"
                disabled={!cart.ready}
                name={`size-${product.id}`}
                value={size}
                checked={selection.size === size}
                onChange={() => set({ size: size as Size })}
              />
              <span>
                {pricing.sizes[size].label}
                <small>+{money(pricing.sizes[size].extra)}</small>
              </span>
              <svg
                className="choice-mark"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m1 6 3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
            </label>
          ))}
        </div>
      </fieldset>
      {product.materials.length > 0 && (
        <fieldset>
          <legend>Материал</legend>
          <div className="choices materials">
            {product.materials.map((material) => (
              <label
                className={
                  selection.material === material ? "choice selected" : "choice"
                }
                key={material}
              >
                <input
                  type="radio"
                disabled={!cart.ready}
                  name={`material-${product.id}`}
                  checked={selection.material === material}
                  onChange={() => set({ material: material as Material })}
                />
                <span>
                  {pricing.materials[material].label}
                  <small>+{money(pricing.materials[material].extra)}</small>
                </span>
                <svg
                  className="choice-mark"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m1 6 3 3 7-7"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </label>
            ))}
          </div>

        </fieldset>
      )}
      <label className="field">
        Аромат
        <select
          aria-label="Аромат"
          disabled={!cart.ready}
          value={selection.aroma}
          onChange={(e) => set({ aroma: e.target.value })}
        >
          <option value="none">Без аромата · 0 ₽</option>
          {product.aromas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} · +{money(pricing.aromaExtra)}
            </option>
          ))}
        </select>
      </label>

      {product.allowDecor && (
        <div className="decor-option">
          <label className="check">
            <input
              type="checkbox"
              disabled={!cart.ready}
              checked={selection.decor}
              onChange={(e) => set({ decor: e.target.checked })}
            />
            <span>
              Дополнительный декор <span>+{money(pricing.decorExtra)}</span>
            </span>
          </label>
          <p className="field-note">
            {selection.decor ? "Детали оформления согласуем лично." : "Без дополнительного декора · 0 ₽"}
          </p>
        </div>
      )}
      <div className="config-bottom">
        <div className="field">
          <label htmlFor={`quantity-${product.id}`}>Количество</label>
          <div className="quantity-control">
            <button
              type="button"
              aria-label="Уменьшить количество"
              disabled={!cart.ready || selection.quantity <= 1}
              onClick={() =>
                set({ quantity: Math.max(1, selection.quantity - 1) })
              }
            >
              −
            </button>
            <input
              id={`quantity-${product.id}`}
              aria-label="Количество"
              type="number"
              disabled={!cart.ready}
              min="1"
              max={pricing.maxQuantity}
              value={selection.quantity}
              onChange={(e) =>
                set({
                  quantity: Math.min(
                    pricing.maxQuantity,
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                })
              }
            />
            <button
              type="button"
              aria-label="Увеличить количество"
              disabled={!cart.ready || selection.quantity >= pricing.maxQuantity}
              onClick={() =>
                set({
                  quantity: Math.min(
                    pricing.maxQuantity,
                    selection.quantity + 1,
                  ),
                })
              }
            >
              +
            </button>
          </div>
        </div>
        <div className="price" aria-live="polite"><span className="price-value" key={unitPrice(selection) * selection.quantity}>
          {money(unitPrice(selection) * selection.quantity)}</span>
          <small>{money(unitPrice(selection))} / шт.</small>
        </div>
      </div>
      <button className={added ? "button wide added" : "button wide"} disabled={!cart.ready} type="submit">
        {onSave
          ? "Сохранить параметры"
          : added
            ? "Добавлено в корзину"
            : "Добавить в корзину"}{" "}
        <Arrow />
      </button>
      <div role="status">
        {message}{" "}
        {added && !onSave && (
          <Link className="text-link" href="/cart">
            Перейти в корзину
          </Link>
        )}
      </div>
      <p className="field-note">
        Расчёт предварительный, доставка не включена. Окончательная сумма
        согласовывается индивидуально.
      </p>
    </form>
  );
}
