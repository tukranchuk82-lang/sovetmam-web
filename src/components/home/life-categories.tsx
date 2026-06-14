import Link from "next/link";
import { LIFE_CATEGORIES } from "@/lib/home-taxonomy";
import { LIFE_CATEGORY_ICONS } from "./icons";
import { SectionHeading } from "./section-heading";

/** «Жизненные ситуации» — тематические категории с линейными иконками. */
export function LifeCategories() {
  return (
    <section>
      <SectionHeading subtitle="Поддержка со всех сторон — выберите, что вам нужно">
        Жизненные ситуации
      </SectionHeading>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {LIFE_CATEGORIES.map((c) => {
          const Icon = LIFE_CATEGORY_ICONS[c.id];
          return (
            <Link
              key={c.id}
              href={c.href}
              className="sm-card flex flex-col items-center gap-2 rounded-xl bg-card p-3 text-center ring-1 ring-border shadow-[0_4px_14px_-10px_rgba(27,58,107,0.5)] transition-all hover:ring-brand/40"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                {Icon && <Icon className="size-5" />}
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
