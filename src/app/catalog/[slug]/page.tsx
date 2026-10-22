import { Photograph } from "@/components/photograph";
import { Arrow } from "@/components/arrow";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { visibleProducts } from "@/data/products";
import { Configurator } from "@/components/configurator";
export function generateStaticParams() {
  return visibleProducts.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = visibleProducts.find((p) => p.slug === slug);
  return { title: p?.name || "Форма не найдена", description: p?.short };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = visibleProducts.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <div className="wrap page-content">
      <Link className="product-breadcrumb" href="/catalog">
        <Arrow direction="left" /> Коллекция форм
      </Link>
      <div className="product-detail">
        <figure className="detail-image">
          <div className="detail-image-frame">
            <Photograph
              source={product.image}
              alt={product.name + ", референс из исходных материалов"}
              priority
            />
          </div>
          <figcaption>
            Исходная фотография. Цвет, размеры и состав уточняются. Изображение
            показано целиком.
          </figcaption>
        </figure>
        <div className="detail-copy">
          <p className="detail-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.short}</p>
          <h2 id="constructor" className="constructor-heading">
            Соберите свою версию
          </h2>
          <Configurator product={product} />
          <details>
            <summary>Об этой форме</summary>
            <p>{product.description}</p>
          </details>
          <details>
            <summary>Заказ и доставка</summary>
            <p>
              После заявки согласуем параметры, оплату и доставку. Доступные
              способы: СДЭК, Авито, Почта России. Срок и стоимость уточняются
              индивидуально.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
