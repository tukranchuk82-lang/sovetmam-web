"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { MeasureStatusRow } from "@/lib/analytics/measure-status";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { FilterSearch, ResetFilters } from "@/components/admin/ui/filter-bar";
import { EmptyState, StatusBadge } from "@/components/admin/ui/primitives";

function num(n: number): React.ReactNode {
  return n === 0 ? <span className="text-muted-foreground/50">—</span> : <span className="tabular-nums">{n}</span>;
}

/** Таблица «по каждой мере»: сколько людей пользуются, не подавали, получили отказ. */
export function MeasureStatusTable({ rows }: { rows: MeasureStatusRow[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, "е");
    return q ? rows.filter((r) => `${r.title} ${r.region ?? ""}`.toLowerCase().replace(/ё/g, "е").includes(q)) : rows;
  }, [rows, query]);

  const columns: Column<MeasureStatusRow>[] = [
    {
      key: "title",
      header: "Мера",
      sort: (a, b) => a.title.localeCompare(b.title, "ru"),
      cell: (r) => (
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold leading-snug">{r.title}</p>
          <p className="text-xs text-muted-foreground">{r.level === "federal" ? "Федеральная" : (r.region ?? "Региональная")}</p>
        </div>
      ),
    },
    { key: "total", header: "Ответов", className: "w-[90px] text-right", sort: (a, b) => a.total - b.total, cell: (r) => <span className="font-semibold tabular-nums">{r.total}</span> },
    { key: "using", header: "Пользуются", className: "w-[110px] text-right", sort: (a, b) => a.using - b.using, cell: (r) => num(r.using) },
    { key: "notApplied", header: "Не подавали", className: "w-[110px] text-right", sort: (a, b) => a.notApplied - b.notApplied, cell: (r) => num(r.notApplied) },
    { key: "refused", header: "Отказали", className: "w-[100px] text-right", sort: (a, b) => a.refused - b.refused, cell: (r) => num(r.refused) },
    {
      key: "refusedPct",
      header: "Отказов среди подавших",
      hideBelow: "lg",
      className: "w-[150px] text-right",
      sort: (a, b) => (a.refusedPct ?? -1) - (b.refusedPct ?? -1),
      cell: (r) =>
        r.refusedPct === null ? (
          <span className="text-muted-foreground/50">—</span>
        ) : r.refusedPct >= 40 ? (
          <StatusBadge tone="danger">{r.refusedPct}%</StatusBadge>
        ) : (
          <span className="tabular-nums">{r.refusedPct}%</span>
        ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSearch value={query} onChange={setQuery} placeholder="Найти меру или регион" />
        <ResetFilters visible={Boolean(query)} onClick={() => setQuery("")} />
      </div>
      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(r) => r.slug}
        rowHref={(r) => `/admin/measures/${r.slug}`}
        resetKey={query}
        initialSort={{ key: "total", dir: "desc" }}
        defaultPageSize={25}
        empty={<EmptyState icon={<ClipboardCheck />} title={query ? "Ничего не нашли" : "Ответов пока нет"} />}
        mobileCard={(r) => (
          <div>
            <p className="font-semibold leading-snug">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.level === "federal" ? "Федеральная" : (r.region ?? "Региональная")}</p>
            <p className="mt-1.5 flex flex-wrap gap-x-4 text-[12.5px] text-muted-foreground">
              <span>пользуются: <b className="text-foreground">{r.using}</b></span>
              <span>не подавали: <b className="text-foreground">{r.notApplied}</b></span>
              <span>отказали: <b className="text-foreground">{r.refused}</b></span>
            </p>
          </div>
        )}
      />
    </>
  );
}
