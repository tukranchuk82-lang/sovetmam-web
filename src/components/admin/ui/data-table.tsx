"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/admin/ui/primitives";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Есть функция сравнения — колонка сортируется по клику на заголовок. */
  sort?: (a: T, b: T) => number;
  /** Ширина/выравнивание колонки (классы Tailwind на th и td). */
  className?: string;
  /** Скрывать колонку на узких экранах. */
  hideBelow?: "lg" | "xl";
}

const SIZES = [25, 50, 100];

/**
 * Плотная таблица данных для админки: строки 48 px, липкая шапка,
 * сортировка по клику, постраничный вывод. На телефоне вместо таблицы —
 * список карточек (`mobileCard`), горизонтальная прокрутка там неудобна.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  onRowClick,
  mobileCard,
  initialSort,
  defaultPageSize = 25,
  empty,
  resetKey,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Адрес, куда ведёт клик по строке. */
  rowHref?: (row: T) => string;
  /** Клик по строке без перехода (например, открыть боковую панель). */
  onRowClick?: (row: T) => void;
  mobileCard?: (row: T) => React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  defaultPageSize?: number;
  empty?: React.ReactNode;
  /** Меняется при смене фильтров — возвращает на первую страницу. */
  resetKey?: string;
}) {
  const router = useRouter();
  const [sort, setSort] = useState(initialSort ?? null);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageState, setPageState] = useState({ key: resetKey, page: 0 });

  const page = pageState.key === resetKey ? pageState.page : 0;
  const setPage = (p: number) => setPageState({ key: resetKey, page: p });

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const arr = [...rows].sort(col.sort);
    return sort.dir === "desc" ? arr.reverse() : arr;
  }, [rows, columns, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const from = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(sorted.length, (safePage + 1) * pageSize);

  function toggleSort(key: string) {
    setSort((cur) => {
      if (cur?.key !== key) return { key, dir: "asc" };
      if (cur.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  if (sorted.length === 0) {
    return (
      <div className="mt-4 light-surface rounded-2xl border bg-card">
        {empty ?? <EmptyState title="Ничего не найдено">Попробуйте изменить условия поиска.</EmptyState>}
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Таблица — от md */}
      <div className="light-surface hidden overflow-hidden light-surface rounded-2xl border bg-card shadow-[0_1px_2px_rgba(32,36,44,0.04)] md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-left">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn(
                      "px-3.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground",
                      c.hideBelow === "lg" && "hidden lg:table-cell",
                      c.hideBelow === "xl" && "hidden xl:table-cell",
                      c.className,
                    )}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn(
                          "-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 uppercase tracking-wide transition-colors hover:bg-black/[0.05] hover:text-foreground",
                          active && "text-foreground",
                        )}
                      >
                        {c.header}
                        {active ? (
                          sort!.dir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => {
              const href = rowHref?.(row);
              return (
                <tr
                  key={rowKey(row)}
                  onClick={href ? () => router.push(href) : onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border/70 last:border-0 transition-colors",
                    (href || onRowClick) && "cursor-pointer hover:bg-primary/[0.035]",
                  )}
                >
                  {columns.map((c, i) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3.5 py-2.5 align-middle",
                        c.hideBelow === "lg" && "hidden lg:table-cell",
                        c.hideBelow === "xl" && "hidden xl:table-cell",
                        c.className,
                      )}
                    >
                      {/* Первая ячейка — настоящая ссылка: клавиатура и «открыть в новой вкладке». */}
                      {href && i === 0 ? (
                        <Link href={href} onClick={(e) => e.stopPropagation()} className="block outline-none focus-visible:underline">
                          {c.cell(row)}
                        </Link>
                      ) : (
                        c.cell(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Карточки — телефон */}
      <div className="space-y-2 md:hidden">
        {slice.map((row) => {
          const href = rowHref?.(row);
          const body = mobileCard ? mobileCard(row) : columns[0].cell(row);
          return href ? (
            <Link
              key={rowKey(row)}
              href={href}
              className="light-surface block rounded-xl border bg-card p-3 active:bg-muted/50"
            >
              {body}
            </Link>
          ) : onRowClick ? (
            <button
              key={rowKey(row)}
              type="button"
              onClick={() => onRowClick(row)}
              className="light-surface block w-full rounded-xl border bg-card p-3 text-left active:bg-muted/50"
            >
              {body}
            </button>
          ) : (
            <div key={rowKey(row)} className="light-surface rounded-xl border bg-card p-3">
              {body}
            </div>
          );
        })}
      </div>

      {/* Постраничный вывод */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted-foreground">
        <p className="tabular-nums">
          {from}–{to} из {sorted.length}
        </p>
        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-1.5 sm:flex">
            На странице
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="h-8 rounded-md border border-input bg-card px-1.5 text-[13px] text-foreground outline-none focus:border-primary"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Предыдущая страница"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="grid size-8 place-items-center rounded-md border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[70px] text-center tabular-nums text-foreground">
              {safePage + 1} / {pages}
            </span>
            <button
              type="button"
              aria-label="Следующая страница"
              disabled={safePage >= pages - 1}
              onClick={() => setPage(safePage + 1)}
              className="grid size-8 place-items-center rounded-md border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
