import { PYRAMID_LEVELS } from "@/lib/home-taxonomy";
import { PYRAMID_ICONS } from "./icons";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

// Ширина «ступеней» сверху вниз (%, узкая вершина → широкое основание).
const WIDTHS = [50, 57, 65, 74, 83, 92, 100];

// Пастельная радуга по уровням (классы Tailwind — литералами). Как у «Бабушек
// и дедушек»: чёткая рамка в тон фона + иконка, полностью залитая тем же
// цветом (fill). Текст тёмный для читаемости.
// Без hover-подсветки: ступени некликабельны, подсвечивать нечего.
const LEVEL_TINT: Record<
  string,
  { box: string; icon: string; fg: string }
> = {
  federal: { box: "border-red-300 bg-red-100", icon: "fill-red-400 text-red-500", fg: "text-red-700" },
  regional: { box: "border-violet-300 bg-violet-100", icon: "fill-violet-400 text-violet-500", fg: "text-violet-700" },
  municipal: { box: "border-yellow-300 bg-yellow-100", icon: "fill-yellow-400 text-yellow-500", fg: "text-yellow-700" },
  employer: { box: "border-green-300 bg-green-100", icon: "fill-green-400 text-green-500", fg: "text-green-700" },
  vuz: { box: "border-pink-300 bg-pink-100", icon: "fill-pink-400 text-pink-500", fg: "text-pink-700" },
  nko: { box: "border-blue-300 bg-blue-100", icon: "fill-blue-400 text-blue-500", fg: "text-blue-700" },
  business: { box: "border-teal-300 bg-teal-100", icon: "fill-teal-400 text-teal-500", fg: "text-teal-700" },
};

/**
 * Пирамида мер поддержки в стиле «Шпаргалки»: белые ступени, расширяющиеся
 * книзу. Сверху — бизнес, внизу — федеральные.
 *
 * НЕкликабельна — как и пирамида на главной (pyramid-section.tsx). Ступени
 * объясняют, КТО помогает на каждом уровне, а не фильтруют каталог: в базе
 * заведены только уровни federal/regional, мер муниципальных, от работодателя,
 * вуза и НКО нет вовсе. Раньше ступени вели на /catalog?level=…, но каталог
 * этот параметр не читает — открывался полный список, что вводило в
 * заблуждение.
 */
export function SupportPyramid() {
  // Рисуем сверху вниз: вершина — последний уровень массива (Бизнес).
  const topToBottom = [...PYRAMID_LEVELS].reverse();

  return (
    <section>
      <SectionHeading subtitle="Кто и на каком уровне помогает семьям с детьми">
        Пирамида мер поддержки
      </SectionHeading>

      <div className="mt-5 flex flex-col items-center gap-2">
        {topToBottom.map((lvl, i) => {
          const Icon = PYRAMID_ICONS[lvl.id];
          const tint = LEVEL_TINT[lvl.id];
          return (
            <div
              key={lvl.id}
              data-level={lvl.id}
              style={{ width: `${WIDTHS[i]}%`, animationDelay: `${(i + 1) * 80}ms` }}
              className={cn(
                "sm-step sm-pop flex items-center justify-center gap-2 rounded-lg border px-3 py-3 shadow-sm",
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
