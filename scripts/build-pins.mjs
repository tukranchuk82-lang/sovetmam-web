// Вырезаем 4 пина из way.png в прозрачные спрайты.
// Фон убираем заливкой ОТ КРАЯ кропа по светлым пикселям: так белая иконка
// внутри пина (кольцо, календарь) остаётся на месте — простой порог по яркости
// пробил бы в ней дыры.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

// Режем из НЕсжатого оригинала (assets/way-source.png), а не из public/way.png:
// опубликованная картинка пережата в 128-цветную палитру, и на градиентной
// заливке пинов от неё виден бэндинг. В фоне при ширине 420 px он незаметен, а
// вот в спрайте, который ещё и пульсирует, — нет.
const SRC = "assets/way-source.png";
const OUT = "public/pins";
mkdirSync(OUT, { recursive: true });

// bbox пинов (см. _tmp-pins.mjs) + запас на мягкую тень/сглаживание
const PAD = 8;
const BOXES = [
  { key: "once-life", minX: 209, maxX: 329, minY: 109, maxY: 285 },
  { key: "once-year", minX: 560, maxX: 680, minY: 350, maxY: 525 },
  { key: "once-month", minX: 225, maxX: 352, minY: 671, maxY: 852 },
  { key: "situational", minX: 613, maxX: 741, minY: 908, maxY: 1093 },
];

const meta = await sharp(SRC).metadata();
const IW = meta.width,
  IH = meta.height;

const out = [];
for (const b of BOXES) {
  const left = Math.max(0, b.minX - PAD);
  const top = Math.max(0, b.minY - PAD);
  const width = Math.min(IW - left, b.maxX - b.minX + 1 + PAD * 2);
  const height = Math.min(IH - top, b.maxY - b.minY + 1 + PAD * 2);

  const { data, info } = await sharp(SRC)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width,
    H = info.height,
    C = info.channels;

  // Светлый = фон (белое поле, бледно-розовая дорога и ореол под пином)
  const light = (i) => data[i] > 228 && data[i + 1] > 218 && data[i + 2] > 218;

  // Заливка от края по светлым пикселям
  const bg = new Uint8Array(W * H);
  const q = [];
  const push = (x, y) => {
    const p = y * W + x;
    if (bg[p]) return;
    if (!light(p * C)) return;
    bg[p] = 1;
    q.push(p);
  };
  for (let x = 0; x < W; x++) {
    push(x, 0);
    push(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    push(0, y);
    push(W - 1, y);
  }
  while (q.length) {
    const p = q.pop();
    const x = p % W,
      y = (p / W) | 0;
    if (x > 0) push(x - 1, y);
    if (x < W - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < H - 1) push(x, y + 1);
  }

  // alpha: 0 — фон, 255 — пин (и всё, что внутри его силуэта)
  for (let p = 0; p < W * H; p++) data[p * C + 3] = bg[p] ? 0 : 255;

  // Мягкий край: размываем только альфу, чтобы спрайт не был «вырезан ножницами»
  const rgb = Buffer.alloc(W * H * 3);
  const alpha = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) {
    rgb[p * 3] = data[p * C];
    rgb[p * 3 + 1] = data[p * C + 1];
    rgb[p * 3 + 2] = data[p * C + 2];
    alpha[p] = data[p * C + 3];
  }
  // .blur() разворачивает одноканальный raw в RGB — буфер получается втрое
  // длиннее, и joinChannel кладёт его в альфу со сдвигом (полосы). Забираем
  // обратно один канал.
  const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
    .blur(0.6)
    .extractChannel(0)
    .raw()
    .toBuffer();

  const file = `${OUT}/pin-${b.key}.png`;
  await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(blurred, { raw: { width: W, height: H, channels: 1 } })
    // Без палитры: у пинов градиентная заливка, квантование в 64 цвета давало
    // на ней видимые полосы.
    .png({ compressionLevel: 9 })
    .toFile(file);

  const px = (v, total) => ((v / total) * 100).toFixed(3);
  out.push({
    key: b.key,
    file,
    left: px(left, IW),
    top: px(top, IH),
    width: px(width, IW),
    height: px(height, IH),
  });
}
console.log(JSON.stringify(out, null, 2));
