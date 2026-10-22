import type { Metadata } from "next";
import { Catalog } from "@/components/catalog";
export const metadata: Metadata = {
  title: "Коллекция",
  description:
    "Выберите форму декоративной свечи и настройте предварительную конфигурацию.",
};
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const initialCategory = [
    "Скульптурные",
    "Ботанические",
    "Фактурные",
    "Десертные",
  ].includes(category || "")
    ? category
    : "Все формы";
  return (
    <div className="wrap page-content catalog-page">
      <div className="page-heading">
        <h1>Коллекция</h1>
        <p>
          Скульптуры, цветы, маленькие десерты.
          <br />
          Выберите то, что откликается именно вам.
        </p>
      </div>
      <Catalog initialCategory={initialCategory} />
      <p className="catalog-status">
        12 форм из исходной подборки. Фотографии служат референсами: наличие,
        характеристики и права на изображения требуют подтверждения.
      </p>
    </div>
  );
}
