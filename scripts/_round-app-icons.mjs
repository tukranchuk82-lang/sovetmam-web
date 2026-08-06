// Скругление углов у иконок приложения.
//
// На рабочем столе и в панели задач Windows показывает иконку ровно такой,
// какая она в манифесте: наш красный квадрат выглядел квадратом, а рядом
// стояли скруглённые ярлыки остальных программ.
//
// Скругляем только иконки с purpose "any". Маскируемые (purpose maskable)
// трогать нельзя: Android сам обрезает их по своей форме, и заранее
// скруглённая картинка получит двойное скругление и белые проплешины по краям.
// apple-touch-icon тоже оставляем квадратным: iOS накладывает свою маску, а
// прозрачность в нём превращается в чёрный фон.
//
// Запуск: node scripts/_round-app-icons.mjs [--apply]
import sharp from "sharp";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const pub = "public";
const backup = join(pub, "_icons-square");

// Доля радиуса от стороны. 22% — примерно как у иконок Windows 11 и iOS.
const RADIUS = 0.22;

const files = ["icon-192.png", "icon-512.png"];

if (APPLY && !existsSync(backup)) mkdirSync(backup, { recursive: true });

for (const name of files) {
  const src = join(pub, name);
  const { width = 0, height = 0 } = await sharp(src).metadata();
  const r = Math.round(width * RADIUS);

  const mask = Buffer.from(
    `<svg width="${width}" height="${height}">
       <rect width="${width}" height="${height}" rx="${r}" ry="${r}" fill="#fff"/>
     </svg>`,
  );

  console.log(`${name}: ${width}×${height}, радиус ${r}px`);

  if (!APPLY) continue;

  // Оригинал сохраняем: из него же можно будет пересобрать, если понадобится.
  copyFileSync(src, join(backup, name));

  const rounded = await sharp(src)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  await sharp(rounded).toFile(src);
  console.log(`  скруглена, квадратный оригинал в ${backup}`);
}

console.log(
  APPLY
    ? "\nГотово. Маскируемые иконки и apple-touch-icon не тронуты — так и задумано."
    : "\nСухой прогон. Для записи: node scripts/_round-app-icons.mjs --apply",
);
