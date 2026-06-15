import Link from "next/link";
import { LIFE_CATEGORIES } from "@/lib/home-taxonomy";
import { LIFE_CATEGORY_EMOJI, LIFE_CATEGORY_DOODLE } from "./icons";
import { Doodle } from "./crayon-doodles";
import { SectionHeading } from "./section-heading";

/** «Жизненные ситуации» — тематические категории с мультяшными эмодзи. */
export function LifeCategories() {
  return (
    <section>
      <SectionHeading subtitle="Поддержка со всех сторон — выберите, что вам нужно">
        Жизненные ситуации
      </SectionHeading>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {LIFE_CATEGORIES.map((c) => {
          const emoji = LIFE_CATEGORY_EMOJI[c.id];
          return (
            <Link
              key={c.id}
              href={c.href}
              className="sm-card sm-tile flex flex-col items-center gap-2 rounded-xl bg-card p-3 text-center ring-1 ring-border shadow-[0_4px_14px_-10px_rgba(27,58,107,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-12px_rgba(27,58,107,0.6)] hover:ring-2 hover:ring-brand">
              <span className="sm-ico-tile flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
                <span className="sm-ico-emoji">{emoji}</span>
                <span className="sm-ico-doodle">
                  <Doodle name={LIFE_CATEGORY_DOODLE[c.id]} className="size-8" />
                </span>
              </span>
              <span className="text-xs font-semibold leading-tight text-foreground">
                {c.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
