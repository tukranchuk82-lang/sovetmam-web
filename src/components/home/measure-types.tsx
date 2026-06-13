import Link from "next/link";
import { MEASURE_TYPES } from "@/lib/home-taxonomy";

/** «Какими бывают меры» — по характеру и периодичности (7 плиток). */
export function MeasureTypes() {
  return (
    <section>
      <h2 className="text-lg font-extrabold tracking-tight text-foreground">
        Какими бывают меры
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        По форме и тому, как часто их можно получить
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {MEASURE_TYPES.map((t, i) => (
          <Link
            key={t.id}
            href={t.href}
            className={
              "flex items-center gap-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-black/5 transition-all hover:scale-[1.02] hover:ring-brand/30" +
              // последняя плитка занимает обе колонки
              (i === MEASURE_TYPES.length - 1 ? " col-span-2" : "")
            }
          >
            <span className="text-xl leading-none">{t.emoji}</span>
            <span className="text-sm font-semibold leading-tight text-foreground">
              {t.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
