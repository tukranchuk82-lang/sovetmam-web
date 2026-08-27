import { GraduationCap, ArrowRight } from "lucide-react";
import { courseLink } from "@/lib/course";

/**
 * Плашка авторского курса на главной.
 *
 * Уводит в отдельное приложение курса (kurs.sovetmam.ru), поэтому ссылка идёт
 * через /go/kurs: там переход отмечается в нашей же базе и виден в админке —
 * «Откуда приходят» → «Уходят к нам же».
 *
 * Оформление взято из самого курса, чтобы человек узнал его ещё до перехода:
 * тетрадная бумага в клетку, поле с красной линией слева, зелёная школьная
 * доска в деревянной раме и меловые надписи. Те же приёмы и те же цвета, что
 * в приложении курса (см. globals.css курса: .shell, .lesson, .chalkboard).
 *
 * На кремовом фоне главной бумажная плашка не спорит ни с бордовым подбором
 * над ней, ни с синими шапкой и меню: она светлая, а цветное в ней — только
 * зелёная доска и красная линия поля.
 *
 * Собрана из двух слоёв: снаружи серая стеклянная оправа, внутри — лист,
 * чуть утопленный в неё. Так получается настоящая толщина: у обычной рамки
 * её нет, какой бы толстой её ни сделать.
 */

// Цвета курса.
const PAPER = "#FCF9F1";
const GRID = "rgba(27, 58, 107, 0.07)";
const LINE = "#E2D9C8";
const BOARD = "#2F5347";
const WOOD = "#8A6A41";
const INK = "#23191A";
const BORDO = "#8E1D2C";

// Стеклянная серая рамка: снизу серебро потемнее, сверху светлее, поверх —
// косой блик. Настоящей толщины у CSS-рамки нет, поэтому рамка сделана
// отдельным слоем с отступом: лист лежит в ней, как в оправе.
const GLASS_FRAME = [
  "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.25) 38%, rgba(255,255,255,0.85) 56%, rgba(255,255,255,0.10) 100%)",
  "linear-gradient(180deg, #F6F6F8 0%, #D9D9DF 52%, #B2B2BC 100%)",
].join(", ");

// Зелень доски с меловой пылью — как .chalkboard в курсе.
const CHALKBOARD = [
  "radial-gradient(120% 80% at 12% 0%, rgba(255,255,255,0.08) 0%, transparent 55%)",
  "radial-gradient(90% 70% at 85% 100%, rgba(255,255,255,0.05) 0%, transparent 60%)",
  "repeating-linear-gradient(115deg, rgba(255,255,255,0.022) 0 2px, transparent 2px 7px)",
].join(", ");

const ITEMS = [
  "20 академических часов занятий",
  "Четыре чек-листа с подбором мер поддержки",
  "Одна контрольная домашняя работа",
  "Итоговый зачёт по видеосвязи, индивидуально",
  "Сертификат о прохождении авторского курса",
];

/**
 * Галочка перед пунктом. Не эмодзи — они в каждом телефоне свои и выбиваются
 * из вида приложения. Нарисована от руки: линия идёт с небольшим изгибом и
 * закруглёнными концами, как будто поставлена ручкой в тетради.
 */
function HandCheck({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className} style={style}>
      <path
        d="M3.2 10.6c1.7 1 3 2.3 4 4 1.9-4.8 4.8-8.4 9.4-11"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CourseBanner({ fromPath = "/" }: { fromPath?: string }) {
  return (
    <a
      href={courseLink(fromPath)}
      className="group relative mx-5 mb-4 block rounded-[28px] p-[9px] transition-transform active:scale-[0.99]"
      style={{
        background: GLASS_FRAME,
        // Толщину даёт слоистая тень: светлая грань сверху и тёмная снизу —
        // это фаска стекла; две внешние тени отрывают плашку от страницы.
        boxShadow: [
          "inset 0 1.5px 0 rgba(255,255,255,0.95)",
          "inset 0 -2px 3px -1px rgba(90,95,110,0.38)",
          "inset 0 0 0 1px rgba(110,112,126,0.45)",
          "0 1px 2px rgba(40,44,55,0.18)",
          "0 10px 18px -10px rgba(40,44,55,0.45)",
          "0 26px 40px -24px rgba(30,35,45,0.55)",
        ].join(", "),
      }}
    >
      <div
        className="relative overflow-hidden rounded-[20px] py-5 pl-11 pr-5"
        style={{
          color: INK,
          backgroundColor: PAPER,
          // Клетка — как лист тетради в курсе: шаг 22px, светло-синие линии.
          backgroundImage: `linear-gradient(${GRID} 1px, transparent 1px), linear-gradient(90deg, ${GRID} 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
          // Лист лежит в оправе чуть утопленно.
          boxShadow:
            "inset 0 3px 7px -3px rgba(40,44,55,0.40), inset 0 0 0 1px rgba(120,124,140,0.30)",
        }}
      >
        {/* Поле с красной линией — тот же приём, что у карточек занятий. */}
        <span
          aria-hidden
          className="absolute bottom-4 left-[30px] top-4 w-px"
          style={{ background: "rgba(142, 29, 44, 0.35)" }}
        />

        <div className="flex items-center gap-3.5">
          {/* Школьная доска в деревянной раме — вместо бейджа матового стекла. */}
          <span
            className="relative grid size-12 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: BOARD,
              backgroundImage: CHALKBOARD,
              border: `2.5px solid ${WOOD}`,
              boxShadow:
                "inset 0 0 14px rgba(0,0,0,0.30), 0 5px 12px -8px rgba(30,45,38,0.8)",
            }}
          >
            <GraduationCap className="size-6 text-[#F2EFE4]" strokeWidth={1.7} />
          </span>

          <span className="min-w-0 flex-1">
            <h2
              className="text-[17px] font-bold leading-[1.25]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              «Шпаргалка для родителей: все меры поддержки для вашей семьи»
            </h2>
            <span
              className="mt-1 block text-[15px] leading-none"
              style={{ fontFamily: "var(--font-caveat), cursive", color: BORDO }}
            >
              авторский курс
            </span>
          </span>
        </div>

        {/* Волосяная линия в цвет тетрадных полей делит листок на ярусы. */}
        <span className="mt-4 block h-px" style={{ background: LINE }} />

        <ul className="mt-3.5 space-y-2">
          {ITEMS.map((text) => (
            <li key={text} className="flex items-start gap-2.5">
              <HandCheck
                className="mt-[3px] size-[15px] shrink-0"
                style={{ color: BOARD }}
              />
              <span className="text-[13px] leading-snug" style={{ color: "#3A2E2F" }}>
                {text}
              </span>
            </li>
          ))}
        </ul>

        <span
          className="mt-5 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold text-[#F4F1E6] transition-transform group-active:scale-[0.98]"
          style={{
            backgroundColor: BOARD,
            backgroundImage: CHALKBOARD,
            border: `2.5px solid ${WOOD}`,
            boxShadow:
              "inset 0 0 18px rgba(0,0,0,0.28), 0 6px 14px -10px rgba(30,45,38,0.75)",
          }}
        >
          Пройти курс
          <ArrowRight className="size-4" />
        </span>
      </div>
    </a>
  );
}
