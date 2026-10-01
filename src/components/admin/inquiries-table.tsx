"use client";

import { useMemo, useState } from "react";
import { Clock, CheckCircle2, Landmark, MessageSquare } from "lucide-react";
import { INQUIRY_TYPE_LABEL } from "@/lib/inquiries";
import type { Inquiry } from "@/lib/inquiries-db";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  ResetFilters,
  SegmentTabs,
} from "@/components/admin/ui/filter-bar";
import { EmptyState, StatusBadge } from "@/components/admin/ui/primitives";

type Tab = "new" | "answered" | "all";

const CHANNEL_LABEL = { telegram: "Telegram", vk: "VK", max: "MAX" } as const;

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

export function InquiriesTable({
  inquiries,
  regions,
  showRegionFilter,
}: {
  inquiries: Inquiry[];
  regions: string[];
  showRegionFilter: boolean;
}) {
  const [tab, setTab] = useState<Tab>("new");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");

  const counts = useMemo(() => {
    const n = inquiries.filter((i) => i.status === "new").length;
    return { new: n, answered: inquiries.length - n, all: inquiries.length };
  }, [inquiries]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (tab === "new" && i.status !== "new") return false;
      if (tab === "answered" && i.status !== "answered") return false;
      if (region && i.region !== region) return false;
      if (type && i.type !== type) return false;
      if (!q) return true;
      return (
        i.subject.toLowerCase().includes(q) ||
        i.userName.toLowerCase().includes(q) ||
        i.body.toLowerCase().includes(q)
      );
    });
  }, [inquiries, tab, query, region, type]);

  const filtered = Boolean(query || region || type);
  const resetKey = `${tab}|${query}|${region}|${type}`;

  const columns: Column<Inquiry>[] = [
    {
      key: "status",
      header: "Статус",
      className: "w-[110px]",
      sort: (a, b) => a.status.localeCompare(b.status),
      cell: (i) =>
        i.status === "new" ? (
          <StatusBadge tone="new" icon={<Clock />}>
            Новое
          </StatusBadge>
        ) : (
          <StatusBadge tone="done" icon={<CheckCircle2 />}>
            Отвечено
          </StatusBadge>
        ),
    },
    {
      key: "subject",
      header: "Обращение",
      sort: (a, b) => a.subject.localeCompare(b.subject, "ru"),
      cell: (i) => (
        <div className="min-w-0">
          <p className="truncate font-semibold leading-snug">{i.subject}</p>
          <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">{i.body}</p>
        </div>
      ),
    },
    {
      key: "author",
      header: "Автор",
      hideBelow: "lg",
      className: "w-[190px]",
      sort: (a, b) => a.userName.localeCompare(b.userName, "ru"),
      cell: (i) => (
        <div className="min-w-0">
          <p className="truncate">{i.userName}</p>
          {i.userChannel && (
            <p className="text-[11.5px] text-muted-foreground">{CHANNEL_LABEL[i.userChannel]}</p>
          )}
        </div>
      ),
    },
    {
      key: "region",
      header: "Регион",
      hideBelow: "xl",
      className: "w-[190px]",
      sort: (a, b) => (a.region ?? "").localeCompare(b.region ?? "", "ru"),
      cell: (i) => (
        <span className="line-clamp-2 text-[13px] text-muted-foreground">{i.region ?? "—"}</span>
      ),
    },
    {
      key: "type",
      header: "Тип",
      className: "w-[110px]",
      cell: (i) => <StatusBadge tone="brand">{INQUIRY_TYPE_LABEL[i.type]}</StatusBadge>,
    },
    {
      key: "date",
      header: "Дата",
      className: "w-[84px] text-right",
      sort: (a, b) => a.createdAt.localeCompare(b.createdAt),
      cell: (i) => <span className="tabular-nums text-[13px] text-muted-foreground">{fmt(i.createdAt)}</span>,
    },
  ];

  return (
    <>
      <FilterBar>
        <SegmentTabs
          value={tab}
          onChange={setTab}
          items={[
            { key: "new", label: "Новые", count: counts.new },
            { key: "answered", label: "Отвечено", count: counts.answered },
            { key: "all", label: "Все", count: counts.all },
          ]}
        />
        <FilterSearch value={query} onChange={setQuery} placeholder="Тема, автор или текст" />
        {showRegionFilter && (
          <FilterSelect label="Регион" value={region} onChange={setRegion}>
            <option value="">Все регионы</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </FilterSelect>
        )}
        <FilterSelect label="Тип обращения" value={type} onChange={setType}>
          <option value="">Любой тип</option>
          {Object.entries(INQUIRY_TYPE_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </FilterSelect>
        <ResetFilters
          visible={filtered}
          onClick={() => {
            setQuery("");
            setRegion("");
            setType("");
          }}
        />
      </FilterBar>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(i) => i.id}
        rowHref={(i) => `/admin/inquiries/${i.id}`}
        resetKey={resetKey}
        initialSort={{ key: "date", dir: "desc" }}
        empty={
          <EmptyState icon={<MessageSquare />} title={tab === "new" ? "Новых обращений нет" : "Ничего не найдено"}>
            {tab === "new"
              ? "Когда пользователь оставит вопрос или предложение — оно появится здесь."
              : "Попробуйте изменить условия поиска."}
          </EmptyState>
        }
        mobileCard={(i) => (
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              {i.status === "new" ? (
                <StatusBadge tone="new" icon={<Clock />}>
                  Новое
                </StatusBadge>
              ) : (
                <StatusBadge tone="done" icon={<CheckCircle2 />}>
                  Отвечено
                </StatusBadge>
              )}
              <StatusBadge tone="brand">{INQUIRY_TYPE_LABEL[i.type]}</StatusBadge>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">{fmt(i.createdAt)}</span>
            </div>
            <p className="mt-1.5 font-semibold leading-snug">{i.subject}</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">
              {i.userName} · {i.body}
            </p>
            {(i.region || i.representativeName) && (
              <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-muted-foreground">
                {i.representativeName && <Landmark className="size-3 text-primary" />}
                {i.region}
              </p>
            )}
          </div>
        )}
      />
    </>
  );
}
