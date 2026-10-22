import Link from "next/link";
import { brand } from "@/lib/config";
import { Arrow } from "./arrow";
export function Footer() {
  return (
    <footer className="footer wrap">
      <div className="footer-top">
        <div className="footer-invitation">
          <p>
            Свет для дома.
            <br />
            Тепло для близких.
          </p>
          <Link className="editorial-link small" href="/contacts">
            <span>Связаться с мастерской</span>
            <Arrow />
          </Link>
        </div>
        <nav aria-label="Информация">
          <Link href="/catalog">Коллекция</Link>
          <Link href="/about">О мастерской</Link>
          <Link href="/delivery">Доставка</Link>
          <Link href="/payment">Оплата</Link>
          <Link href="/contacts">Контакты</Link>
        </nav>
        <nav aria-label="Документы">
          <Link href="/privacy">Обработка данных</Link>
          <Link href="/terms">Условия заказа</Link>
          <Link href="/media-library">Исходные фотографии</Link>
          <p>
            Демонстрационный каталог.
            <br />
            Параметры уточняются лично.
          </p>
        </nav>
      </div>
      <div className="footer-word" aria-hidden="true">
        {brand.name}
      </div>
      <div className="footer-bottom">
        <span>{brand.title} · 2026</span>
        <span>Декоративные свечи ручной работы</span>
        <a href="#main">Наверх ↑</a>
      </div>
    </footer>
  );
}
