import Link from "next/link";
import { MeasureCard } from "@/components/measure-card";
import { CATEGORIES, pluralMeasures } from "@/lib/measures";
import { getAllMeasures } from "@/lib/measures-db";
import { cn } from "@/lib/utils";
import { MotionFadeIn, MotionStagger } from "@/components/motion";

export const metadata = { title: "Каталог мер поддержки" };

const LEVELS = [
  { value: "", label: "Все" },
  { value: "federal", label: "Федеральные" },
  { value: "regional", label: "Региональные" },
];

const chip = (active: boolean) =>
  cn(
    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-all",
    active
      ? "border-brand bg-brand text-white font-semibold shadow-[0_4px_12px_-4px_rgba(142,29,44,0.45)]"
      : "border-stone-200 bg-white text-foreground hover:bg-stone-50",
  );

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; level?: string }>;
}) {
  const sp = await searchParams;
  const activeCategory = sp.category ?? "";
  const activeLevel = sp.level ?? "";

  // Фильтр по уровню пока реально работает только для federal/regional —
  // других уровней (municipal/employer/vuz/nko) в базе ещё нет, подключим
  // после доразметки мер. Прочие разрезы с главной (type/topic/situation)
  // каталог сейчас игнорирует и показывает все меры.
  const effectiveLevel =
    activeLevel === "federal" || activeLevel === "regional" ? activeLevel : "";

  const measures = await getAllMeasures();
  const filtered = measures.filter((m) => {
    if (activeCategory && m.category !== activeCategory) return false;
    if (effectiveLevel && m.level !== effectiveLevel) return false;
    return true;
  });

  return (
    <div className="px-4 py-5">
      <MotionFadeIn>
        <h1 className="text-xl font-extrabold tracking-tight">
          Каталог мер поддержки
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Все меры в одном месте. Или{" "}
          <Link
            href="/podbor"
            className="font-semibold text-brand hover:underline"
          >
            пройдите анкету
          </Link>{" "}
          для точного подбора.
        </p>
      </MotionFadeIn>

      <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {LEVELS.map((l) => (
          <Link
            key={l.value}
            href={{
              pathname: "/catalog",
              query: {
                ...(activeCategory ? { category: activeCategory } : {}),
                ...(l.value ? { level: l.value } : {}),
              },
            }}
            className={chip(activeLevel === l.value)}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="mt-2 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href={{
            pathname: "/catalog",
            query: { ...(activeLevel ? { level: activeLevel } : {}) },
          }}
          className={chip(!activeCategory)}
        >
          Все категории
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={{
              pathname: "/catalog",
              query: {
                ...(activeLevel ? { level: activeLevel } : {}),
                category: c,
              },
            }}
            className={chip(activeCategory === c)}
          >
            {c}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Найдено: {pluralMeasures(filtered.length)}
      </p>

      <MotionStagger className="mt-3 space-y-3" stagger={0.04}>
        {filtered.map((m) => (
          <MeasureCard key={m.slug} measure={m} />
        ))}
      </MotionStagger>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          По выбранным фильтрам ничего не найдено.
        </p>
      )}
    </div>
  );
}
