import Link from "next/link";
import { Star } from "lucide-react";
import { PYRAMID_LEVELS, PYRAMID_CROWN } from "@/lib/home-taxonomy";
import { PYRAMID_ICONS } from "./icons";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

// Ширина «ступеней» сверху вниз (%, узкая вершина → широкое основание).
const WIDTHS = [56, 65, 74, 83, 92, 100];

// Свой мягкий оттенок для каждого уровня (классы Tailwind — литералами).
const LEVEL_TINT: Record<string, { box: string; fg: string }> = {
  federal: { box: "border-blue-200 bg-blue-50 hover:bg-blue-100", fg: "text-blue-800" },
  regional: { box: "border-sky-200 bg-sky-50 hover:bg-sky-100", fg: "text-sky-800" },
  municipal: { box: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100", fg: "text-emerald-800" },
  employer: { box: "border-orange-200 bg-orange-50 hover:bg-orange-100", fg: "text-orange-800" },
  vuz: { box: "border-violet-200 bg-violet-50 hover:bg-violet-100", fg: "text-violet-800" },
  nko: { box: "border-rose-200 bg-rose-50 hover:bg-rose-100", fg: "text-rose-800" },
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
          className="flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 shadow-sm transition-colors hover:bg-amber-100"
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
              {Icon && <Icon className={cn("size-4 shrink-0", tint.fg)} />}
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
