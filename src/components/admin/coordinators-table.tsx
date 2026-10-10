"use client";

import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import type { CoordinatorOverviewRow } from "@/lib/analytics/coordinator-report";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { FilterBar, FilterSearch, ResetFilters } from "@/components/admin/ui/filter-bar";
import { EmptyState, StatusBadge, type Tone } from "@/components/admin/ui/primitives";

const STATUS_TONE: Record<CoordinatorOverviewRow["status"]["tone"], Tone> = {
  ok: "done",
  warn: "new",
  idle: "draft",
};

export function CoordinatorStatusBadge({ status }: { status: CoordinatorOverviewRow["status"] }) {
  return <StatusBadge tone={STATUS_TONE[status.tone]}>{status.label}</StatusBadge>;
}

function num(n: number): React.ReactNode {
  return n === 0 ? <span className="text-muted-foreground/50">—</span> : <span className="tabular-nums">{n}</span>;
}

function span(min: number | null): string {
  if (min === null) return "—";
  if (min < 60) return `${min} мин`;
  if (min < 60 * 48) return `${Math.round(min / 60)} ч`;
  return `${Math.round(min / 60 / 24)} дн.`;
}

function ago(iso: string | null): string {
  if (!iso) return "не входил";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  return `${days} дн. назад`;
}

export function CoordinatorsTable({ rows, periodLabel }: { rows: CoordinatorOverviewRow[]; periodLabel: string }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, "е");
    return q
      ? rows.filter((r) => `${r.region ?? ""} ${r.name} ${r.email}`.toLowerCase().replace(/ё/g, "е").includes(q))
      : rows;
  }, [rows, query]);

  const columns: Column<CoordinatorOverviewRow>[] = [
    {
      key: "who",
      header: "Регион · координатор",
      sort: (a, b) => (a.region ?? "я").localeCompare(b.region ?? "я", "ru"),
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold leading-snug">{r.region ?? "Регион не указан"}</p>
          <p className="truncate text-xs text-muted-foreground">{r.name}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Как дела",
      className: "w-[135px]",
      sort: (a, b) => a.status.tone.localeCompare(b.status.tone),
      cell: (r) => <CoordinatorStatusBadge status={r.status} />,
    },
    {
      key: "last",
      header: "Последний вход",
      className: "w-[120px]",
      sort: (a, b) => (a.lastLoginAt ?? "").localeCompare(b.lastLoginAt ?? ""),
      cell: (r) => <span className="text-[13px]">{ago(r.lastLoginAt)}</span>,
    },
    {
      key: "replied",
      header: "Ответов",
      className: "w-[80px] text-right",
      sort: (a, b) => a.replied - b.replied,
      cell: (r) => num(r.replied),
    },
    {
      key: "waiting",
      header: "Ждут",
      className: "w-[70px] text-right",
      sort: (a, b) => a.waitingNow - b.waitingNow,
      cell: (r) =>
        r.waitingNow > 0 ? <StatusBadge tone="new">{r.waitingNow}</StatusBadge> : <span className="text-muted-foreground/50">—</span>,
    },
    {
      key: "reply",
      header: "Время ответа",
      hideBelow: "lg",
      className: "w-[100px] text-right",
      sort: (a, b) => (a.medianReplyMin ?? Infinity) - (b.medianReplyMin ?? Infinity),
      cell: (r) => <span className="tabular-nums">{span(r.medianReplyMin)}</span>,
    },
    {
      key: "day",
      header: "В сутки",
      hideBelow: "lg",
      className: "w-[80px] text-right",
      sort: (a, b) => (a.within24hPct ?? -1) - (b.within24hPct ?? -1),
      cell: (r) => <span className="tabular-nums">{r.within24hPct !== null ? `${r.within24hPct}%` : "—"}</span>,
    },
    {
      key: "invited",
      header: "Приглашено",
      hideBelow: "lg",
      className: "w-[120px] text-right",
      sort: (a, b) => a.invited - b.invited,
      cell: (r) => num(r.invited),
    },
  ];

  return (
    <>
      <FilterBar>
        <FilterSearch value={query} onChange={setQuery} placeholder="Найти регион или координатора" />
        <ResetFilters visible={Boolean(query)} onClick={() => setQuery("")} />
      </FilterBar>
      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/admin/coordinators/${r.id}`}
        resetKey={query}
        initialSort={{ key: "who", dir: "asc" }}
        defaultPageSize={50}
        empty={<EmptyState icon={<UserRound />} title="Таких координаторов нет" />}
        mobileCard={(r) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold leading-snug">{r.region ?? "Регион не указан"}</p>
                <p className="truncate text-xs text-muted-foreground">{r.name}</p>
              </div>
              <CoordinatorStatusBadge status={r.status} />
            </div>
            <p className="mt-1.5 flex flex-wrap gap-x-4 text-[12.5px] text-muted-foreground">
              <span>
                вход: <b className="text-foreground">{ago(r.lastLoginAt)}</b>
              </span>
              <span>
                ответов: <b className="text-foreground">{r.replied}</b> ({periodLabel.toLowerCase()})
              </span>
              {r.waitingNow > 0 && <span className="text-amber-700">ждут: {r.waitingNow}</span>}
              <span>
                приглашено: <b className="text-foreground">{r.invited}</b>
              </span>
            </p>
          </div>
        )}
      />
    </>
  );
}
