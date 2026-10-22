"use client";
import { useMemo, useState } from "react";
import { aromas } from "@/data/aromas";
import { visibleProducts } from "@/data/products";
import { ProductCard } from "./product-card";
import { SearchIcon } from "./catalog-icons";
export function Catalog({
  initialCategory = "Все формы",
}: {
  initialCategory?: string;
}) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(initialCategory),
    [sort, setSort] = useState("featured"),
    [scent, setScent] = useState("");
  const filtered = useMemo(() => {
    const list = visibleProducts.filter(
      (p) =>
        (category === "Все формы" || p.category === category) &&
        p.name
          .toLocaleLowerCase("ru")
          .includes(search.toLocaleLowerCase("ru")) &&
        (!scent || p.aromas.some(a=>a.id===scent)),
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
  }, [search, category, sort, scent]);
  const reset = () => {
    setSearch("");
    setCategory("Все формы");
    setSort("featured");
    setScent("");
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
      <label className="field scent-filter">Аромат<select value={scent} onChange={e=>setScent(e.target.value)}><option value="">Все ароматы</option>{aromas.map(a=><option value={a.id} key={a.id}>{a.label}</option>)}</select></label>
      <div className="results">
        <p aria-live="polite">Найдено форм: {filtered.length}</p>
        <button className="text-link" onClick={reset}>
          Сбросить фильтры
        </button>
      </div>
      {filtered.length ? (
        <div className="product-grid catalog-grid" key={`${category}:${search}:${scent}:${sort}`}>
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
