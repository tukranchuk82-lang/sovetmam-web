"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Eye, EyeOff } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { FilterSearch, ResetFilters } from "@/components/admin/ui/filter-bar";
import { EmptyState } from "@/components/admin/ui/primitives";
import { cn } from "@/lib/utils";

export interface NkoRow {
  id: string;
  name: string;
  region: string;
  isPublished: boolean;
}
export interface NkoCoordinator {
  id: string;
  name: string;
  email: string;
}

/** Список региональных НКО: у каждой — координатор региона из «Сотрудников» (со ссылкой на отчёт). */
export function NkoList({
  rows,
  coordinatorsByRegion,
  canOpenCoordinator,
  canEdit,
  toggle,
}: {
  rows: NkoRow[];
  coordinatorsByRegion: Record<string, NkoCoordinator[]>;
  canOpenCoordinator: boolean;
  canEdit: boolean;
  toggle: (id: string, isPublished: boolean) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, "е");
    return q ? rows.filter((r) => `${r.name} ${r.region}`.toLowerCase().replace(/ё/g, "е").includes(q)) : rows;
  }, [rows, query]);

  const coords = (r: NkoRow) => coordinatorsByRegion[r.region] ?? [];

  const CoordinatorCell = ({ row }: { row: NkoRow }) => {
    const list = coords(row);
    if (list.length === 0) return <span className="text-xs text-muted-foreground">в регионе нет</span>;
    return (
      <div className="flex flex-col gap-1">
        {list.map((c) =>
          canOpenCoordinator ? (
            <Link
              key={c.id}
              href={`/admin/coordinators/${c.id}`}
              onClick={(e) => e.stopPropagation()}
              className="w-fit rounded-full bg-[#E4EBF7] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#1B3A6B] hover:bg-[#D3DFF3]"
            >
              {c.name}
            </Link>
          ) : (
            <span key={c.id} className="text-[12.5px] font-semibold">
              {c.name}
            </span>
          ),
        )}
      </div>
    );
  };

  const columns: Column<NkoRow>[] = [
    {
      key: "name",
      header: "Организация",
      sort: (a, b) => a.name.localeCompare(b.name, "ru"),
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold leading-snug">{r.name}</p>
          <p className="text-xs text-muted-foreground">
            {r.region}
            {!r.isPublished && <span className="ml-2 rounded-full border px-1.5 py-0.5 text-[10.5px]">отключена</span>}
          </p>
        </div>
      ),
    },
    {
      key: "region",
      header: "Регион",
      hideBelow: "lg",
      className: "w-[200px]",
      sort: (a, b) => a.region.localeCompare(b.region, "ru"),
      cell: (r) => <span className="text-[13px]">{r.region}</span>,
    },
    {
      key: "coordinator",
      header: "Координатор",
      className: "w-[230px]",
      sort: (a, b) => (coords(a)[0]?.name ?? "я").localeCompare(coords(b)[0]?.name ?? "я", "ru"),
      cell: (r) => <CoordinatorCell row={r} />,
    },
    ...(canEdit
      ? ([
          {
            key: "act",
            header: "",
            className: "w-[130px] text-right",
            cell: (r) => (
              <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <form action={() => toggle(r.id, !r.isPublished)}>
                  <button
                    type="submit"
                    title={r.isPublished ? "Отключить: перестанет получать обращения и показываться людям" : "Включить"}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium",
                      r.isPublished ? "text-muted-foreground hover:bg-muted" : "border-primary/40 bg-primary/10 text-primary",
                    )}
                  >
                    {r.isPublished ? (
                      <>
                        <EyeOff className="size-3.5" /> Отключить
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" /> Включить
                      </>
                    )}
                  </button>
                </form>
              </div>
            ),
          },
        ] as Column<NkoRow>[])
      : []),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSearch value={query} onChange={setQuery} placeholder="Найти организацию или регион" />
        <ResetFilters visible={Boolean(query)} onClick={() => setQuery("")} />
      </div>
      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/admin/representatives/${r.id}`}
        resetKey={query}
        initialSort={{ key: "region", dir: "asc" }}
        defaultPageSize={25}
        empty={<EmptyState icon={<Building2 />} title={query ? "Ничего не нашли" : "Пока нет ни одной НКО"} />}
        mobileCard={(r) => (
          <div>
            <p className="font-semibold leading-snug">{r.name}</p>
            <p className="text-xs text-muted-foreground">
              {r.region}
              {!r.isPublished && " · отключена"}
            </p>
            <div className="mt-1.5">
              <span className="text-[11.5px] text-muted-foreground">Координатор: </span>
              {coords(r).length === 0 ? <span className="text-xs">в регионе нет</span> : <span className="text-[12.5px] font-semibold">{coords(r).map((c) => c.name).join(", ")}</span>}
            </div>
          </div>
        )}
      />
    </div>
  );
}
