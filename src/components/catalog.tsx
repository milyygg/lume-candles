"use client";
import { useMemo, useState } from "react";
import { visibleProducts } from "@/data/products";
import { ProductCard } from "./product-card";
import { SearchIcon, FilterIcon } from "./catalog-icons";
export function Catalog({
  initialCategory = "Все формы",
}: {
  initialCategory?: string;
}) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(initialCategory),
    [sort, setSort] = useState("featured"),
    [type, setType] = useState(""),
    [technology, setTechnology] = useState(""),
    [decor, setDecor] = useState("");
  const filtered = useMemo(() => {
    const list = visibleProducts.filter(
      (p) =>
        (category === "Все формы" || p.category === category) &&
        p.name
          .toLocaleLowerCase("ru")
          .includes(search.toLocaleLowerCase("ru")) &&
        (!type || p.candleTypes.includes(type as never)) &&
        (!technology || p.technology === technology) &&
        (!decor || p.decorKinds.includes(decor as never)),
    );
    return [...list].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "ru")
        : sort === "price-up"
          ? a.basePrice - b.basePrice
          : sort === "price-down"
            ? b.basePrice - a.basePrice
            : 0,
    );
  }, [search, category, sort, type, technology, decor]);
  const reset = () => {
    setSearch("");
    setCategory("Все формы");
    setSort("featured");
    setType("");
    setTechnology("");
    setDecor("");
  };
  return (
    <>
      <div className="catalog-tools" data-ui>
        <label className="search-field">
          <span>Поиск по коллекции</span>
          <span className="search-input-wrapper">
            <SearchIcon />
            <input
              type="search"
              placeholder="Например, медведь"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </span>
        </label>
        <label className="field">
          Сортировка
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Порядок коллекции</option>
            <option value="name">По названию</option>
            <option value="price-up">Цена по возрастанию</option>
            <option value="price-down">Цена по убыванию</option>
          </select>
        </label>
      </div>
      <div className="category-tabs" aria-label="Категории">
        {[
          "Все формы",
          "Скульптурные",
          "Ботанические",
          "Фактурные",
          "Десертные",
        ].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
          >
            {c}
            <span className="category-count" aria-hidden="true">
              {c === "Все формы"
                ? visibleProducts.length
                : visibleProducts.filter((p) => p.category === c).length}
            </span>
          </button>
        ))}
      </div>
      <details className="filters" data-ui>
        <summary>
          <FilterIcon /> Дополнительные фильтры
        </summary>
        <div className="filter-fields">
          <label className="field">
            Вид свечи
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Все виды</option>
              <option value="aromatic">Ароматические</option>
              <option value="massage">Массажные</option>
              <option value="wood-wick">С деревянным фитилём</option>
            </select>
          </label>
          <label className="field">
            Технология
            <select
              value={technology}
              onChange={(e) => setTechnology(e.target.value)}
            >
              <option value="">Все технологии</option>
              <option value="molded">Формовые</option>
              <option value="gel">Гелевые</option>
            </select>
          </label>
          <label className="field">
            Декор
            <select value={decor} onChange={(e) => setDecor(e.target.value)}>
              <option value="">Любой декор</option>
              <option value="botanical">Ботанический</option>
              <option value="relief">Рельефный</option>
              <option value="texture">Текстурный</option>
              <option value="filled">С наполнениями</option>
              <option value="painted">Расписные</option>
            </select>
          </label>
        </div>
        <p className="field-note">
          Эти свойства пока не подтверждены для референсов. Фильтр покажет
          изделия после наполнения данных.
        </p>
      </details>
      <div className="results">
        <p aria-live="polite">Найдено форм: {filtered.length}</p>
        <button className="text-link" onClick={reset}>
          Сбросить фильтры
        </button>
      </div>
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Пока нет совпадений</h2>
          <p>Попробуйте другое название или уберите часть фильтров.</p>
          <button className="button" onClick={reset}>
            Показать все формы
          </button>
        </div>
      )}
    </>
  );
}
