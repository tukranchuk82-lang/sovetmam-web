import Link from "next/link";
import { Gift, BadgePercent, RussianRuble, type LucideIcon } from "lucide-react";

// Экран «Классификация мер поддержки» — по референсу заказчика.
// Готовые иллюстрации берём из public: family.png (семья сверху) и way.png
// (целиком блок «По частоте получения» — путь с пинами и подписями).
// Дорисованная часть — заголовок и блок «По типу помощи» (3 карточки).
//
// И карточки, и пины на картинке ведут в /class/[key] — список мер по этому
// признаку (метки class-* в segments). Раньше карточки открывали попап с
// предложением пройти анкету; теперь они делают то, что обещают, — показывают
// меры, а призыв к анкете стоит на самой странице списка.

const T1 = "#15234A"; // тёмно-синий текст

interface TypeItem {
  icon: LucideIcon;
  label: string;
  key: string;
}

const TYPE_ITEMS: TypeItem[] = [
  { icon: Gift, label: "Бесплатно", key: "free" },
  { icon: BadgePercent, label: "Со скидкой", key: "discount" },
  { icon: RussianRuble, label: "Выплаты", key: "money" },
];

// Кликабельные области поверх way.png. Картинка — растр 1153×1345, четыре
// пункта нарисованы внутри неё, DOM-элементов у них нет. Чтобы не переверстывать
// утверждённую заказчиком иллюстрацию, накрываем каждый пункт (пин + подпись)
// прозрачной ссылкой. Координаты в % от размеров картинки — тянутся вместе с ней.
const WAY_HOTSPOTS: {
  key: string;
  label: string;
  left: string;
  top: string;
  width: string;
  height: string;
}[] = [
  { key: "once-life", label: "1 раз в жизни", left: "14%", top: "5%", width: "48%", height: "18%" },
  { key: "once-year", label: "1 раз в год", left: "46%", top: "25%", width: "37%", height: "16%" },
  { key: "once-month", label: "1 раз в месяц", left: "18%", top: "49%", width: "42%", height: "16%" },
  { key: "situational", label: "По ситуации", left: "51%", top: "66%", width: "43%", height: "27%" },
];

export function Classification() {
  return (
    <section
      className="px-5 pb-10 pt-6"
      style={{ fontFamily: "var(--font-inter), sans-serif", color: T1 }}
    >
      {/* Заголовок */}
      <h2
        className="text-center text-[28px] font-normal leading-[1.12]"
        style={{ fontFamily: "var(--font-playfair), serif", color: T1 }}
      >
        Классификация мер поддержки
      </h2>

      {/* Иллюстрация семьи */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/family.png"
        alt="Семья с ребёнком"
        className="mx-auto mt-4 w-full max-w-[420px] mix-blend-multiply"
      />

      {/* ---------- По типу помощи ---------- */}
      <h3
        className="mt-6 text-[20px] font-semibold"
        style={{ fontFamily: "var(--font-playfair), serif", color: T1 }}
      >
        По типу помощи
      </h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {TYPE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={`/class/${item.key}`}
              className="flex flex-col items-center rounded-2xl border border-black/[0.06] px-2 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_-12px_rgba(30,41,59,0.28)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_30px_-12px_rgba(30,41,59,0.34)] active:scale-95"
              style={{
                background:
                  "linear-gradient(160deg, #EDEFF2 0%, #D7DCE2 54%, #C3C9D1 100%)",
              }}
            >
              <span
                className="flex size-14 items-center justify-center rounded-full ring-1 ring-white/40 shadow-[0_6px_14px_-6px_rgba(116,17,31,0.55)]"
                style={{
                  background:
                    "linear-gradient(150deg, #A32334 0%, #8E1D2C 58%, #74111F 100%)",
                }}
              >
                <Icon size={26} strokeWidth={1.7} color="#FFFFFF" aria-hidden />
              </span>
              <span
                className="mt-2.5 text-center text-[13px] font-semibold leading-tight"
                style={{ color: T1 }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ---------- По частоте получения ---------- */}
      <h3
        className="mt-8 text-[20px] font-semibold"
        style={{ fontFamily: "var(--font-playfair), serif", color: T1 }}
      >
        По частоте получения
      </h3>
      <div className="relative mx-auto mt-3 w-full max-w-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/way.png"
          alt="Путь: классификация мер по частоте получения — 1 раз в жизни, 1 раз в год, 1 раз в месяц, по ситуации"
          className="w-full mix-blend-multiply"
        />
        {WAY_HOTSPOTS.map((h) => (
          <Link
            key={h.key}
            href={`/class/${h.key}`}
            aria-label={`Меры поддержки: ${h.label}`}
            title={h.label}
            className="absolute rounded-2xl transition-colors duration-150 hover:bg-[#8E1D2C]/[0.07] focus-visible:bg-[#8E1D2C]/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E1D2C]/40 active:bg-[#8E1D2C]/[0.12]"
            style={{ left: h.left, top: h.top, width: h.width, height: h.height }}
          />
        ))}
      </div>
    </section>
  );
}
