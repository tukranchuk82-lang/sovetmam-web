"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Раскрывающаяся плашка раздела: заголовок, пояснение, число справа. Нажали —
 * внутри открылось содержимое. Нужна там, где в одном разделе несколько
 * подразделов и длинные списки: страница остаётся короткой, а нужное находится
 * одним нажатием.
 */
export function Plate({
  title,
  hint,
  count,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  /** Дополнительная метка рядом с числом, например «2 требуют внимания». */
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="light-surface overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold leading-tight">{title}</span>
          {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
        </span>
        {badge}
        {count !== undefined && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-primary">{count}</span>
        )}
        <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t px-4 pb-4 pt-3">{children}</div>}
    </section>
  );
}
