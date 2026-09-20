import { Landmark } from "lucide-react";
import type { RegionalRepresentative } from "@/lib/representatives";
import { findRepresentative } from "@/lib/representatives";
import { RepresentativeDetails } from "@/components/representative-details";

const SERIF = { fontFamily: "var(--font-playfair), Georgia, serif" } as const;

// Палитра — та же, что у плашки курса на главной (components/home/course-banner),
// чтобы карточки читались как одна семья.
const PAPER = "#FCF9F1";
const BORDO = "#8E1D2C";
const NAVY = "#1B3A6B";
const INK = "#15234A";

/**
 * Кайма как на авторском конверте: косые бордовые и синие полосы через
 * бумажные промежутки. Поверх — косой блик и затемнение к низу, которые
 * превращают плоскую полосу в выпуклый бортик.
 */
const ENVELOPE_FRAME = [
  "linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 34%, rgba(255,255,255,0.28) 58%, rgba(0,0,0,0.16) 100%)",
  `repeating-linear-gradient(135deg, ${BORDO} 0 11px, ${PAPER} 11px 17px, ${NAVY} 17px 28px, ${PAPER} 28px 34px)`,
].join(", ");

/** Тонкая косая штриховка листа — фон «полосочками», но еле заметный, чтобы текст читался. */
const HATCH =
  "repeating-linear-gradient(135deg, rgba(27,58,107,0.045) 0 1px, transparent 1px 7px)";

/**
 * Карточка координатора над списком мер — видна сразу, без клика: заказчик
 * хотел, чтобы человек узнал о координаторе до того, как начнёт листать меры,
 * а не наткнулся на него случайно внутри карточки.
 *
 * Оформлена в духе плашки курса на главной (слоистая рамка с толщиной, лист
 * внутри, рукописная подпись), но со своим образом: не тетрадь и школьная
 * доска, а деловое письмо в конверте с косой каймой и круглой печатью.
 */
export function RepresentativeBanner({
  representatives,
  region,
}: {
  representatives: RegionalRepresentative[];
  region: string | null | undefined;
}) {
  const representative = findRepresentative(representatives, region);
  if (!representative) return null;

  return (
    <section
      className="mt-5 rounded-[28px] p-[9px]"
      style={{
        background: ENVELOPE_FRAME,
        // Толщину даёт слоистая тень: светлая грань сверху, тёмная снизу
        // (фаска бортика) и две внешние тени, отрывающие карточку от страницы.
        boxShadow: [
          "inset 0 1.5px 0 rgba(255,255,255,0.7)",
          "inset 0 -2px 3px -1px rgba(20,25,45,0.45)",
          "inset 0 0 0 1px rgba(20,25,45,0.28)",
          "0 1px 2px rgba(40,20,28,0.22)",
          "0 10px 18px -10px rgba(40,20,28,0.45)",
          "0 26px 40px -24px rgba(30,25,45,0.55)",
        ].join(", "),
      }}
    >
      <div
        className="relative overflow-hidden rounded-[20px] px-4 py-4"
        style={{
          color: INK,
          backgroundColor: PAPER,
          backgroundImage: HATCH,
          // Лист лежит в кайме чуть утопленно.
          boxShadow:
            "inset 0 3px 7px -3px rgba(40,30,40,0.38), inset 0 0 0 1px rgba(120,110,120,0.28)",
        }}
      >
        <div className="flex items-center gap-3.5">
          {/* Круглая печать: двойное кольцо и пунктир по краю, как оттиск. */}
          <span
            aria-hidden
            className="relative grid size-12 shrink-0 place-items-center rounded-full"
            style={{
              backgroundColor: NAVY,
              backgroundImage:
                "radial-gradient(120% 90% at 30% 10%, rgba(255,255,255,0.22) 0%, transparent 55%)",
              boxShadow: [
                "0 0 0 2.5px #FCF9F1",
                `0 0 0 4px ${NAVY}`,
                "inset 0 -3px 6px rgba(0,0,0,0.3)",
                "0 6px 12px -6px rgba(20,30,60,0.7)",
              ].join(", "),
            }}
          >
            <span
              className="absolute inset-[4px] rounded-full"
              style={{ border: "1.5px dashed rgba(252,249,241,0.55)" }}
            />
            <Landmark className="relative size-[22px] text-[#FCF9F1]" strokeWidth={1.7} />
          </span>

          <div className="min-w-0 flex-1">
            <h2
              className="text-[18px] font-bold leading-[1.22]"
              style={SERIF}
            >
              {representative.name}
            </h2>
            <span
              className="mt-1 block text-[16px] leading-none"
              style={{ fontFamily: "var(--font-caveat), cursive", color: BORDO }}
            >
              координатор в вашем регионе
            </span>
          </div>
        </div>

        {/* Волосяная линия делит лист на ярусы — как в плашке курса. */}
        <span className="mt-4 block h-px bg-[#E2D9C8]" />

        <div className="mt-3.5">
          <RepresentativeDetails representative={representative} />
        </div>

        <p className="mt-3.5 text-xs leading-snug text-[#5b5457]">
          Координатор может ответить на вопросы по региональным мерам и помочь с
          обращениями.
        </p>
      </div>
    </section>
  );
}
