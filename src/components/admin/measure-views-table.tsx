"use client";

import { Eye } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { EmptyState } from "@/components/admin/ui/primitives";
import type { MeasureViewRow } from "@/lib/analytics/views";

function fmtSeconds(s: number | null): string {
  if (s == null) return "—";
  if (s < 60) return `${s} с`;
  return `${Math.floor(s / 60)} мин ${String(s % 60).padStart(2, "0")} с`;
}

const fmtPct = (p: number | null) => (p == null ? "—" : `${p}%`);

/** Топ мер: сколько открывали, как долго читали, дочитывали ли и что нажимали. */
export function MeasureViewsTable({ rows }: { rows: MeasureViewRow[] }) {
  const num = "tabular-nums";
  const columns: Column<MeasureViewRow>[] = [
    {
      key: "title",
      header: "Мера",
      sort: (a, b) => a.title.localeCompare(b.title, "ru"),
      cell: (r) => <span className="line-clamp-2 font-semibold leading-snug">{r.title}</span>,
    },
    {
      key: "views",
      header: "Открыли",
      className: "w-[100px] text-right",
      sort: (a, b) => a.views - b.views,
      cell: (r) => <span className={`${num} font-semibold`}>{r.views}</span>,
    },
    {
      key: "people",
      header: "Людей",
      className: "w-[80px] text-right",
      hideBelow: "lg",
      sort: (a, b) => a.people - b.people,
      cell: (r) => <span className={num}>{r.people}</span>,
    },
    {
      key: "time",
      header: "Время",
      className: "w-[110px] text-right",
      hideBelow: "lg",
      sort: (a, b) => (a.avgSeconds ?? -1) - (b.avgSeconds ?? -1),
      cell: (r) => <span className={num}>{fmtSeconds(r.avgSeconds)}</span>,
    },
    {
      key: "read",
      header: "Дочитали",
      className: "w-[100px] text-right",
      hideBelow: "xl",
      sort: (a, b) => (a.readPct ?? -1) - (b.readPct ?? -1),
      cell: (r) => <span className={num}>{fmtPct(r.readPct)}</span>,
    },
    {
      key: "action",
      header: "Нажали",
      className: "w-[90px] text-right",
      hideBelow: "xl",
      sort: (a, b) => (a.actionPct ?? -1) - (b.actionPct ?? -1),
      cell: (r) => <span className={num}>{fmtPct(r.actionPct)}</span>,
    },
    {
      key: "saved",
      header: "Сохранили",
      className: "w-[100px] text-right",
      sort: (a, b) => a.saved - b.saved,
      cell: (r) =>
        r.saved > 0 ? <span className={num}>{r.saved}</span> : <span className="text-muted-foreground/50">—</span>,
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.slug}
      rowHref={(r) => r.href}
      initialSort={{ key: "views", dir: "desc" }}
      empty={<EmptyState icon={<Eye />} title="За этот период просмотров нет" />}
      mobileCard={(r) => (
        <div>
          <p className="font-semibold leading-snug">{r.title}</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            открыли <b className="text-foreground">{r.views}</b> · людей {r.people} · сохранили {r.saved}
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            время {fmtSeconds(r.avgSeconds)} · дочитали {fmtPct(r.readPct)} · нажали {fmtPct(r.actionPct)}
          </p>
        </div>
      )}
    />
  );
}
