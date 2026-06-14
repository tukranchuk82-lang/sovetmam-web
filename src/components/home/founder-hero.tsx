import Image from "next/image";

/**
 * Первый экран: обращение от лица Татьяны Викторовны Бутской.
 * Стиль — как в референсе «Шпаргалка для родителей»: круглое фото,
 * крупный сериф-заголовок, красная черта-акцент, текст и подпись.
 * Фото лежит в public/founder/butskaya.png.
 */
export function FounderHero() {
  return (
    <section className="sm-card rounded-2xl bg-card p-6 text-center ring-1 ring-border shadow-[0_10px_30px_-18px_rgba(27,58,107,0.4)]">
      {/* Фото в двух фигурах (как в референсе): круг с градиентом-подложкой
          + смещённое тонкое кольцо вокруг. Фигура — cutout с воздухом над
          головой (object-contain, прижата к низу). */}
      <div className="relative mx-auto mb-5 h-44 w-44">
        <span
          aria-hidden
          className="absolute bottom-0 left-0 size-40 rounded-full border-2 border-brand/20"
        />
        <div className="absolute right-0 top-0 size-40 overflow-hidden rounded-full bg-gradient-to-b from-slate-100 to-brand-soft shadow-[0_10px_24px_-12px_rgba(27,58,107,0.55)] ring-1 ring-black/5">
          <Image
            src="/founder/butskaya.png"
            alt="Татьяна Викторовна Бутская"
            width={430}
            height={550}
            priority
            className="absolute bottom-0 left-1/2 h-[96%] w-auto max-w-none -translate-x-1/2"
          />
        </div>
      </div>

      <h1 className="sm-h2 font-serif text-2xl font-bold leading-tight text-brand">
        Возьми своё от государства
      </h1>
      <span className="mx-auto mt-3 block h-1 w-14 rounded-full bg-accent-red" />

      <div className="mt-4 space-y-3 text-left">
        <p className="text-sm leading-relaxed text-foreground/80">
          Здесь собраны все меры поддержки для вашей семьи. Посмотрите, какими
          они бывают, кем обеспечиваются и на каких условиях предоставляются.
        </p>
        <p className="text-sm leading-relaxed text-foreground/80">
          Вы можете самостоятельно пользоваться каталогом мер поддержки, а
          можете заполнить анкету, указать свои условия — и наша система сама
          подберёт все подходящие меры для вашей семьи.
        </p>
      </div>

      <p className="mt-4 border-t border-border pt-4 text-sm font-semibold text-brand">
        — Татьяна Викторовна Бутская
      </p>
      <p className="text-xs text-muted-foreground">
        Председатель общероссийской общественной организации «Совет матерей»
      </p>
    </section>
  );
}
