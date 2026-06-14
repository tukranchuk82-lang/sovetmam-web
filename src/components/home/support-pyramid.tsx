import Link from "next/link";
import { Star } from "lucide-react";
import { PYRAMID_LEVELS, PYRAMID_CROWN } from "@/lib/home-taxonomy";
import { PYRAMID_ICONS } from "./icons";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

// Ширина «ступеней» сверху вниз (%, узкая вершина → широкое основание).
const WIDTHS = [56, 65, 74, 83, 92, 100];

// Пастельная радуга по уровням (классы Tailwind — литералами). Как у «Бабушек
// и дедушек»: чёткая рамка в тон фона + иконка, полностью залитая тем же
// цветом (fill). Текст тёмный для читаемости.
const LEVEL_TINT: Record<
  string,
  { box: string; icon: string; fg: string }
> = {
  federal: { box: "border-red-300 bg-red-100 hover:bg-red-200/70", icon: "fill-red-400 text-red-500", fg: "text-red-700" },
  regional: { box: "border-orange-300 bg-orange-100 hover:bg-orange-200/70", icon: "fill-orange-400 text-orange-500", fg: "text-orange-700" },
  municipal: { box: "border-yellow-300 bg-yellow-100 hover:bg-yellow-200/70", icon: "fill-yellow-400 text-yellow-500", fg: "text-yellow-700" },
  employer: { box: "border-green-300 bg-green-100 hover:bg-green-200/70", icon: "fill-green-400 text-green-500", fg: "text-green-700" },
  vuz: { box: "border-sky-300 bg-sky-100 hover:bg-sky-200/70", icon: "fill-sky-400 text-sky-500", fg: "text-sky-700" },
  nko: { box: "border-blue-300 bg-blue-100 hover:bg-blue-200/70", icon: "fill-blue-400 text-blue-500", fg: "text-blue-700" },
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
          className="flex items-center justify-center gap-2 rounded-lg border border-violet-300 bg-violet-100 px-3 py-2.5 shadow-sm transition-colors hover:bg-violet-200/70"
        >
          <Star className="size-4 shrink-0 fill-violet-400 text-violet-500" />
          <span className="text-center text-[11px] font-bold uppercase leading-tight tracking-wide text-violet-700">
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
