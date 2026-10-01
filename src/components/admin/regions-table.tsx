"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import type { RegionRow } from "@/lib/analytics/regions";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { FilterBar, FilterSearch, ResetFilters } from "@/components/admin/ui/filter-bar";
import { EmptyState, StatusBadge } from "@/components/admin/ui/primitives";

function num(n: number, dash = true): React.ReactNode {
  return n === 0 && dash ? <span className="text-muted-foreground/50">—</span> : <span className="tabular-nums">{n}</span>;
}

export function RegionsTable({ rows, periodLabel }: { rows: RegionRow[]; periodLabel: string }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, "е");
    return q ? rows.filter((r) => r.region.toLowerCase().replace(/ё/g, "е").includes(q)) : rows;
  }, [rows, query]);

  const columns: Column<RegionRow>[] = [
    {
      key: "region",
      header: "Регион",
      sort: (a, b) => a.region.localeCompare(b.region, "ru"),
      cell: (r) => <span className="font-semibold">{r.region}</span>,
    },
    {
      key: "people",
      header: "Людей",
      className: "w-[100px] text-right",
      sort: (a, b) => a.people - b.people,
      cell: (r) => <span className="tabular-nums font-semibold">{r.people}</span>,
    },
    {
      key: "newPeople",
      header: `Новых · ${periodLabel}`,
      className: "w-[150px] text-right",
      sort: (a, b) => a.newPeople - b.newPeople,
      cell: (r) => num(r.newPeople),
    },
    {
      key: "inquiries",
      header: `Обращений · ${periodLabel}`,
      className: "w-[170px] text-right",
      sort: (a, b) => a.inquiries - b.inquiries,
      cell: (r) => num(r.inquiries),
    },
    {
      key: "unanswered",
      header: "Без ответа",
      hideBelow: "lg",
      className: "w-[120px] text-right",
      sort: (a, b) => a.unanswered - b.unanswered,
      cell: (r) =>
        r.unanswered > 0 ? (
          <StatusBadge tone="new">{r.unanswered}</StatusBadge>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        ),
    },
    {
      key: "per100",
      header: "Обр. на 100 чел.",
      hideBelow: "xl",
      className: "w-[150px] text-right",
      sort: (a, b) => a.per100 - b.per100,
      cell: (r) => num(r.per100),
    },
    {
      key: "saved",
      header: "Избранное",
      hideBelow: "lg",
      className: "w-[110px] text-right",
      sort: (a, b) => a.saved - b.saved,
      cell: (r) => num(r.saved),
    },
  ];

  return (
    <>
      <FilterBar>
        <FilterSearch value={query} onChange={setQuery} placeholder="Найти регион" />
        <ResetFilters visible={Boolean(query)} onClick={() => setQuery("")} />
      </FilterBar>
      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(r) => r.region}
        resetKey={query}
        initialSort={{ key: "people", dir: "desc" }}
        defaultPageSize={50}
        empty={<EmptyState icon={<MapPin />} title="Такого региона нет" />}
        mobileCard={(r) => (
          <div>
            <p className="font-semibold leading-snug">{r.region}</p>
            <p className="mt-1 flex flex-wrap gap-x-4 text-[12.5px] text-muted-foreground">
              <span>
                людей: <b className="text-foreground">{r.people}</b>
              </span>
              <span>
                обращений: <b className="text-foreground">{r.inquiries}</b>
              </span>
              {r.unanswered > 0 && <span className="text-amber-700">без ответа: {r.unanswered}</span>}
            </p>
          </div>
        )}
      />
    </>
  );
}
