import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { Portrait } from "@/components/home/portrait";
import { AuthorSignature } from "@/components/home/author-signature";
import { CourseBanner } from "@/components/home/course-banner";
import { CatalogMeasures } from "@/components/home/catalog-measures";
import { Classification } from "@/components/home/classification";
import { Directions } from "@/components/home/directions";
import { PyramidSection } from "@/components/home/pyramid-section";
import { ShareSection } from "@/components/home/share-section";
import { JsonLd } from "@/components/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

// Паспорт сайта и организации для поисковика. Отсюда берутся название
// организации в выдаче и строка поиска по каталогу прямо в результатах Google.
const SITE_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl()}/#organization`,
      name: "Совет матерей",
      alternateName: "Общероссийская общественная организация «Совет матерей»",
      url: siteUrl(),
      logo: `${siteUrl()}/icon-512.png`,
      description:
        "Общероссийская общественная организация, помогает семьям с детьми и будущим родителям разобраться в мерах государственной поддержки.",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl()}/#website`,
      name: SITE_NAME,
      url: siteUrl(),
      description: SITE_DESCRIPTION,
      inLanguage: "ru-RU",
      publisher: { "@id": `${siteUrl()}/#organization` },
    },
  ],
};

export default function Home() {
  return (
    <div
      className="flex min-h-full flex-col bg-[#F8F7F6]"
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <JsonLd data={SITE_SCHEMA} />
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

          --col — ширина правой колонки с портретом. От неё же считается
          правый отступ текстового блока слева, чтобы он не лез на фото. */}
      <section
        className="relative min-h-[352px] flex-1 overflow-hidden px-6 pt-5"
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

        {/* Силуэт города в герое снят по просьбе заказчика (2026-08): после
           переезда подписи влево картинка оказалась прямо под текстом и
           «поехала». Для отката вернуть:
           <img src="/city-trim.png?v=1" alt="" aria-hidden
                className="pointer-events-none absolute bottom-4 right-[calc(46%_+_1ch_-_5px)] z-0 w-[85%] opacity-50"
                style={{ mixBlendMode: "multiply" }} />
           Внизу страницы свой силуэт города — он остаётся. */}

        {/* Правая колонка: портрет. Ширина задана один раз (--col) — от неё
           отбивается текст слева. Колонка прижата к низу героя. */}
        <div className="absolute bottom-4 right-2 z-10 w-[var(--col)]">
          <Portrait className="block w-full" />
        </div>

        {/* Текстовый блок слева: подпись автора. Прежде здесь были красная
           черта и список из трёх преимуществ с иконками — сняты по просьбе
           заказчика (2026-08), а подпись переехала сюда из-под портрета.
           Правый край блока отбит на ширину колонки с фото, поэтому текст не
           наползает на портрет; по вертикали блок центрован относительно
           героя, чтобы совпадать с лицом на фото. */}
        <div className="absolute inset-y-0 left-6 right-[calc(var(--col)_+_16px)] z-20 flex flex-col justify-center">
          {/* Заголовок остаётся в разметке для поисковиков и скринридеров,
              визуально скрыт (см. комментарий об откате выше). */}
          <h1 className="sr-only">
            Индивидуальная семейная политика — помощь для каждой семьи. Единый
            навигатор мер поддержки для каждой семьи.
          </h1>

          <AuthorSignature />
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

      {/* Плашка авторского курса: уводит в отдельное приложение курса.
          Стоит сразу за подбором — это второе, ради чего человек может сюда
          прийти, и обе плашки видны на первом экране. */}
      <CourseBanner />

      {/* Каталог мер поддержки — сетка жизненных ситуаций (по утв. макету) */}
      <CatalogMeasures />

      {/* Классификация мер поддержки (референс + иллюстрации family.png/way.png) */}
      <Classification />

      {/* Направления мер поддержки (сетка тем + domik/city2) */}
      <Directions />

      {/* Пирамида мер поддержки (4 трапеции-уровня) */}
      <PyramidSection />

      {/* Приглашение поделиться приложением */}
      <ShareSection />

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
