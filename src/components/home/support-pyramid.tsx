import Link from "next/link";
import { Star } from "lucide-react";
import { PYRAMID_LEVELS, PYRAMID_CROWN } from "@/lib/home-taxonomy";
import { PYRAMID_ICONS } from "./icons";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

// Ширина «ступеней» сверху вниз (%, узкая вершина → широкое основание).
const WIDTHS = [56, 65, 74, 83, 92, 100];

// Пастельная радуга по уровням (классы Tailwind — литералами). Каждое
// семейство цвета — своё, чтобы ступени не сливались. Иконка ярче подложки,
// текст тёмный для читаемости.
const LEVEL_TINT: Record<string, { box: string; icon: string; fg: string }> = {
  federal: { box: "border-red-200 bg-red-100 hover:bg-red-200/70", icon: "text-red-500", fg: "text-red-800" },
  regional: { box: "border-orange-200 bg-orange-100 hover:bg-orange-200/70", icon: "text-orange-500", fg: "text-orange-800" },
  municipal: { box: "border-green-200 bg-green-100 hover:bg-green-200/70", icon: "text-green-600", fg: "text-green-800" },
  employer: { box: "border-teal-200 bg-teal-100 hover:bg-teal-200/70", icon: "text-teal-600", fg: "text-teal-800" },
  vuz: { box: "border-blue-200 bg-blue-100 hover:bg-blue-200/70", icon: "text-blue-600", fg: "text-blue-800" },
  nko: { box: "border-violet-200 bg-violet-100 hover:bg-violet-200/70", icon: "text-violet-600", fg: "text-violet-800" },
};

/**
 * Пирамида мер поддержки в стиле «Шпаргалки»: белые ступени, расширяющиеся
 * книзу. Сверху — звезда (неформальная поддержка), внизу — федеральные.
 */
export function SupportPyramid() {
  // Рисуем сверху вниз: вершина — последний уровень массива (НКО).
  const topToBottom = [...PYRAMID_LEVELS].reverse();

  return (
    <section>
      <SectionHeading subtitle="Кто и на каком уровне помогает семьям с детьми">
        Пирамида мер поддержки
      </SectionHeading>

      <div className="mt-5 flex flex-col items-center gap-2">
        {/* Венец — звезда (бабушки и дедушки) */}
        <Link
          href={PYRAMID_CROWN.href}
          style={{ width: "46%" }}
          className="flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2.5 shadow-sm transition-colors hover:bg-amber-200/70"
        >
          <Star className="size-4 shrink-0 fill-amber-400 text-amber-500" />
          <span className="text-center text-[11px] font-bold uppercase leading-tight tracking-wide text-amber-700">
            {PYRAMID_CROWN.title}
          </span>
        </Link>

        {topToBottom.map((lvl, i) => {
          const Icon = PYRAMID_ICONS[lvl.id];
          const tint = LEVEL_TINT[lvl.id];
          return (
            <Link
              key={lvl.id}
              href={lvl.href}
              style={{ width: `${WIDTHS[i]}%` }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-3 shadow-sm transition-all",
                tint.box,
              )}
            >
              {Icon && <Icon className={cn("size-4 shrink-0", tint.icon)} />}
              <span
                className={cn(
                  "text-center text-xs font-bold uppercase leading-tight tracking-wide",
                  tint.fg,
                )}
              >
                {lvl.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
