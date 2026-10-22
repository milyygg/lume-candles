"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="wrap empty">
      <h1>Не удалось открыть страницу</h1>
      <p>Попробуйте ещё раз. Корзина хранится в вашем браузере.</p>
      <button onClick={reset} className="button">
        Повторить
      </button>
    </div>
  );
}
