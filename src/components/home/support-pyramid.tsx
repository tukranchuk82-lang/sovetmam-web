import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { PYRAMID_LEVELS, PYRAMID_CROWN } from "@/lib/home-taxonomy";

// Геометрия треугольника в координатах viewBox.
const APEX_X = 150;
const APEX_Y = 8;
const BASE_Y = 212;
const BASE_HALF = 132; // половина ширины основания

const xLeft = (y: number) =>
  APEX_X - (BASE_HALF * (y - APEX_Y)) / (BASE_Y - APEX_Y);
const xRight = (y: number) =>
  APEX_X + (BASE_HALF * (y - APEX_Y)) / (BASE_Y - APEX_Y);

/**
 * Пирамида мер поддержки. Снизу — федеральные (фундамент), сверху — НКО,
 * над вершиной — «звезда» неформальной поддержки (бабушки и дедушки).
 * Сама пирамида — наглядная схема; навигация — в списке уровней под ней.
 */
export function SupportPyramid() {
  // Рисуем сверху вниз: вершина — последний уровень массива (НКО).
  const topToBottom = [...PYRAMID_LEVELS].reverse();
  const bandTop = (BASE_Y - APEX_Y) / topToBottom.length;

  return (
    <section>
      <h2 className="text-lg font-extrabold tracking-tight text-foreground">
        Пирамида мер поддержки
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Кто и на каком уровне помогает семьям с детьми
      </p>

      <div className="mt-3 rounded-3xl bg-white p-4 ring-1 ring-black/5">
        <svg
          viewBox="0 0 300 232"
          className="mx-auto block w-full max-w-[300px]"
          role="img"
          aria-label="Пирамида: федеральные, региональные, муниципальные меры, от работодателя, ВУЗ, НКО"
        >
          {/* Звезда над вершиной — неформальная поддержка */}
          <g>
            <polygon
              points="150,2 152.6,9.2 160,9.4 154,14 156.2,21 150,16.8 143.8,21 146,14 140,9.4 147.4,9.2"
              fill="#f5b301"
            />
          </g>

          {topToBottom.map((lvl, i) => {
            const yTop = APEX_Y + i * bandTop + (i === 0 ? 18 : 1.2);
            const yBot = APEX_Y + (i + 1) * bandTop;
            const cy = (yTop + yBot) / 2;
            const points = `${xLeft(yTop)},${yTop} ${xRight(yTop)},${yTop} ${xRight(yBot)},${yBot} ${xLeft(yBot)},${yBot}`;
            const bandWidth = xRight(cy) - xLeft(cy);
            return (
              <g key={lvl.id}>
                <polygon points={points} fill={lvl.color} />
                <text
                  x={APEX_X}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize={bandWidth < 90 ? 9 : 11}
                  fontWeight={700}
                  style={{ letterSpacing: "0.02em" }}
                >
                  {lvl.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Венец — отдельной карточкой */}
      <Link
        href={PYRAMID_CROWN.href}
        className="mt-3 flex items-center gap-3 rounded-2xl bg-amber-50 p-3.5 ring-1 ring-amber-200/70 transition-colors hover:bg-amber-100/70"
      >
        <Star className="size-5 shrink-0 fill-amber-400 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            {PYRAMID_CROWN.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {PYRAMID_CROWN.source}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      {/* Тапабельный список уровней (снизу вверх, как фундамент → вершина) */}
      <ul className="mt-2.5 space-y-2">
        {PYRAMID_LEVELS.map((lvl) => (
          <li key={lvl.id}>
            <Link
              href={lvl.href}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-black/5 transition-colors hover:bg-stone-50"
            >
              <span
                aria-hidden
                className="size-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: lvl.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">
                  {lvl.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {lvl.source}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
