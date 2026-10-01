"use client";

import { Eye } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { EmptyState } from "@/components/admin/ui/primitives";

interface Row {
  slug: string;
  title: string;
  views: number;
  people: number;
  saved: number;
  href: string;
}

/** Топ мер по просмотрам; «сохранили» рядом показывает, сколько интереса превращается в закладку. */
export function MeasureViewsTable({ rows }: { rows: Row[] }) {
  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Мера",
      sort: (a, b) => a.title.localeCompare(b.title, "ru"),
      cell: (r) => <span className="line-clamp-2 font-semibold leading-snug">{r.title}</span>,
    },
    {
      key: "views",
      header: "Просмотров",
      className: "w-[130px] text-right",
      sort: (a, b) => a.views - b.views,
      cell: (r) => <span className="tabular-nums font-semibold">{r.views}</span>,
    },
    {
      key: "people",
      header: "Людей",
      className: "w-[100px] text-right",
      sort: (a, b) => a.people - b.people,
      cell: (r) => <span className="tabular-nums">{r.people}</span>,
    },
    {
      key: "saved",
      header: "Сохранили",
      className: "w-[120px] text-right",
      sort: (a, b) => a.saved - b.saved,
      cell: (r) =>
        r.saved > 0 ? <span className="tabular-nums">{r.saved}</span> : <span className="text-muted-foreground/50">—</span>,
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
            просмотров <b className="text-foreground">{r.views}</b> · людей {r.people} · сохранили {r.saved}
          </p>
        </div>
      )}
    />
  );
}
