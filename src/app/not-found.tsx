import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap empty">
      <h1>Форма не найдена</h1>
      <p>Возможно, эта страница ещё не добавлена.</p>
      <Link href="/catalog" className="button">
        Открыть коллекцию
      </Link>
    </div>
  );
}
