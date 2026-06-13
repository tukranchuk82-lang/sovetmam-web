import Image from "next/image";

/**
 * Первый экран: фото Татьяны Викторовны Бутской и обращение от её лица.
 * Фото лежит в public/founder/butskaya.png.
 */
export function FounderHero() {
  return (
    <section className="overflow-hidden rounded-3xl bg-brand-soft ring-1 ring-brand/10">
      <div className="flex items-stretch gap-3 p-4">
        <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <Image
            src="/founder/butskaya.png"
            alt="Татьяна Викторовна Бутская"
            fill
            sizes="96px"
            priority
            className="object-cover object-top"
          />
        </div>
        <div className="min-w-0 flex-1 self-center">
          <p className="text-base font-extrabold leading-tight text-foreground">
            Привет! Я Татьяна Бутская
          </p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Председатель общероссийской общественной организации «Совет
            матерей»
          </p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className="text-sm leading-relaxed text-foreground/80">
          Здесь собраны все меры поддержки для вашей семьи. Посмотрите, какими
          они бывают, кем обеспечиваются и на каких условиях предоставляются.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          Вы можете самостоятельно пользоваться каталогом мер поддержки, а
          можете заполнить анкету, указать свои условия — и наша система сама
          подберёт все подходящие меры для вашей семьи.
        </p>
      </div>
    </section>
  );
}
