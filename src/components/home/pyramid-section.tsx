"use client";

import { useState } from "react";

// Секция «Пирамида мер поддержки».
// Одна «идеальная» пирамида (вершина → полная ширина основания) нарезана на
// 6 полос с зазорами — поэтому угол боковых сторон у всех уровней одинаковый.
// Верхняя полоса — треугольник, остальные — трапеции. Растянута на всю ширину.
//
// Пирамида НЕкликабельна: она объясняет, где искать меры (Госуслуги, МФЦ,
// работодатель, вуз, НКО), а не фильтрует каталог. Раньше клик уводил на
// /catalog без всякого фильтра — это вводило в заблуждение. Уровни для
// муниципальных, работодателя, вуза и НКО в базе вообще не заведены (есть
// только federal/regional), фильтровать по ним нечего.
// Подсказка при наведении/тапе остаётся — она и есть смысл блока.

const T_TEXT = "#333333";
const ACCENT = "#B21F3A";

const VBW = 360;
const CX = 180;
const TOP0 = 6;
const GAP = 8;
const R = 12;
const W = 360; // ширина основания (на всю ширину)
const H = 384; // высота «идеальной» пирамиды (задаёт угол сторон)
const N = 6; // число уровней
const VBH = TOP0 + H + TOP0;

// 6 оттенков — плавный переход в той же палитре (#B21F3A → #F5DCE2).
const COLORS = ["#B21F3A", "#BF455C", "#CD6B7D", "#DA909F", "#E8B6C0", "#F5DCE2"];

// Подписи по индексу уровня (сверху вниз): вершина → основание.
const LABELS = ["НКО", "ВУЗ", "От работодателя", "Муниципальные", "Региональные", "Федеральные"];
// Кегль растёт книзу так, чтобы каждое нижнее слово было шире вышестоящего.
const LABEL_SIZE = [11, 13, 14, 18, 20, 22];
// На тёмных верхних полосах — белый текст, на светлых нижних — тёмно-винный.
const LABEL_COLOR = ["#fff", "#fff", "#fff", "#fff", "#7A1528", "#7A1528"];

// Подсказки по индексу уровня (сверху вниз).
const TOOLTIP: { title: string; desc: string; examples: string[] }[] = [
  {
    title: "НКО и фонды",
    desc: "Помощь от некоммерческих организаций, фондов и благотворителей.",
    examples: ["Фонд «Круг добра» — лекарства детям", "Кризисные центры для семей", "Юридическая и гуманитарная помощь"],
  },
  {
    title: "От вуза",
    desc: "Поддержка студентам и студенческим семьям от вузов и колледжей.",
    examples: ["Социальная стипендия", "Материальная помощь", "Места в общежитии для семейных"],
  },
  {
    title: "От работодателя",
    desc: "Меры поддержки сотрудникам с детьми от компании.",
    examples: ["Выплата при рождении ребёнка", "ДМС для семьи", "Помощь с жильём и путёвки"],
  },
  {
    title: "Муниципальные меры",
    desc: "Поддержка от города или района по месту жительства.",
    examples: ["Льготный проезд", "Питание в школе", "Местные единовременные выплаты"],
  },
  {
    title: "Региональные меры",
    desc: "Меры вашего региона (субъекта РФ).",
    examples: ["Региональный маткапитал", "Выплаты многодетным", "Компенсация ЖКУ"],
  },
  {
    title: "Федеральные меры",
    desc: "Общероссийские меры — действуют по всей стране.",
    examples: ["Единое пособие", "Материнский капитал", "Семейная ипотека"],
  },
];

const widthAt = (y: number) => (W * (y - TOP0)) / H;

interface Lv {
  color: string;
  pts: [number, number][];
  cyPct: number; // вертикальный центр уровня, % высоты
}

function buildLevels(): Lv[] {
  const bandH = H / N;
  const lv: Lv[] = [];
  for (let i = 0; i < N; i++) {
    const topY = TOP0 + i * bandH;
    const botY = i === N - 1 ? TOP0 + H : TOP0 + (i + 1) * bandH - GAP;
    const topW = widthAt(topY);
    const botW = widthAt(botY);
    const pts: [number, number][] =
      topW <= 0.5
        ? [
            [CX, topY],
            [CX + botW / 2, botY],
            [CX - botW / 2, botY],
          ]
        : [
            [CX - topW / 2, topY],
            [CX + topW / 2, topY],
            [CX + botW / 2, botY],
            [CX - botW / 2, botY],
          ];
    lv.push({ color: COLORS[i], pts, cyPct: ((topY + botY) / 2 / VBH) * 100 });
  }
  return lv;
}

