import Link from "next/link";
import type { Product } from "@/data/products";
import { money } from "@/lib/config";
import { Photograph } from "./photograph";
import { Arrow } from "./arrow";
export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  return (
    <article
      className="product-card"
      data-reveal
      style={{ "--delay": `${(index % 3) * 60}ms` } as React.CSSProperties}
    >
      <Link
        className="product-photo"
        href={`/catalog/${product.slug}`}
        aria-label={`Рассмотреть: ${product.name}`}
      >
        <Photograph
          source={product.image}
          alt={product.name + " - исходный референс"}
        />
      </Link>
      <div className="product-meta">
        <Link href={`/catalog/${product.slug}`} className="product-title">
          <h3>{product.name}</h3>
        </Link>
        <div className="product-bottom">
          <p className="product-price">от {money(product.basePrice)}</p>
          <Link
            href={`/catalog/${product.slug}#constructor`}
            className="product-open"
            aria-label={`Настроить: ${product.name}`}
          >
            <span>Собрать</span>
            <Arrow />
          </Link>
        </div>
      </div>
    </article>
  );
}
