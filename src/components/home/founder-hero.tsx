import Image from "next/image";
import { OrgName } from "@/components/org-name";
import { FamilyDoodle } from "@/components/family-doodle";

/**
 * Первый экран: обращение от лица Татьяны Викторовны Бутской.
 *
 * Дизайн по референсу, одобренному заказчиком («Шпаргалка для родителей»):
 *  - зелёный бейдж «Совет матерей рекомендует»;
 *  - крупный округлый заголовок с красным акцентным словом;
 *  - фото в «многослойной рамке» — две мягкие скруглённые подложки
 *    (жёлтая + кремовая) выглядывают из-за фото со сдвигом и лёгким поворотом;
 *  - плавающий бейдж «С заботой!» у фото;
 *  - цитата в светлой плашке с иконкой-чатом.
 *
 * Цвета берутся из токенов темы (brand / accent-red / brand-soft), поэтому блок
 * выглядит «как в референсе» в яркой теме (kids) и аккуратно — в остальных.
 * Шрифт заголовка — через font-serif (= --app-font-head): в яркой/тёплой теме
 * это округлый Nunito, который и понравился заказчику.
 *
 * Фото лежит в public/founder/butskaya.png (cutout на прозрачном фоне).
 */
export function FounderHero() {
  return (
    <section className="sm-card sm-hero relative overflow-hidden rounded-3xl bg-card p-5 ring-1 ring-border shadow-[0_14px_36px_-20px_rgba(27,58,107,0.45)]">
      {/* Бейдж-рекомендация */}
      <span className="sm-hero-badge inline-flex items-center gap-1 rounded-full bg-[#4a9590] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-[0_3px_8px_-5px_rgba(74,149,144,0.8)]">
        {/* Галочка «от руки»: рукописный кистевой мазок, тёмно-зелёный (#2d6a2f)
            на светло-зелёной плашке + светлая тень для отрыва от фона. */}
        <svg
          viewBox="0 0 48 44"
          className="size-4 shrink-0 -rotate-[8deg] drop-shadow-[1px_1.5px_0.5px_rgba(255,255,255,0.6)]"
          aria-hidden
        >
          <path
            d="M5 21 Q4 18 8 19 Q13 24 17 30 Q18 31 19 31 Q26 20 35 11 Q40 6 46 3 Q49 2 47 6 Q47 9 43 12 Q35 19 28 28 Q24 33 21 39 Q19 42 16 40 Q11 34 6 24 Q5 22 5 21 Z"
            fill="#2d6a2f"
          />
        </svg>
        <OrgName /> рекомендует
      </span>

      {/* Заголовок: округлый, жирный, с красным акцентным словом */}
      <h1 className="sm-h2 mt-4 font-serif text-[28px] font-extrabold leading-[1.12] text-foreground">
        Всё, что положено{" "}
        <span className="text-accent-red">вашей семье</span>{" "}
        <FamilyDoodle className="sm-hero-emoji ml-1 inline-block h-[1.3em] w-auto align-middle" />
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-foreground/70">
        От государства, работодателя и вуза. Узнайте обо всех мерах поддержки
        в несколько кликов!
      </p>

      {/* Фото в многослойной рамке */}
      <div className="relative mx-auto mt-7 aspect-[4/5] w-[15rem] max-w-[80%]">
        {/* Подложка 1 — жёлтая, выглядывает справа-сверху */}
        <span
          aria-hidden
          className="sm-hero-frame absolute inset-0 rotate-3 rounded-[2rem] bg-amber-300"
        />
        {/* Подложка 2 — кремовая, выглядывает слева-снизу */}
        <span
          aria-hidden
          className="sm-hero-frame absolute inset-0 -rotate-2 rounded-[2rem] bg-amber-100"
        />
        {/* Карточка с фото */}
        <div className="sm-hero-photo absolute inset-0 overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-50 to-brand-soft ring-1 ring-black/5 shadow-[0_16px_30px_-16px_rgba(27,58,107,0.5)]">
          <Image
            src="/founder/butskaya.png"
            alt="Татьяна Викторовна Бутская"
            width={430}
            height={550}
            priority
            className="absolute bottom-0 left-1/2 h-[98%] w-auto max-w-none -translate-x-1/2"
          />
        </div>
        {/* Плавающий бейдж «С заботой!» */}
        <span className="absolute -bottom-3 right-2 inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-accent-red shadow-[0_8px_18px_-8px_rgba(27,58,107,0.5)] ring-1 ring-border">
          ❤️ С заботой!
        </span>
      </div>

      {/* Цитата в светлой плашке с иконкой-чатом */}
      <figure className="relative mt-9 rounded-2xl bg-brand-soft/60 p-4 pt-5">
        <span
          aria-hidden
          className="absolute -top-3 left-4 grid size-7 place-items-center rounded-full bg-card text-sm shadow-[0_6px_14px_-6px_rgba(27,58,107,0.5)] ring-1 ring-border"
        >
          💬
        </span>
        <blockquote className="text-sm italic leading-relaxed text-foreground/80">
          «Дорогие родители! Мы собрали для вас полную базу помощи, чтобы вы
          могли легко найти именно то, что нужно вашей семье прямо сейчас.»
        </blockquote>
        <figcaption className="mt-3 text-sm font-bold text-brand not-italic">
          — Татьяна Викторовна Бутская
        </figcaption>
        <p className="text-xs text-muted-foreground">
          Председатель общероссийской общественной организации <OrgName />
        </p>
      </figure>
    </section>
  );
}
