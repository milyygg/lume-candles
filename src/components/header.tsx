"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "./store";
import { brand } from "@/lib/config";
export function Header() {
  const cart = useCart(),
    [open, setOpen] = useState(false),
    pathname = usePathname();
  return (
    <>
      <a className="skip" href="#main">
        К содержимому
      </a>
      <header className="header wrap">
        <Link
          className="logo"
          href="/"
          aria-label={`${brand.title}, на главную`}
        >
          {brand.name}
          <span>{brand.descriptor}</span>
        </Link>
        <nav
          id="mobile-menu"
          className={open ? "nav open" : "nav"}
          aria-label="Основная навигация"
          onKeyDown={(e)=>{if(e.key==="Escape"){setOpen(false);document.querySelector<HTMLButtonElement>(".menu-button")?.focus();}}}
        >
          {[
            ["/catalog", "Коллекция"],
            ["/about", "О мастерской"],
            ["/delivery", "Доставка"],
            ["/contacts", "Контакты"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            href="/cart"
            className="cart-link"
            aria-label={`Корзина, ${cart.count} товаров`}
          >
            <svg
              width="22"
              height="25"
              viewBox="0 0 24 26"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 8h16l1 16H3L4 8Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M8 9V6a4 4 0 0 1 8 0v3"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            <span className="cart-count" key={cart.count}>{cart.count}</span>
          </Link>
          <button
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? "Закрыть" : "Меню"}
          </button>
        </div>
      </header>
    </>
  );
}
