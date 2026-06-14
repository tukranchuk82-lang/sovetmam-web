import Image from "next/image";

/**
 * Первый экран: обращение от лица Татьяны Викторовны Бутской.
 * Стиль — как в референсе «Шпаргалка для родителей»: круглое фото,
 * крупный сериф-заголовок, красная черта-акцент, текст и подпись.
 * Фото лежит в public/founder/butskaya.png.
 */
export function FounderHero() {
  return (
    <section className="rounded-2xl bg-card p-6 text-center ring-1 ring-border shadow-[0_10px_30px_-18px_rgba(27,58,107,0.4)]">
      <div className="mx-auto mb-5 size-32 overflow-hidden rounded-full bg-white shadow-md ring-4 ring-brand-soft">
        <Image
          src="/founder/butskaya.png"
          alt="Татьяна Викторовна Бутская"
          width={256}
          height={256}
          priority
          className="size-full object-cover object-top"
        />
      </div>

      <h1 className="font-serif text-2xl font-bold leading-tight text-brand">
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
