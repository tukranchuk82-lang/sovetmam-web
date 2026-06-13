import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATALOG_SITUATIONS } from "@/lib/home-taxonomy";

/**
 * «Каталог мер поддержки» — жизненные ситуации семьи (карточки).
 * Последняя — «Своя жизненная ситуация» — ведёт на страницу-развилку
 * (анкета или обращение в Совет матерей).
 */
export function CatalogSituations() {
  const regular = CATALOG_SITUATIONS.filter((s) => !s.special);
  const special = CATALOG_SITUATIONS.find((s) => s.special);

  return (
    <section>
      <h2 className="text-lg font-extrabold tracking-tight text-foreground">
        Каталог мер поддержки
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Выберите жизненную ситуацию вашей семьи
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {regular.map((s, i) => (
          <Link
            key={s.id}
            href={s.href}
            className="flex items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5 transition-all hover:scale-[1.02] hover:ring-brand/30"
          >
            <span className="text-[11px] font-bold tabular-nums text-brand/60">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-semibold leading-tight text-foreground">
              {s.title}
            </span>
          </Link>
        ))}
      </div>

      {special && (
        <Link
          href={special.href}
          className="mt-2.5 flex items-center gap-3 rounded-2xl bg-brand p-4 text-brand-foreground shadow-[0_12px_26px_-12px_rgba(15,138,106,0.6)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold leading-tight">
              {special.title}
            </p>
            <p className="mt-0.5 text-sm text-white/85">
              Не нашли свою? Подберём по анкете или примем обращение
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0" />
        </Link>
      )}
    </section>
  );
}
