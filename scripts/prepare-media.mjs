import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
const root = process.cwd();
const files = (await fs.readdir(path.join(root, "public/photography")))
  .filter((f) => /^MEDIA-\d+\.jpg$/.test(f)).sort();
await fs.mkdir("public/media", { recursive: true });
await fs.mkdir("src/data", { recursive: true });
const manifest = [];
for (let i = 0; i < files.length; i++) {
  const source = path.join(root, "public/photography", files[i]);
  const number = Number(files[i].match(/^MEDIA-(\d+)\./)?.[1]);
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error(`Expected MEDIA-NN.jpg: ${files[i]}`);
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
    source: `public/photography/${files[i]}`,
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
console.log(`Prepared ${manifest.length} previews; source files unchanged.`);
