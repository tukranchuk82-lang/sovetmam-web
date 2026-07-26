"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye, EyeOff, FileText, ShieldCheck } from "lucide-react";
import type { MeasureIndexRow } from "@/lib/measures-admin";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Список мер в админке. Мер больше двух тысяч — без поиска и фильтров найти в
// нём нужную было нельзя, а браузер подвисал на отрисовке. Поэтому: фильтры
// сверху и подгрузка порциями.

const PAGE = 60;

type Status = "all" | "published" | "draft";
type Level = "all" | "federal" | "regional";

const STATUS_FILTERS: { key: Status; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "published", label: "Опубликованные" },
  { key: "draft", label: "Черновики" },
];

const LEVEL_FILTERS: { key: Level; label: string }[] = [
  { key: "all", label: "Любой уровень" },
  { key: "federal", label: "Федеральные" },
  { key: "regional", label: "Региональные" },
];

/** Сверка считается устаревшей, если её не было больше 40 дней (цикл — месяц). */
function isStale(iso: string | null): boolean {
  if (!iso) return true;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000 > 40;
}

export function MeasuresList({
  measures,
  regions,
  categories,
}: {
  measures: MeasureIndexRow[];
  regions: string[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [level, setLevel] = useState<Level>("all");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [shown, setShown] = useState(PAGE);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return measures.filter((m) => {
      if (status === "published" && !m.isPublished) return false;
      if (status === "draft" && m.isPublished) return false;
      if (level !== "all" && m.level !== level) return false;
      if (region && m.region !== region) return false;
      if (category && m.category !== category) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        (m.region ?? "").toLowerCase().includes(q)
      );
    });
  }, [measures, query, status, level, region, category]);

  // Любая смена условий возвращает список в начало — иначе после фильтра
  // остаётся «показано 300 из 12».
  function reset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setShown(PAGE);
    };
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
            placeholder="Поиск по названию, региону или slug"
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              active={status === f.key}
              onClick={() => reset(setStatus)(f.key)}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LEVEL_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              active={level === f.key}
              onClick={() => reset(setLevel)(f.key)}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={region}
            onChange={(e) => reset(setRegion)(e.target.value)}
            className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Все регионы</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => reset(setCategory)(e.target.value)}
            className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Найдено: {visible.length} из {measures.length}
      </p>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed bg-muted/40 px-4 py-10 text-center">
          <p className="text-sm font-medium">Ничего не нашлось</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Попробуйте другой запрос или снимите фильтры
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {visible.slice(0, shown).map((m) => (
              <Link
                key={m.slug}
                href={`/admin/measures/${m.slug}`}
                className={cn(
                  "block rounded-2xl border p-3 transition-all hover:border-primary/50",
                  m.isPublished
                    ? "bg-card"
                    : "bg-muted/60 opacity-60 hover:opacity-100",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={m.level === "federal" ? "default" : "secondary"}>
                        {m.level === "federal" ? "Федеральная" : m.region ?? "Региональная"}
                      </Badge>
                      {m.isPublished ? (
                        <Badge variant="outline" className="gap-1">
                          <Eye className="size-3" /> опубликовано
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <EyeOff className="size-3" /> черновик
                        </Badge>
                      )}
                      {!isStale(m.verifiedAt) && (
                        <Badge variant="outline" className="gap-1 text-emerald-700">
                          <ShieldCheck className="size-3" /> сверена
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 font-semibold leading-snug">{m.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.amount || "размер не указан"} · /{m.slug}
                    </p>
                  </div>
                  <FileText className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>

          {shown < visible.length && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="mt-3 h-11 w-full rounded-xl border bg-background text-sm font-medium hover:bg-muted"
            >
              Показать ещё ({visible.length - shown})
            </button>
          )}
        </>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
