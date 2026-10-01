"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Панель фильтров: липнет под верхней полосой при прокрутке, чтобы
 * условия поиска не уезжали из виду на длинных списках.
 */
export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-[52px] z-[5] -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur md:-mx-8 md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-[220px] flex-1 md:max-w-sm", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm shadow-[0_1px_2px_rgba(32,36,44,0.04)] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  children,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 max-w-[220px] rounded-lg border border-input bg-card px-2.5 text-sm shadow-[0_1px_2px_rgba(32,36,44,0.04)] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15",
        value && "border-primary/50 bg-primary/[0.04] font-medium text-primary",
        className,
      )}
    >
      {children}
    </select>
  );
}

/** Вкладки-сегменты со счётчиками: «Новые 29 · Отвечено 80 · Все 109». */
export function SegmentTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { key: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5" role="tablist">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-[0_1px_2px_rgba(32,36,44,0.1)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-primary/10 text-primary" : "bg-black/[0.05]",
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ResetFilters({
  onClick,
  visible,
}: {
  onClick: () => void;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <X className="size-3.5" /> Сбросить
    </button>
  );
}
