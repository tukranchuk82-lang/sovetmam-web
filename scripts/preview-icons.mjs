// Предпросмотр иконок так, как их покажет телефон.
//
//     node scripts/preview-icons.mjs
//
// Кладёт рядом icons-preview.png: слева направо — круглая маска, squircle,
// скруглённый квадрат (три формы, которые встречаются в лаунчерах Android),
// затем iOS. Для maskable-иконок берутся ТОЛЬКО центральные 80% холста —
// именно столько лаунчер гарантированно показывает, остальное срезается.
//
// Если на превью рисунок обрезан или касается края — уменьшите MASKABLE_SCALE
// в scripts/build-icons.mjs и пересоберите (npm run icons).

import sharp from "sharp";

const S = 256; // сторона плитки на превью
const VISIBLE = 0.8; // доля холста, которую показывает лаунчер Android

const CIRCLE = `<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="#fff"/>`;
const SQUIRCLE = `<path d="M128,0 C205,0 256,51 256,128 C256,205 205,256 128,256 C51,256 0,205 0,128 C0,51 51,0 128,0 Z" fill="#fff"/>`;
const ROUNDED = `<rect width="${S}" height="${S}" rx="56" fill="#fff"/>`;
const IOS = `<rect width="${S}" height="${S}" rx="56" fill="#fff"/>`;

/** Обрезает до видимой зоны (если crop) и накладывает маску формы. */
async function tile(src, shape, crop) {
  let img = sharp(src);
  if (crop) {
    const { width } = await sharp(src).metadata();
    const vis = Math.round(width * VISIBLE);
    const off = Math.round((width - vis) / 2);
    img = img.extract({ left: off, top: off, width: vis, height: vis });
  }
  // Прозрачность заливаем серым — так видно, где сквозь иконку будут обои.
  const base = await img.resize(S, S).flatten({ background: "#cccccc" }).toBuffer();
  const mask = Buffer.from(`<svg width="${S}" height="${S}">${shape}</svg>`);
  return sharp(base).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

const tiles = [
  await tile("public/icon-maskable-512.png", CIRCLE, true),
  await tile("public/icon-maskable-512.png", SQUIRCLE, true),
  await tile("public/icon-maskable-512.png", ROUNDED, true),
  await tile("public/apple-touch-icon.png", IOS, false),
];

const GAP = 16;
await sharp({
  create: {
    width: S * tiles.length + GAP * (tiles.length - 1),
    height: S,
    channels: 4,
    background: "#bbbbbb",
  },
})
  .composite(tiles.map((input, i) => ({ input, left: i * (S + GAP), top: 0 })))
  .png()
  .toFile("icons-preview.png");

console.log("icons-preview.png: круг | squircle | скруглённый квадрат | iOS");
console.log("Рисунок нигде не должен упираться в край плитки.");
