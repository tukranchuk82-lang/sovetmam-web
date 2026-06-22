import Link from "next/link";
import { Portrait } from "@/components/home/portrait";
import { AuthorSignature } from "@/components/home/author-signature";
import { CatalogMeasures } from "@/components/home/catalog-measures";
import { Classification } from "@/components/home/classification";
import { Directions } from "@/components/home/directions";
import { PyramidSection } from "@/components/home/pyramid-section";

// Акцентный цвет экрана по референсу (красные декоративные черты).
const ACCENT = "#B51234";


const FEATURES = [
  { img: "/bird2-cut.png?v=2", lines: ["Проверенные и актуальные", "меры поддержки"] },
  { img: "/kid-cut.png?v=2", lines: ["Подбор мер под вашу", "жизненную ситуацию"] },
  { img: "/head-cut.png?v=2", lines: ["Забота, уважение", "и реальная помощь"] },
];

export default function Home() {
  return (
    <div
      className="flex min-h-full flex-col bg-[#F8F7F6]"
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      {/* ГЕРОЙ: текст слева, портрет справа с наложением */}
      <section className="relative min-h-[720px] flex-1 overflow-hidden px-6 pt-7">
        {/* Светло-серый круг за портретом (сдвинут вправо и опущен ниже) */}
        <div className="absolute right-[-62px] top-[202px] z-0 size-[300px] rounded-full bg-[#EAE6E6] blur-[6px]" />

        {/* Силуэт города (еле заметный, снизу слева; меньше — чтобы текст
           преимуществ его не перекрывал) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* Силуэт города привязан правым краем ЛЕВЕЕ левого края правого текста
           (подпись начинается на 54%) с зазором 1ch — поэтому на любой ширине
           экрана город «уезжает» левее ровно настолько, чтобы текст справа
           никогда на него не наползал, сохраняя одинаковый небольшой зазор. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/city.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-[14px] right-[calc(46%_+_1ch)] z-0 w-[73%] opacity-50"
          style={{ mixBlendMode: "multiply" }}
        />

        {/* Портрет — крупный, справа; плечо уходит за правый край, верх головы
           на уровне красной черты */}
        <Portrait className="absolute right-[-44px] top-[230px] z-10 w-[62%] max-w-[300px] object-contain" />

        {/* Подпись автора прямо у портрета (без карточки) */}
        <AuthorSignature className="absolute left-[54%] right-2 bottom-[16px] z-20" />

        {/* Текстовый блок (поверх, слева) */}
        <div className="relative z-20">
          <h1
            className="text-[32px] font-normal leading-[1.12] text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Поддержка
            <br />
            семей с детьми —
            <br />
            наш приоритет
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-[#4D4D4D]">
            Единый навигатор мер поддержки
            <br />
            для каждой семьи.
          </p>

          {/* Красная декоративная линия */}
          <span
            className="mt-5 block h-[3px] w-10 rounded-full"
            style={{ background: ACCENT }}
          />

          {/* Три преимущества (текст держим слева от портрета) */}
          <ul className="mt-6 flex flex-col gap-5 pr-[42%]">
            {FEATURES.map(({ img, lines }) => (
              <li key={lines[0]} className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  aria-hidden
                  className="size-[42px] shrink-0 object-contain"
                />
                <span className="text-[14px] leading-snug text-[#1A1A1A]">
                  {lines[0]}
                  <br />
                  {lines[1]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <Link
        href="/podbor"
        className="mx-5 mb-4 mt-3 flex items-center justify-center rounded-xl py-4 text-base font-semibold text-white"
        style={{
          background: "linear-gradient(to bottom, #B51234, #8E1D2C)",
          boxShadow: "0 12px 24px -14px rgba(142,29,44,0.6)",
        }}
      >
        Начать поиск мер поддержки
      </Link>

      {/* Каталог мер поддержки — сетка жизненных ситуаций (по утв. макету) */}
      <CatalogMeasures />

      {/* Классификация мер поддержки (референс + иллюстрации family.png/way.png) */}
      <Classification />

      {/* Направления мер поддержки (сетка тем + domik/city2) */}
      <Directions />

      {/* Пирамида мер поддержки (4 трапеции-уровня) */}
      <PyramidSection />

      {/* Силуэт города в самом низу — основание на 2px выше нижнего меню */}
      <div className="px-5 pb-[2px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/city2-cut.png"
          alt=""
          aria-hidden
          className="w-full object-contain"
        />
      </div>
    </div>
  );
}
