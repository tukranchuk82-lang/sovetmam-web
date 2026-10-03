import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Графики без внешних библиотек: обычный SVG и CSS. Их нужно немного и
 * простых — динамика по дням и рейтинг «топ-N», — поэтому тянуть в приложение
 * тяжёлый пакет ради двух видов картинок незачем.
 */

const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function dayLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

/** Динамика по дням: закрашенная область с подсказкой на каждом дне. */
export function AreaChart({
  data,
  height = 168,
  className,
  unit = "",
}: {
  data: { day: string; value: number }[];
  height?: number;
  className?: string;
  unit?: string;
}) {
  const W = 600;
  const H = 160;
  const padX = 4;
  const padTop = 10;
  const padBottom = 6;
  const max = Math.max(1, ...data.map((d) => d.value));
  // «Красивый» верх шкалы: 5, 10, 20, 50, 100 …
  const niceMax = (() => {
    const p = Math.pow(10, Math.floor(Math.log10(max)));
    const n = max / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  })();
  const step = data.length > 1 ? (W - padX * 2) / (data.length - 1) : 0;
  const x = (i: number) => padX + i * step;
  const y = (v: number) => padTop + (1 - v / niceMax) * (H - padTop - padBottom);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = data.length
    ? `${line} L${x(data.length - 1).toFixed(1)},${H - padBottom} L${x(0).toFixed(1)},${H - padBottom} Z`
    : "";
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <figure className={cn("w-full", className)}>
      <div className="relative" style={{ height }}>
        {/* Подписи шкалы — на уровне линий, нарисованных внутри графика */}
        {[niceMax, niceMax / 2, 0].map((v) => (
          <span
            key={v}
            className="pointer-events-none absolute left-0 w-7 -translate-y-1/2 text-right text-[10px] tabular-nums text-muted-foreground/70"
            style={{ top: `${(y(v) / H) * 100}%` }}
          >
            {Math.round(v)}
          </span>
        ))}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-y-0 left-9 right-0 h-full w-[calc(100%-2.25rem)] overflow-visible"
          role="img"
          aria-label={`Динамика: всего ${total}${unit}`}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--chart-line)" }} stopOpacity="0.28" />
              <stop offset="100%" style={{ stopColor: "var(--chart-line)" }} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[niceMax, niceMax / 2, 0].map((v) => (
            <line
              key={v}
              x1={0}
              x2={W}
              y1={y(v)}
              y2={y(v)}
              style={{ stroke: "var(--chart-grid)" }}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {area && <path d={area} fill="url(#area-fill)" />}
          {line && (
            <path
              d={line}
              fill="none"
              style={{ stroke: "var(--chart-line)" }}
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {/* Невидимые столбики на каждый день — родные подсказки браузера */}
          {data.map((d, i) => (
            <rect
              key={d.day}
              x={x(i) - Math.max(step / 2, 3)}
              y={0}
              width={Math.max(step, 6)}
              height={H}
              fill="transparent"
            >
              <title>{`${dayLabel(d.day)}: ${d.value}${unit}`}</title>
            </rect>
          ))}
        </svg>
      </div>
      {data.length > 1 && (
        <figcaption className="ml-9 mt-1.5 flex justify-between text-[10.5px] text-muted-foreground">
          <span>{dayLabel(data[0].day)}</span>
          <span>{dayLabel(data[Math.floor(data.length / 2)].day)}</span>
          <span>{dayLabel(data[data.length - 1].day)}</span>
        </figcaption>
      )}
    </figure>
  );
}

export interface BarItem {
  label: string;
  value: number;
  /** Мелкая подпись справа от названия (например, «12 обращений»). */
  hint?: string;
  href?: string;
}

/** Рейтинг «топ-N»: горизонтальные полосы с числом и долей. */
export function BarList({
  items,
  total,
  emptyText = "Пока нет данных",
  max,
  tone = "brand",
}: {
  items: BarItem[];
  /** Знаменатель для долей; по умолчанию — сумма показанного. */
  total?: number;
  emptyText?: string;
  /** Сколько строк показывать; остальное сворачивается в «ещё N». */
  max?: number;
  tone?: "brand" | "navy";
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-[13px] text-muted-foreground">{emptyText}</p>;
  }
  const shown = max ? items.slice(0, max) : items;
  const rest = max ? items.length - shown.length : 0;
  const top = Math.max(1, ...shown.map((i) => i.value));
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);
  const bar = tone === "navy" ? "bg-[#1B3A6B]" : "bg-primary";

  return (
    <ul className="space-y-2">
      {shown.map((it) => {
        const pct = sum > 0 ? Math.round((it.value / sum) * 100) : 0;
        const row = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate font-medium">{it.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                <b className="font-semibold text-foreground">{it.value}</b>
                {it.hint && <span className="ml-1.5 text-[11.5px]">{it.hint}</span>}
                <span className="ml-1.5 text-[11.5px]">{pct}%</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", bar)} style={{ width: `${(it.value / top) * 100}%` }} />
            </div>
          </>
        );
        return (
          <li key={it.label}>
            {it.href ? (
              <Link href={it.href} className="block rounded-md transition-colors hover:bg-muted/60">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
      {rest > 0 && <li className="pt-1 text-[12px] text-muted-foreground">и ещё {rest}</li>}
    </ul>
  );
}
