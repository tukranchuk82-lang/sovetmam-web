import { cn } from "@/lib/utils";

/** Карточка-показатель: крупная цифра и подпись. */
export function StatCard({
  label,
  value,
  hint,
  delta,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Изменение к прошлому периоду, %; null — сравнивать не с чем. */
  delta?: number | null;
  tone?: "default" | "accent" | "warn";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card px-4 py-3.5 shadow-[0_1px_2px_rgba(32,36,44,0.04)]",
        className,
      )}
    >
      <p
        className={cn(
          "text-[26px] font-bold leading-none tracking-tight tabular-nums",
          tone === "accent" && "text-primary",
          tone === "warn" && "text-amber-600",
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {delta !== undefined && (
        <p
          className={cn(
            "mt-1 text-[11.5px] font-semibold tabular-nums",
            delta === null || delta === 0
              ? "text-muted-foreground"
              : delta > 0
                ? "text-emerald-600"
                : "text-red-600",
          )}
        >
          {delta === null ? "новый показатель" : delta === 0 ? "без изменений" : `${delta > 0 ? "↑" : "↓"} ${Math.abs(delta)}% к прошлому периоду`}
        </p>
      )}
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

const TONES = {
  new: "bg-amber-50 text-amber-700 ring-amber-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  draft: "bg-stone-100 text-stone-600 ring-stone-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-[#1B3A6B]/[0.07] text-[#1B3A6B] ring-[#1B3A6B]/15",
  brand: "bg-primary/[0.08] text-primary ring-primary/20",
} as const;

export type Tone = keyof typeof TONES;

/** Компактная метка статуса — единый вид для «новое/отвечено/черновик/…». */
export function StatusBadge({
  tone = "info",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset [&>svg]:size-3",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * Пустое состояние: тихое, без рамки-«тревоги» — служебный текст не должен
 * спорить с рабочей зоной за внимание.
 */
export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-14 text-center">
      {icon && <span className="text-muted-foreground/40 [&>svg]:size-8">{icon}</span>}
      <p className="text-sm font-medium text-foreground/80">{title}</p>
      {children && <p className="max-w-sm text-[13px] text-muted-foreground">{children}</p>}
    </div>
  );
}
