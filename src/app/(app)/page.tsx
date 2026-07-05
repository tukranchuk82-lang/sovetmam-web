import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { Portrait } from "@/components/home/portrait";
import { AuthorSignature } from "@/components/home/author-signature";
import { CatalogMeasures } from "@/components/home/catalog-measures";
import { Classification } from "@/components/home/classification";
import { Directions } from "@/components/home/directions";
import { PyramidSection } from "@/components/home/pyramid-section";
import { InstallAppButton } from "@/components/install-app-button";

// Акцентный цвет декоративных черт — бренд-бордовый.
const ACCENT = "#8E1D2C";


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
        {/* ЭКСПЕРИМЕНТ: карта России как фон за заголовком, по центру сверху.
           Для отката вернуть серый круг:
           <div className="absolute right-[-62px] top-[202px] z-0 size-[300px] rounded-full bg-[#EAE6E6] blur-[6px]" /> */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/country-cut.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[6px] z-0 w-[98%] -translate-x-1/2 opacity-40"
          style={{ mixBlendMode: "multiply" }}
        />

        {/* Силуэт города снизу слева (как было изначально): правый край левее
           подписи, зазор 1ch — текст справа на него не наползает. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/city.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-[9px] right-[calc(46%_+_1ch_-_5px)] z-0 w-[88%] opacity-50"
          style={{ mixBlendMode: "multiply" }}
        />

        {/* Светлая вуаль между картой и текстом — мягко высветляет карту под
           заголовком для читаемости, к краям сходит на нет. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[300px]"
          style={{
            background:
              "radial-gradient(115% 75% at 32% 26%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.45) 42%, rgba(255,255,255,0) 72%)",
          }}
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
            style={{
              fontFamily: "var(--font-playfair), serif",
              textShadow:
                "0 1px 2px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.85)",
            }}
          >
            Поддержка
            <br />
            семей с детьми —
            <br />
            наш приоритет
          </h1>

          <p
            className="mt-4 text-[15px] leading-relaxed text-[#4D4D4D]"
            style={{ textShadow: "0 1px 2px rgba(255,255,255,0.9)" }}
          >
            Единый навигатор мер поддержки
            <br />
            для каждой семьи.
          </p>

          {/* Красная декоративная линия */}
          <span
            className="mt-[65px] block h-[3px] w-10 rounded-full"
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

      {/* CTA — премиум-плашка «Подбор мер поддержки»: ровный бордовый градиент,
          объём даёт слоистая тень (светлая грань сверху, мягкая тень снизу). */}
      <Link
        href="/podbor"
        className="group relative mx-5 mb-4 mt-3 flex items-center gap-4 overflow-hidden rounded-3xl p-5 text-white ring-1 ring-white/10 transition-transform active:scale-[0.99]"
        style={{
          background:
            "linear-gradient(135deg, #B02539 0%, #8E1D2C 52%, #6E0F1C 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -24px 48px -24px rgba(0,0,0,0.4), 0 22px 42px -14px rgba(116,17,31,0.6)",
        }}
      >
        {/* frosted-glass бейдж иконки */}
        <span
          className="relative grid size-14 shrink-0 place-items-center rounded-2xl ring-1 ring-white/30"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.10) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -6px 12px -6px rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Sparkles className="size-7 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" strokeWidth={1.6} />
        </span>

        <span className="relative min-w-0 flex-1">
          <span className="block text-lg font-semibold leading-tight tracking-[-0.01em]">
            Подбор мер поддержки
          </span>
          <span className="mt-1.5 block text-[13px] leading-snug text-white/75">
            Заполните короткую анкету — и мы поможем выбрать меры поддержки,
            которые подходят именно под вашу жизненную ситуацию.
          </span>
        </span>

        {/* стрелка в аккуратном кружке */}
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.12] ring-1 ring-white/25 transition-transform group-active:translate-x-0.5">
          <ChevronRight className="size-5" />
        </span>
      </Link>

      {/* Установка приложения на устройство. На Chrome/Edge/Android — родное
          окно установки по клику; на iPhone — короткая подсказка. Если уже
          установлено, компонент ничего не рендерит. */}
      <div className="mx-5 -mt-1 mb-2">
        <InstallAppButton />
      </div>

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
