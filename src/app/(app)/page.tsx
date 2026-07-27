import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { Portrait } from "@/components/home/portrait";
import { AuthorSignature } from "@/components/home/author-signature";
import { CatalogMeasures } from "@/components/home/catalog-measures";
import { Classification } from "@/components/home/classification";
import { Directions } from "@/components/home/directions";
import { PyramidSection } from "@/components/home/pyramid-section";

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
      {/* ГЕРОЙ: текст слева, портрет справа с наложением.

          Масштабирование. Каркас приложения ограничен 480px (см. app-shell),
          поэтому «эталонный» размер героя — при ширине контента 432px
          (480 − px-6 с двух сторон). Ниже этой ширины ВСЯ композиция
          (иконки, отступы, портрет, город) ужимается одним коэффициентом
          --s, обрезанным сверху эталоном.
          Считаем в cqw, а не в vw: на десктопе vw — ширина окна, а не каркаса,
          и портрет «распухал» отдельно от остальных элементов — из-за этого
          на телефоне схлопывалось только фото, а иконки лезли на город.

          --s — это «пиксель героя»: длина, равная 1px при ширине контента 432px
          и пропорционально меньшая на узких экранах. Длина, а не безразмерное
          число, потому что min(1, <длина>) — невалидный CSS: смешивать число и
          длину нельзя. Поэтому размеры пишем как calc(42 * var(--s)).

          --col — ширина правой колонки (портрет + подпись под ним). Одна
          колонка на оба элемента гарантирует, что их ширины совпадают. */}
      <section
        className="relative min-h-[436px] flex-1 overflow-hidden px-6 pt-5"
        style={
          {
            containerType: "inline-size",
            "--s": "min(1px, calc(100cqw / 432))",
            "--col": "calc(194 * var(--s))",
          } as React.CSSProperties
        }
      >
        {/* Карта России фоном и крупный заголовок сняты по просьбе заказчика
           (2026-07): первый экран должен начинаться с блока об авторе проекта,
           чтобы вместе с ним в него попадала плашка «Подбор мер поддержки».
           Для отката вернуть:
           <img src="/country-map.png" alt="" aria-hidden
                className="pointer-events-none absolute left-1/2 top-[6px] z-0 w-[98%] -translate-x-1/2 opacity-40"
                style={{ mixBlendMode: "multiply" }} />
           и видимый <h1> с подзаголовком (см. ниже). */}

        {/* Силуэт города снизу слева (как было изначально): правый край левее
           подписи, зазор 1ch — текст справа на него не наползает.
           city-trim.png — с обрезанными пустыми полями (было 1899×828 при
           контенте 1832×651), поэтому нижний край силуэта = нижний край
           картинки и ровно совпадает с низом подписи «автор проекта»
           (обе на bottom-4). Ширина в % — уменьшается вместе с экраном. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/city-trim.png?v=1"
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-[calc(46%_+_1ch_-_5px)] z-0 w-[85%] opacity-50"
          style={{ mixBlendMode: "multiply" }}
        />

        {/* Правая колонка: портрет и подпись под ним. Ширина задана один раз
           (--col), поэтому фото и текст всегда совпадают по левому и правому
           краю. Колонка прижата к низу героя — низ подписи задаёт уровень,
           по которому выравнивается силуэт города. */}
        <div className="absolute bottom-4 right-2 z-10 w-[var(--col)]">
          <Portrait className="block w-full" />
          <AuthorSignature className="relative z-20 mt-1" />
        </div>

        {/* Текстовый блок (поверх, слева) */}
        <div className="relative z-20">
          {/* Заголовок остаётся в разметке для поисковиков и скринридеров,
              визуально скрыт (см. комментарий об откате выше). */}
          <h1 className="sr-only">
            Индивидуальная семейная политика — помощь для каждой семьи. Единый
            навигатор мер поддержки для каждой семьи.
          </h1>

          {/* Красная декоративная линия */}
          <span
            className="block h-[3px] w-10 rounded-full"
            style={{ background: ACCENT }}
          />

          {/* Три преимущества. Иконки, отступы и кегль ужимаются вместе с
              экраном (--s), поэтому список не наползает на силуэт города.
              Шрифт не опускаем ниже 12px — читаемость важнее пропорции.
              Правый отступ = ширина колонки с портретом + зазор. */}
          <ul className="mt-[calc(24_*_var(--s))] flex flex-col gap-[calc(20_*_var(--s))] pr-[calc(var(--col)_-_4px)]">
            {FEATURES.map(({ img, lines }) => (
              <li
                key={lines[0]}
                className="flex items-center gap-[calc(14_*_var(--s))]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  aria-hidden
                  className="size-[calc(42_*_var(--s))] shrink-0 object-contain"
                />
                <span className="text-[max(12px,calc(14_*_var(--s)))] leading-snug text-[#1A1A1A]">
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

      {/* Каталог мер поддержки — сетка жизненных ситуаций (по утв. макету) */}
      <CatalogMeasures />

      {/* Классификация мер поддержки (референс + иллюстрации family.png/way.png) */}
      <Classification />

      {/* Направления мер поддержки (сетка тем + domik/city2) */}
      <Directions />

      {/* Пирамида мер поддержки (4 трапеции-уровня) */}
      <PyramidSection />

      {/* Силуэт города в самом низу — основание на 2px выше нижнего меню */}
      <div className="mt-4 px-5 pb-[2px]">
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
