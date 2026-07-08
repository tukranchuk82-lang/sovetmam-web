// Сборка всех иконок приложения из одного исходника.
//
//   Заменить картинку в  assets/app-icon.png  и выполнить:
//       npm run icons
//   Проверить, как её обрежет телефон:
//       node scripts/preview-icons.mjs
//
// Генерирует в public/:
//   icon-192.png / icon-512.png     — purpose "any" (вкладка браузера, splash)
//   icon-maskable-192 / -512.png    — Android, рабочий стол
//   apple-touch-icon.png (180x180)  — iPhone/iPad
//
// ВАЖНО: это иконки приложения. Логотип в интерфейсе — отдельный файл
// public/logo.svg, он здесь не участвует.
//
// Зачем несколько файлов. Иконку с purpose "maskable" лаунчер Android режет
// по своей форме (круг, squircle, скруглённый квадрат): гарантированно видна
// только центральная область — круг диаметром 80% холста, и он растягивает её
// на всю плитку. iOS манифест не читает вовсе и прозрачность в иконке заливает
// чёрным — ему нужен отдельный непрозрачный apple-touch-icon.
//
// Два режима, определяются автоматически по углу исходника:
//
//   «готовая иконка» — фон непрозрачен и залит под обрез (как у логотипа
//     «Совета матерей» на красной плашке). Картинка уже скомпонована: её
//     нельзя обрезать и незачем ужимать, просто масштабируем.
//
//   «логотип» — угол прозрачный, рисунок сам по себе. Обрезаем пустые поля,
//     ужимаем до safe zone и кладём на непрозрачную подложку.
//
// Требования к исходнику: PNG, квадрат, от 1024x1024.

import sharp from "sharp";
import { writeFileSync, existsSync } from "node:fs";

const SRC = process.argv.find((a) => a.endsWith(".png")) ?? "assets/app-icon.png";
// Подложка для режима «логотип»: npm run icons -- --bg=#1B3A6B
const bgArg = process.argv.find((a) => a.startsWith("--bg="));
const BG_OVERRIDE = bgArg ? bgArg.slice(5) : null;

// Доля холста под рисунок в режиме «логотип». Safe zone — круг 80% холста;
// берём 0.70 с запасом. Лаунчер растянет эти 80% на плитку, поэтому логотип
// займёт ~87% видимой иконки — крупно и с полями.
const MASKABLE_SCALE = 0.7;
// iOS маской не режет, только скругляет углы — можно крупнее.
const APPLE_SCALE = 0.9;

if (!existsSync(SRC)) {
  console.error(`Не найден исходник: ${SRC}`);
  console.error("Положите квадратный PNG (от 1024x1024) в assets/app-icon.png");
  process.exit(1);
}

const meta = await sharp(SRC).metadata();
if (meta.width !== meta.height) {
  console.warn(`⚠ исходник не квадратный (${meta.width}x${meta.height})`);
}
if (Math.max(meta.width, meta.height) < 512) {
  console.warn(`⚠ исходник мелкий (${meta.width}x${meta.height}) — иконка будет мылить`);
}

// --- Определяем режим по угловому пикселю -----------------------------------
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => {
  const i = (y * info.width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};
const corner = at(0, 0);
const READY = corner[3] >= 250; // фон залит => картинка уже скомпонована
const hex = (c) => "#" + c.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
const BG = BG_OVERRIDE ?? (READY ? hex(corner) : "#ffffff");

console.log(`Исходник: ${SRC} (${meta.width}x${meta.height})`);
console.log(
  READY
    ? `Режим: готовая иконка — фон ${BG} залит под обрез, компоновку не трогаю`
    : `Режим: логотип — прозрачный фон, ужимаю до safe zone на подложке ${BG}`,
);

// --- Проверка safe zone: не вылезает ли рисунок за круг 80% ------------------
// Заодно запоминаем долю холста под контентом — она нужна значку вкладки.
let contentPct = 1;
if (READY) {
  const cx = info.width / 2;
  const cy = info.height / 2;
  const near = (p) =>
    Math.abs(p[0] - corner[0]) < 12 && Math.abs(p[1] - corner[1]) < 12 && Math.abs(p[2] - corner[2]) < 12;
  let maxR = 0;
  for (let y = 0; y < info.height; y += 2) {
    for (let x = 0; x < info.width; x += 2) {
      if (near(at(x, y))) continue; // это фон, не контент
      const r = Math.hypot(x - cx, y - cy);
      if (r > maxR) maxR = r;
    }
  }
  contentPct = (2 * maxR) / info.width;
  const verdict = contentPct <= 0.8 ? "✓ внутри safe zone (80%)" : "✗ ВЫЛЕЗАЕТ за safe zone — срежется!";
  console.log(`Контент занимает ${(contentPct * 100).toFixed(0)}% холста — ${verdict}`);
}
console.log("");

// Поля обрезаем только у «логотипа»: у готовой иконки фон — часть дизайна,
// и trim срезал бы его начисто (например, красную плашку вокруг эмблемы).
const source = READY ? SRC : await sharp(SRC).trim({ threshold: 2 }).toBuffer();

/** PNG-буфер: рисунок по центру квадратного холста. bg=null → прозрачный фон. */
async function make(size, scale, bg) {
  if (scale === 1 && bg) {
    // Готовая иконка: только масштаб. flatten убирает сглаживание по краям,
    // иначе iOS зальёт полупрозрачные пиксели чёрным.
    return sharp(source)
      .resize(size, size)
      .flatten({ background: bg })
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
  }
  const inner = Math.round(size * scale);
  const logo = await sharp(source)
    .resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const pad = Math.round((size - inner) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logo, top: pad, left: pad }])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

