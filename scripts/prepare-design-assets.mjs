import fs from "node:fs/promises";
import path from "node:path";
const media = JSON.parse(await fs.readFile("src/data/media.json", "utf8"));
await fs.mkdir("public/photography", { recursive: true });
const photos = {};
for (const image of media) {
  const filename = image.id + path.extname(image.source);
  await fs.copyFile(image.source, path.join("public/photography", filename));
  photos[image.id] = {
    src: `/photography/${filename}`,
    width: image.width,
    height: image.height,
  };
}
await fs.writeFile(
  "src/data/photography.json",
  JSON.stringify(photos, null, 2) + "\n",
);
console.log(`Copied ${media.length} original files without transcoding.`);

const fontUrl =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Manrope:wght@400;500;600&display=swap";
const response = await fetch(fontUrl, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  },
});
if (!response.ok) throw new Error("Font stylesheet unavailable");
const stylesheet = await response.text();
const blocks = [
  ...stylesheet.matchAll(
    /\/\* (cyrillic|latin) \*\/\s*(@font-face\s*\{[^}]+\})/g,
  ),
];
if (blocks.length < 4)
  throw new Error("Expected Latin and Cyrillic font subsets");
await fs.mkdir("public/fonts", { recursive: true });
const downloaded = new Map();
let fontCss = "/* Local OFL fonts. Sources and licenses: public/fonts/. */\n";
for (const block of blocks) {
  const url = block[2].match(/url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error("Missing font source");
  let local = downloaded.get(url);
  if (!local) {
    const family = block[2].includes("Cormorant")
      ? "cormorant-garamond"
      : "manrope";
    local = `/fonts/${family}-${block[1]}-${downloaded.size + 1}.woff2`;
    const font = await fetch(url);
    if (!font.ok) throw new Error("Font download failed");
    await fs.writeFile(`public${local}`, Buffer.from(await font.arrayBuffer()));
    downloaded.set(url, local);
  }
  fontCss += `/* ${block[1]} */\n${block[2].replace(url, local)}\n`;
}
await fs.writeFile("src/app/fonts.css", fontCss);
console.log(
  `Self-hosted ${downloaded.size} WOFF2 files, Latin and Cyrillic subsets.`,
);
