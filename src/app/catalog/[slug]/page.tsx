import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
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
        <Arrow direction="left" /> Вся коллекция
      </Link>
      <div className="product-detail">
        <ProductGallery product={product} />
        <div className="detail-copy">
          <p className="detail-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.short}</p>
          <h2 id="constructor" className="constructor-heading">
            Детали вашей свечи
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
      <section className="section related-products"><div className="section-heading"><h2>Рядом по настроению</h2><Link className="text-link" href="/catalog">Вся коллекция</Link></div><div className="product-grid">{visibleProducts.filter(p=>p.category===product.category && p.id!==product.id).slice(0,3).map((p,i)=><ProductCard product={p} index={i} key={p.id}/>)}</div></section>
    </div>
  );
}