async function render(out, size, scale, bg) {
  const buf = await make(size, scale, bg);
  writeFileSync(`public/${out}`, buf);
  console.log(`  public/${out.padEnd(26)} ${size}x${size}  ${Math.round(buf.length / 1024)} KB`);
}

/**
 * Значок вкладки. sharp не умеет писать .ico, но ICO — это контейнер:
 * заголовок + оглавление + сами картинки, и с Vista внутрь кладут обычные PNG.
 * Собираем такой контейнер руками, иначе вкладка осталась бы со старым
 * значком, а иконка приложения — с новым.
 */
async function renderFavicon(out, sizes, bg) {
  // Значок вкладки маской не режется, поэтому поля вокруг рисунка тут только
  // мешают: на 16x16 эмблема в них тонет. Подрезаем холст до самого рисунка
  // (с полем 6%), и он занимает почти всю плитку.
  let src = source;
  if (READY && contentPct < 0.95) {
    const keep = Math.min(1, contentPct * 1.06);
    const side = Math.round(info.width * keep);
    const off = Math.round((info.width - side) / 2);
    src = await sharp(source).extract({ left: off, top: off, width: side, height: side }).toBuffer();
  }
  // fit: contain — обрезанный логотип может быть не квадратным, растягивать нельзя.
  // ensureAlpha обязателен: flatten отдаёт RGB без альфа-канала, а Next при
  // сборке разбирает favicon.ico и падает с «The PNG is not in RGBA format».
  const pngs = await Promise.all(
    sizes.map((s) => {
      const img = sharp(src).resize({
        width: s,
        height: s,
        fit: "contain",
        background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 },
      });
      return (bg ? img.flatten({ background: bg }) : img)
        .ensureAlpha()
        .png({ compressionLevel: 9 })
        .toBuffer();
    }),
  );

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(sizes.length, 4);

  let offset = 6 + 16 * sizes.length;
  const entries = sizes.map((s, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s >= 256 ? 0 : s, 0); // 0 означает 256
    e.writeUInt8(s >= 256 ? 0 : s, 1);
    e.writeUInt8(0, 2); // палитра не используется
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // бит на пиксель
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
    return e;
  });

  const ico = Buffer.concat([header, ...entries, ...pngs]);
  writeFileSync(out, ico);
  console.log(`  ${out.padEnd(33)} ${sizes.join("/")}  ${Math.round(ico.length / 1024)} KB`);
}

// Размеры внутри favicon.ico: 16 — вкладка, 32 — панель закладок и Retina,
// 48 — ярлык на рабочем столе Windows.
const FAVICON_SIZES = [16, 32, 48];

if (READY) {
  // Компоновка уже верная — во все файлы кладём картинку целиком.
  await render("icon-192.png", 192, 1, BG);
  await render("icon-512.png", 512, 1, BG);
  await render("icon-maskable-192.png", 192, 1, BG);
  await render("icon-maskable-512.png", 512, 1, BG);
  await render("apple-touch-icon.png", 180, 1, BG);
  await renderFavicon("src/app/favicon.ico", FAVICON_SIZES, BG);
} else {
  await render("icon-192.png", 192, 1, null); // "any": обрезки нет, фон прозрачный
  await render("icon-512.png", 512, 1, null);
  await render("icon-maskable-192.png", 192, MASKABLE_SCALE, BG);
  await render("icon-maskable-512.png", 512, MASKABLE_SCALE, BG);
  await render("apple-touch-icon.png", 180, APPLE_SCALE, BG);
  await renderFavicon("src/app/favicon.ico", FAVICON_SIZES, null);
}

console.log("\nГотово. Проверить обрезку: node scripts/preview-icons.mjs");