const LEVELS = buildLevels();

// Путь полигона со скруглёнными углами (3 или 4 вершины).
function roundedPath(pts: [number, number][], r: number): string {
  const n = pts.length;
  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1]];
  const len = (v: number[]) => Math.hypot(v[0], v[1]);
  const norm = (v: number[]) => {
    const l = len(v) || 1;
    return [v[0] / l, v[1] / l];
  };
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const vIn = norm(sub(cur, prev));
    const vOut = norm(sub(next, cur));
    const rr = Math.min(r, len(sub(cur, prev)) / 2, len(sub(cur, next)) / 2);
    const pIn = [cur[0] - vIn[0] * rr, cur[1] - vIn[1] * rr];
    const pOut = [cur[0] + vOut[0] * rr, cur[1] + vOut[1] * rr];
    d +=
      (i === 0 ? "M" : " L") +
      ` ${pIn[0].toFixed(2)} ${pIn[1].toFixed(2)}` +
      ` Q ${cur[0].toFixed(2)} ${cur[1].toFixed(2)} ${pOut[0].toFixed(2)} ${pOut[1].toFixed(2)}`;
  }
  return d + " Z";
}

export function PyramidSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      className="px-5 pb-10 pt-2"
      style={{ fontFamily: "var(--font-inter), sans-serif", color: T_TEXT }}
    >
      {/* cursor:help вместо pointer — уровень не ведёт никуда, но по наведению
          (на телефоне — по тапу) показывает подсказку. Эффект нажатия :active
          убран: он обещал переход, которого нет. Лёгкое увеличение при
          наведении оставлено — подсказывает, что тут есть что посмотреть. */}
      <style>{`.pyr-lvl{transition:transform .15s ease;transform-box:fill-box;transform-origin:center;cursor:help}.pyr-lvl:hover{transform:scale(1.02)}`}</style>

      <h2
        className="text-center text-[28px] font-normal leading-[1.12]"
        style={{ fontFamily: "var(--font-playfair), serif", color: "#15234A" }}
      >
        Пирамида мер поддержки
      </h2>

      {/* Пирамида во всю ширину (выходит за паддинги секции) */}
      <div className="-mx-5 mt-5">
        <div className="relative" style={{ aspectRatio: `${VBW} / ${VBH}` }}>
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${VBW} ${VBH}`}>
            {LEVELS.map((lvl, i) => (
              <path
                key={i}
                className="pyr-lvl"
                d={roundedPath(lvl.pts, R)}
                fill={lvl.color}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>

          {/* Подписи уровней (внутри полос, пирамидальный кегль) */}
          <div className="pointer-events-none absolute inset-0">
            {LEVELS.map((lvl, i) => (
              <span
                key={i}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-semibold leading-none"
                style={{
                  top: `${lvl.cyPct}%`,
                  fontSize: `${LABEL_SIZE[i]}px`,
                  color: LABEL_COLOR[i],
                  // верхнюю подпись (НКО) опускаем на 1 кегль ниже
                  marginTop: i === 0 ? `${LABEL_SIZE[i]}px` : undefined,
                }}
              >
                {LABELS[i]}
              </span>
            ))}
          </div>

          {/* Подсказка при наведении */}
          {hovered !== null && (
            <div
              className="pointer-events-none absolute z-50 w-[260px] max-w-[82%] rounded-2xl bg-white p-3.5 shadow-[0_14px_34px_-10px_rgba(21,35,74,0.4)] ring-1 ring-black/5"
              style={{
                left: "50%",
                top: `${LEVELS[hovered].cyPct}%`,
                transform:
                  hovered <= 1
                    ? "translate(-50%, 14px)"
                    : "translate(-50%, calc(-100% - 14px))",
              }}
            >
              <p className="text-[14px] font-semibold" style={{ color: "#15234A" }}>
                {TOOLTIP[hovered].title}
              </p>
              <p className="mt-1 text-[12px] leading-snug" style={{ color: T_TEXT }}>
                {TOOLTIP[hovered].desc}
              </p>
              <ul className="mt-2 space-y-1">
                {TOOLTIP[hovered].examples.map((ex) => (
                  <li
                    key={ex}
                    className="flex gap-1.5 text-[12px] leading-snug"
                    style={{ color: T_TEXT }}
                  >
                    <span style={{ color: ACCENT }}>•</span>
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-[15px] font-medium leading-snug" style={{ color: T_TEXT }}>
        Меры поддержки на всех уровнях —
        <br />
        для вашей семьи
      </p>
    </section>
  );
}
