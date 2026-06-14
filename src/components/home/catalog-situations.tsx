import Link from "next/link";
import { CATALOG_SITUATIONS } from "@/lib/home-taxonomy";
import { SectionHeading } from "./section-heading";

/**
 * «Каталог ситуаций» — жизненные ситуации семьи карточками: белая плитка,
 * заголовок по центру и короткая красная черта под ним (стиль референса).
 * Последняя — «Своя жизненная ситуация» — ведёт на развилку (анкета/обращение).
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
            className="sm-card sm-cat flex flex-col items-center justify-center rounded-xl bg-card px-3 py-5 text-center ring-1 ring-border shadow-[0_4px_14px_-10px_rgba(27,58,107,0.5)] transition-all hover:ring-brand/40"
          >
            <span className="text-sm font-bold leading-tight text-brand">
              {s.title}
            </span>
            <span className="mt-2 block h-0.5 w-8 rounded-full bg-accent-red" />
          </Link>
        ))}

        {special && (
          <Link
            href={special.href}
            className="sm-cta col-span-2 flex flex-col items-center justify-center rounded-xl bg-brand px-3 py-6 text-center text-brand-foreground shadow-[0_12px_28px_-12px_rgba(27,58,107,0.7)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <span className="text-base font-extrabold leading-tight">
              {special.title}
            </span>
            <span className="mt-1 text-xs text-white/80">
              Подберём по анкете или примем обращение
            </span>
            <span className="mt-2.5 block h-0.5 w-10 rounded-full bg-accent-red" />
          </Link>
        )}
      </div>
    </section>
  );
}
