import Link from "next/link";
import { PERIODS, type PeriodKey } from "@/lib/analytics/period";
import { cn } from "@/lib/utils";

/**
 * Переключатель периода отчёта. Обычные ссылки с ?period=: страница
 * остаётся серверной, а срез можно отправить коллеге ссылкой.
 * `extra` — прочие параметры адреса, которые надо сохранить (например, регион).
 */
export function PeriodTabs({
  value,
  basePath,
  extra,
}: {
  value: PeriodKey;
  basePath: string;
  extra?: Record<string, string | undefined>;
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5" role="tablist" aria-label="Период">
      {PERIODS.map((p) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(extra ?? {})) if (v) params.set(k, v);
        params.set("period", p.key);
        const active = p.key === value;
        return (
          <Link
            key={p.key}
            href={`${basePath}?${params.toString()}`}
            role="tab"
            aria-selected={active}
            scroll={false}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-[0_1px_2px_rgba(32,36,44,0.1)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
