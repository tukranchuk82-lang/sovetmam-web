import Link from "next/link";
import { LIFE_CATEGORIES } from "@/lib/home-taxonomy";

/** «Жизненные ситуации» — тематические категории (15 «лепестков»). */
export function LifeCategories() {
  return (
    <section>
      <h2 className="text-lg font-extrabold tracking-tight text-foreground">
        Жизненные ситуации
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Поддержка со всех сторон — выберите, что вам нужно
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {LIFE_CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white p-3 text-center ring-1 ring-black/5 transition-all hover:scale-[1.03] hover:ring-brand/30"
          >
            <span className="text-2xl leading-none">{c.emoji}</span>
            <span className="text-xs font-semibold leading-tight text-foreground">
              {c.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
