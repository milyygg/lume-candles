import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Photograph } from "@/components/photograph";
import { Arrow } from "@/components/arrow";
import { visibleProducts } from "@/data/products";
export default function Home() {
  const featured = [visibleProducts[1], visibleProducts[2], visibleProducts[3]];
  return (
    <>
      <section className="atelier-hero wrap">
        <div className="hero-art">
          <figure className="hero-object">
            <Photograph
              source="MEDIA-21"
              alt="Свеча в форме объятия, целиком на деревянной подставке"
              priority
            />
            <figcaption>Объятие. Скульптурная форма из коллекции.</figcaption>
          </figure>
        </div>
        <div className="hero-editorial">
          <h1>
            Форма
            <br />
            тихого света
          </h1>
          <p className="hero-description">
            Декоративные свечи ручной работы.{" "}
            <br />
            Маленькие скульптуры для дома и подарков.
          </p>
          <Link className="editorial-link" href="/catalog">
            <span>Открыть коллекцию</span>
            <Arrow />
          </Link>
          <div className="hero-footnote">
            <p>
              От 1 500 ₽<span>Изготовление обсуждаем лично</span>
            </p>
            <figure>
              <Photograph
                source="MEDIA-22"
                alt="Свеча-медведь с рельефом из роз и белой лентой"
                priority
              />
              <figcaption>Красота в деталях</figcaption>
            </figure>
          </div>
        </div>
      </section>
      <section className="collection wrap section">
        <div className="section-heading">
          <div>
            <h2>
              У каждой формы
              <br />
              своё настроение
            </h2>
            <p>
              Трогательные силуэты, мягкие линии и фактуры,
              <br className="desktop-break" /> к которым хочется прикоснуться.
            </p>
          </div>
          <Link className="editorial-link small" href="/catalog">
            <span>Все формы</span>
            <Arrow />
          </Link>
        </div>
        <div className="product-grid home-grid">
          {featured.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
        <p className="collection-note">
          Визуальная подборка по предоставленным фотографиям. Наличие и
          возможности изготовления уточняются.
        </p>
      </section>
      <section className="atelier-story wrap section" id="atelier">
        <div className="atelier-story-copy" data-reveal>
          <h2>
            Ручная работа.
            <br />
            Личное отношение.
          </h2>
          <p>
            В нашей небольшой домашней мастерской свеча начинается с формы и
            ваших пожеланий.
          </p>
          <p>
            Нам важны плавный изгиб, выразительная фактура и то чувство, с
            которым вы выбираете подарок. Поэтому детали будущего изделия мы
            обсуждаем вместе.
          </p>
          <Link className="editorial-link small" href="/about">
            <span>О мастерской</span>
            <Arrow />
          </Link>
        </div>
        <div className="atelier-story-images">
          <figure className="story-tall" data-reveal>
            <Photograph
              source="MEDIA-22"
              alt="Детали фактуры свечи в форме медведя"
            />
            <figcaption>Внимание к каждой детали</figcaption>
          </figure>
          <figure className="story-short" data-reveal>
            <Photograph
              source="MEDIA-23"
              alt="Три круглые свечи с рельефной поверхностью"
            />
            <figcaption>Форма, фактура, настроение</figcaption>
          </figure>
        </div>
      </section>
      <section className="collection-chapters wrap section">
        <div className="section-heading">
          <h2>Близкое по духу</h2>
          <p>
            Для любимого уголка дома.
            <br />И для человека, которому хочется подарить тепло.
          </p>
        </div>
        <div className="chapter-grid">
          <Link href="/catalog?category=Скульптурные" className="chapter">
            <div className="chapter-image">
              <Photograph
                source="MEDIA-38"
                alt="Белый и чёрный лебеди из воска, целые силуэты"
              />
            </div>
            <div className="chapter-caption">
              <div>
                <h3>Маленькое искусство</h3>
                <p>Скульптурные формы</p>
              </div>
              <Arrow />
            </div>
          </Link>
          <Link href="/catalog?category=Ботанические" className="chapter">
            <div className="chapter-image">
              <Photograph
                source="MEDIA-36"
                alt="Свечи в форме лимонов в подарочной коробке"
              />
            </div>
            <div className="chapter-caption">
              <div>
                <h3>Подсказано природой</h3>
                <p>Цветы, плоды и органичные линии</p>
              </div>
              <Arrow />
            </div>
          </Link>
        </div>
      </section>
      <section className="order-guide wrap section">
        <div className="section-heading">
          <h2>
            От формы
            <br />
            до вашей свечи
          </h2>
          <p>
            Сначала выбираем и обсуждаем.
            <br />К оплате переходим после согласования.
          </p>
        </div>
        <ol className="order-guide-steps">
          <li data-reveal>
            <h3>Найдите силуэт</h3>
            <p>
              Откройте понравившуюся форму. Рассмотрите её и задайте параметры в
              конструкторе.
            </p>
          </li>
          <li data-reveal>
            <h3>Добавьте свои детали</h3>
            <p>
              Размер, материал, декор. Предварительная стоимость меняется вместе
              с вашим выбором.
            </p>
          </li>
          <li data-reveal>
            <h3>Оставьте заявку</h3>
            <p>
              Уточним возможности изготовления, итоговую сумму и доставку.
              Онлайн-оплата не нужна.
            </p>
          </li>
        </ol>
        <div className="guide-close">
          <Link className="editorial-link" href="/catalog">
            <span>Перейти к формам</span>
            <Arrow />
          </Link>
          <Link className="text-link" href="/delivery">
            Доставка: СДЭК, Авито, Почта России
          </Link>
        </div>
      </section>
    </>
  );
}
