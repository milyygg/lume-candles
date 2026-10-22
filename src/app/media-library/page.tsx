import Image from "next/image";
import media from "@/data/media.json";
export const metadata = {
  title: "Обзор исходников",
  robots: { index: false, follow: false },
};
export default function MediaLibrary() {
  return (
    <div className="wrap page-content">
      <h1>Исходные материалы</h1>
      <p className="page-lead">
        40 фотографий. Временные превью с сохранением вида изделий. Права и
        соответствие ассортименту требуют подтверждения владельцем.
      </p>
      <div className="media-grid">
        {media.map((m) => (
          <figure key={m.id}>
            <Image
              src={m.preview}
              alt={`Исходный референс ${m.id}`}
              width={320}
              height={400}
            />
            <figcaption>
              {m.id}
              <br />
              <small>{m.source}</small>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
