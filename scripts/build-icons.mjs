// Сборка всех иконок приложения из одного исходника.
//
//   Положить картинку в  assets/icon-source.png   и выполнить:
//       npm run icons
//
// Генерирует в public/:
//   icon-192.png / icon-512.png            — purpose "any" (прозрачный фон)
//   icon-maskable-192 / -512.png           — Android, рабочий стол
//   apple-touch-icon.png (180x180)         — iPhone/iPad
//
// Зачем два комплекта. Иконку с purpose "maskable" лаунчер Android обрезает
// по своей форме (круг, squircle, скруглённый квадрат). Гарантированно видна
// только центральная область — круг диаметром 80% холста. Поэтому логотип
// приходится ужимать до 78% и класть на НЕПРОЗРАЧНУЮ подложку: иначе рисунок
// срежется по краям, а сквозь прозрачные места будут просвечивать обои.
// iOS манифест вообще не читает и прозрачность в иконке заливает чёрным —
// ему нужен отдельный непрозрачный apple-touch-icon.
//
// Требования к исходнику: PNG, квадрат, от 1024x1024. Поля вокруг рисунка
// не важны — скрипт сам их обрежет и расставит заново.

import sharp from "sharp";
import { writeFileSync, existsSync } from "node:fs";

const SRC = process.argv[2] ?? "assets/icon-source.png";
// Цвет подложки для maskable/apple. Меняется флагом: npm run icons -- --bg=#1B3A6B
const bgArg = process.argv.find((a) => a.startsWith("--bg="));
const BG = bgArg ? bgArg.slice(5) : "#ffffff";

// Доля стороны холста, которую занимает логотип.
// Safe zone maskable-иконки — круг диаметром 80% холста; всё вне его лаунчер
// вправе срезать. Берём 0.70, а не «почти 0.80»: во-первых, запас на разные
// маски, во-вторых — лаунчер показывает эти 80% РАСТЯНУТЫМИ на всю плитку,
// поэтому логотип на 0.70 займёт ~87% видимой иконки. Крупно и с воздухом.
const MASKABLE_SCALE = 0.7;
// iOS маской не режет, только скругляет углы — можно крупнее.
const APPLE_SCALE = 0.9;

if (!existsSync(SRC)) {
  console.error(`Не найден исходник: ${SRC}`);
  console.error("Положите квадратный PNG (от 1024x1024) в assets/icon-source.png");
  process.exit(1);
}

const meta = await sharp(SRC).metadata();
if (meta.width !== meta.height) {
  console.warn(
    `⚠ исходник не квадратный (${meta.width}x${meta.height}) — впишу в квадрат по большей стороне`,
  );
}
if (Math.max(meta.width, meta.height) < 512) {
  console.warn(`⚠ исходник мелкий (${meta.width}x${meta.height}) — иконка будет мылить`);
}

// Обрезаем поля исходника, чтобы «78%» считались от самого рисунка,
// а не от случайной пустоты вокруг него.
const trimmed = await sharp(SRC).trim({ threshold: 2 }).toBuffer();

/** Логотип по центру квадратного холста. bg=null → прозрачный фон. */
async function render(out, size, scale, bg) {
  const inner = Math.round(size * scale);
  const logo = await sharp(trimmed)
    .resize({
      width: inner,
      height: inner,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  const pad = Math.round((size - inner) / 2);
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  const buf = await canvas
    .composite([{ input: logo, top: pad, left: pad }])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
  writeFileSync(`public/${out}`, buf);
  const kb = Math.round(buf.length / 1024);
  console.log(`  public/${out.padEnd(26)} ${size}x${size}  ${kb} KB`);
}

console.log(`Исходник: ${SRC} (${meta.width}x${meta.height}), подложка ${BG}\n`);

// "any": прозрачный фон, рисунок почти во весь холст — здесь обрезки нет.
await render("icon-192.png", 192, 1, null);
await render("icon-512.png", 512, 1, null);
// "maskable": непрозрачная подложка + запас под обрезку маской.
await render("icon-maskable-192.png", 192, MASKABLE_SCALE, BG);
await render("icon-maskable-512.png", 512, MASKABLE_SCALE, BG);
// iOS.
await render("apple-touch-icon.png", 180, APPLE_SCALE, BG);

console.log("\nГотово. Проверить обрезку: node scripts/preview-icons.mjs");
