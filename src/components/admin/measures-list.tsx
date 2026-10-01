"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, LayoutGrid, ShieldCheck, ShieldAlert } from "lucide-react";
import type { MeasureIndexRow } from "@/lib/measures-admin";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  ResetFilters,
  SegmentTabs,
} from "@/components/admin/ui/filter-bar";
import { EmptyState, StatusBadge } from "@/components/admin/ui/primitives";

// Список мер в админке. Мер больше двух тысяч: плотная таблица с сортировкой,
// постраничным выводом и липкой панелью фильтров — найти нужную можно за
// пару секунд, а браузер не рисует всё разом.

type Status = "all" | "published" | "draft";

/** Сверка считается устаревшей, если её не было больше 40 дней (цикл — месяц). */
function isStale(iso: string | null): boolean {
  if (!iso) return true;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000 > 40;
}

function verifiedLabel(iso: string | null): string {
  if (!iso) return "не сверялась";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
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
  const [level, setLevel] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");

  const counts = useMemo(() => {
    const published = measures.filter((m) => m.isPublished).length;
    return { all: measures.length, published, draft: measures.length - published };
  }, [measures]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return measures.filter((m) => {
      if (status === "published" && !m.isPublished) return false;
      if (status === "draft" && m.isPublished) return false;
      if (level && m.level !== level) return false;
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

  const filtered = Boolean(query || level || region || category);
  const resetKey = `${status}|${query}|${level}|${region}|${category}`;

  const columns: Column<MeasureIndexRow>[] = [
    {
      key: "title",
      header: "Мера",
      sort: (a, b) => a.title.localeCompare(b.title, "ru"),
      cell: (m) => (
        <div className="min-w-0">
          <p className={m.isPublished ? "truncate font-semibold leading-snug" : "truncate font-semibold leading-snug text-muted-foreground"}>
            {m.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {m.amount || "размер не указан"} · /{m.slug}
          </p>
        </div>
      ),
    },
    {
      key: "level",
      header: "Уровень",
      className: "w-[190px]",
      sort: (a, b) => (a.region ?? "").localeCompare(b.region ?? "", "ru"),
      cell: (m) =>
        m.level === "federal" ? (
          <StatusBadge tone="brand">Федеральная</StatusBadge>
        ) : (
          <span className="line-clamp-2 text-[13px]">{m.region ?? "Региональная"}</span>
        ),
    },
    {
      key: "category",
      header: "Категория",
      hideBelow: "xl",
      className: "w-[170px]",
      sort: (a, b) => a.category.localeCompare(b.category, "ru"),
      cell: (m) => <span className="line-clamp-2 text-[13px] text-muted-foreground">{m.category}</span>,
    },
    {
      key: "status",
      header: "Статус",
      className: "w-[130px]",
      sort: (a, b) => Number(b.isPublished) - Number(a.isPublished),
      cell: (m) =>
        m.isPublished ? (
          <StatusBadge tone="done" icon={<Eye />}>
            Опубликована
          </StatusBadge>
        ) : (
          <StatusBadge tone="draft" icon={<EyeOff />}>
            Черновик
          </StatusBadge>
        ),
    },
    {
      key: "verified",
      header: "Сверка",
      hideBelow: "lg",
      className: "w-[130px]",
      sort: (a, b) => (a.verifiedAt ?? "").localeCompare(b.verifiedAt ?? ""),
      cell: (m) =>
        isStale(m.verifiedAt) ? (
          <span className="inline-flex items-center gap-1 text-[12.5px] text-amber-700">
            <ShieldAlert className="size-3.5" /> {verifiedLabel(m.verifiedAt)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12.5px] text-emerald-700">
            <ShieldCheck className="size-3.5" /> {verifiedLabel(m.verifiedAt)}
          </span>
        ),
    },
  ];

  return (
    <>
      <FilterBar>
        <SegmentTabs
          value={status}
          onChange={setStatus}
          items={[
            { key: "all", label: "Все", count: counts.all },
            { key: "published", label: "Опубликованные", count: counts.published },
            { key: "draft", label: "Черновики", count: counts.draft },
          ]}
        />
        <FilterSearch value={query} onChange={setQuery} placeholder="Название, регион или slug" />
        <FilterSelect label="Уровень" value={level} onChange={setLevel}>
          <option value="">Любой уровень</option>
          <option value="federal">Федеральные</option>
          <option value="regional">Региональные</option>
        </FilterSelect>
        <FilterSelect label="Регион" value={region} onChange={setRegion}>
          <option value="">Все регионы</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Категория" value={category} onChange={setCategory}>
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </FilterSelect>
        <ResetFilters
          visible={filtered}
          onClick={() => {
            setQuery("");
            setLevel("");
            setRegion("");
            setCategory("");
          }}
        />
      </FilterBar>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(m) => m.slug}
        rowHref={(m) => `/admin/measures/${m.slug}`}
        resetKey={resetKey}
        empty={
          <EmptyState icon={<LayoutGrid />} title="Ничего не нашлось">
            Попробуйте другой запрос или сбросьте фильтры.
          </EmptyState>
        }
        mobileCard={(m) => (
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              {m.level === "federal" ? (
                <StatusBadge tone="brand">Федеральная</StatusBadge>
              ) : (
                <StatusBadge tone="info">{m.region ?? "Региональная"}</StatusBadge>
              )}
              {m.isPublished ? (
                <StatusBadge tone="done" icon={<Eye />}>
                  Опубликована
                </StatusBadge>
              ) : (
                <StatusBadge tone="draft" icon={<EyeOff />}>
                  Черновик
                </StatusBadge>
              )}
            </div>
            <p className="mt-1.5 font-semibold leading-snug">{m.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.amount || "размер не указан"}</p>
          </div>
        )}
      />
    </>
  );
}
