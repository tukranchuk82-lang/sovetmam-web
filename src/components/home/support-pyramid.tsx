import Link from "next/link";
import { Star } from "lucide-react";
import { PYRAMID_LEVELS, PYRAMID_CROWN } from "@/lib/home-taxonomy";
import { PYRAMID_ICONS } from "./icons";
import { SectionHeading } from "./section-heading";

// Ширина «ступеней» сверху вниз (%, узкая вершина → широкое основание).
const WIDTHS = [56, 65, 74, 83, 92, 100];

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
          return (
            <Link
              key={lvl.id}
              href={lvl.href}
              style={{ width: `${WIDTHS[i]}%` }}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-3 shadow-[0_4px_14px_-8px_rgba(27,58,107,0.5)] transition-all hover:border-brand/40 hover:shadow-[0_6px_18px_-8px_rgba(27,58,107,0.6)]"
            >
              {Icon && <Icon className="size-4 shrink-0 text-brand" />}
              <span className="text-center text-xs font-bold uppercase leading-tight tracking-wide text-brand">
                {lvl.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
