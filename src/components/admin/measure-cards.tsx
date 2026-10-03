"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, EyeOff, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import type { MeasureIndexRow } from "@/lib/measures-admin";
import { categoryMeta } from "@/lib/category-meta";
import { cn } from "@/lib/utils";

/**
 * Меры региона для координатора — плитками-карточками, а не таблицей.
 *
 * Смысл страницы именно в мерах, поэтому каждая — самостоятельный яркий блок:
 * цветная полоса слева и значок по категории (те же цвета, что в каталоге
 * приложения), крупное название, размер выплаты отдельной плашкой, регион —
 * тёмно-синей плашкой, статус — в углу. Они заметно выделяются на тёмном фоне,
 * в отличие от тихой подсказки над ними.
 */

const PAGE = 24;

function isStale(iso: string | null): boolean {
  if (!iso) return true;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000 > 40;
}

function verifiedLabel(iso: string | null): string {
  if (!iso) return "не сверялась";
  return "сверена " + new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

export function MeasureCards({ rows }: { rows: MeasureIndexRow[] }) {
  const [shown, setShown] = useState(PAGE);
  const visible = rows.slice(0, shown);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-white/[0.07] px-4 py-10 text-center text-sm text-white/70">
        Ничего не нашлось. Попробуйте другой запрос или категорию.
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        {visible.map((m) => {
          const meta = categoryMeta(m.category);
          const Icon = meta.icon;
          return (
            <li key={m.slug}>
              <Link
                href={`/admin/measures/${m.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white text-[#20242c] shadow-[0_8px_24px_-14px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(0,0,0,0.7)]"
              >
                {/* Цветная полоса категории. */}
                <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: meta.color }} />

                <div className="flex flex-1 flex-col gap-3 p-4 pl-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg"
                        style={{ background: meta.color + "1F", color: meta.color }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span
                        className="truncate text-[11.5px] font-bold uppercase tracking-wide"
                        style={{ color: meta.color }}
                      >
                        {m.category}
                      </span>
                    </span>
                    {m.isPublished ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <Eye className="size-3" /> Опубликована
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 ring-1 ring-inset ring-stone-300">
                        <EyeOff className="size-3" /> Черновик
                      </span>
                    )}
                  </div>

                  <h3 className={cn("text-[17px] font-bold leading-snug", !m.isPublished && "text-[#5d6470]")}>
                    {m.title}
                  </h3>

                  {m.amount && (
                    <p
                      className="w-fit max-w-full rounded-lg px-2.5 py-1 text-[13px] font-semibold leading-snug"
                      style={{ background: meta.color + "17", color: meta.color }}
                    >
                      {m.amount}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#1B3A6B] px-2 py-1 text-[12px] font-semibold text-white">
                      <MapPin className="size-3" />
                      {m.level === "federal" ? "Федеральная" : (m.region ?? "Региональная")}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[12px] font-medium",
                        isStale(m.verifiedAt) ? "text-amber-700" : "text-emerald-700",
                      )}
                    >
                      {isStale(m.verifiedAt) ? <ShieldAlert className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                      {verifiedLabel(m.verifiedAt)}
                    </span>
                    <ArrowUpRight className="ml-auto size-4 text-[#9aa0a8] transition-colors group-hover:text-[#1B3A6B]" />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {rows.length > shown && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Показать ещё · осталось {rows.length - shown}
          </button>
        </div>
      )}
    </>
  );
}
