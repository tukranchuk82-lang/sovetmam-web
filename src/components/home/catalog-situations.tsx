import Link from "next/link";
import { CATALOG_SITUATIONS } from "@/lib/home-taxonomy";
import { CATALOG_SITUATION_EMOJI } from "./icons";
import { SectionHeading } from "./section-heading";

/**
 * «Каталог ситуаций» — жизненные ситуации семьи карточками с мультяшными
 * эмодзи. При наведении карточка приподнимается и увеличивается, эмодзи весело
 * подпрыгивает. Последняя — «Своя жизненная ситуация» — выделенный баннер
 * с иконкой, декоративным акцентом и свечением.
 */
export function CatalogSituations() {
  const regular = CATALOG_SITUATIONS.filter((s) => !s.special);
  const special = CATALOG_SITUATIONS.find((s) => s.special);

  return (
    <section>
      <SectionHeading subtitle="Выберите жизненную ситуацию вашей семьи — и получите персональный список мер поддержки">
        Каталог ситуаций
      </SectionHeading>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {regular.map((s, i) => (
          <Link
            key={s.id}
            href={s.href}
            data-i={i}
            className="sm-card sm-cat group flex flex-col items-center justify-center gap-1.5 rounded-xl bg-card px-3 py-4 text-center ring-1 ring-border shadow-[0_4px_14px_-10px_rgba(27,58,107,0.5)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_16px_28px_-12px_rgba(27,58,107,0.65)] hover:ring-2 hover:ring-brand"
          >
            <span className="text-3xl transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-125">
              {CATALOG_SITUATION_EMOJI[s.id]}
            </span>
            <span className="text-sm font-bold leading-tight text-foreground">
              {s.title}
            </span>
            <span className="mt-1 block h-0.5 w-8 rounded-full bg-accent-red" />
          </Link>
        ))}

        {special && (
          <Link
            href={special.href}
            className="sm-cta group relative col-span-2 flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-[#27508c] px-5 py-6 text-left text-brand-foreground shadow-[0_18px_38px_-14px_rgba(27,58,107,0.85)] ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            {/* Декоративный крупный полупрозрачный значок-акцент */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-5 rotate-12 text-7xl opacity-20 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
            >
              {CATALOG_SITUATION_EMOJI[special.id]}
            </span>
            {/* Иконка в кружке */}
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl ring-1 ring-white/25">
              {CATALOG_SITUATION_EMOJI[special.id]}
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-base font-extrabold leading-tight">
                {special.title}
              </span>
              <span className="mt-1 block text-xs text-white/80">
                Подберём по анкете или примем обращение
              </span>
            </span>
            <span
              aria-hidden
              className="relative text-2xl opacity-80 transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
