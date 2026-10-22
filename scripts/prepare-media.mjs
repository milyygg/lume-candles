import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
const root = process.cwd();
const files = (await fs.readdir(path.join(root, "фото")))
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]));
await fs.mkdir("public/media", { recursive: true });
await fs.mkdir("src/data", { recursive: true });
const manifest = [];
for (let i = 0; i < files.length; i++) {
  const source = path.join(root, "фото", files[i]);
  const number = Number(files[i].match(/^photo_(\d+)_/)?.[1]);
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error(`Expected photo_N_name: ${files[i]}`);
  const id = `MEDIA-${String(number).padStart(2, "0")}`;
  if (manifest.some((item) => item.id === id))
    throw new Error(`Duplicate media ID: ${id}`);
  const meta = await sharp(source).metadata();
  await sharp(source)
    .rotate()
    .resize({
      width: 1200,
      height: 1500,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84 })
    .toFile(`public/media/${id}.webp`);
  await sharp(source)
    .rotate()
    .resize({
      width: 320,
      height: 400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 75 })
    .toFile(`public/media/${id}-thumb.webp`);
  manifest.push({
    id,
    source: `фото/${files[i]}`,
    image: `/media/${id}.webp`,
    preview: `/media/${id}-thumb.webp`,
    width: meta.width,
    height: meta.height,
    sha256: crypto
      .createHash("sha256")
      .update(await fs.readFile(source))
      .digest("hex"),
    rights: "requires-owner-confirmation",
    status: "reference-preview",
  });
}
await fs.writeFile(
  "src/data/media.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
await fs.writeFile(
  "docs/media-catalog.html",
  `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Обзор исходников LUME</title><style>body{font:16px Arial;background:#f6f3ed;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}img{width:100%;height:260px;object-fit:contain}figure{margin:0}small{overflow-wrap:anywhere}</style><h1>Исходники: ${files.length}</h1><p>Временные превью. Права, ассортимент и характеристики требуют подтверждения. Оригиналы сохранены без изменений.</p><main>${manifest.map((m) => `<figure><img src="../public${m.preview}" alt="Исходник ${m.id}"><figcaption>${m.id}<br><small>${m.source}</small></figcaption></figure>`).join("")}</main></html>`,
);
console.log(`Prepared ${manifest.length} previews; source files unchanged.`);
