import { ShieldCheck, UserRound } from "lucide-react";
import { switchViewMode } from "@/app/view-mode-actions";
import type { ViewMode } from "@/lib/view-mode";
import { cn } from "@/lib/utils";

/**
 * Переключатель «Пользователь ↔ Администратор» — виден только владельцу и
 * техспецу. Сделан на server action без клиентского JS: две кнопки в одной
 * форме, каждая со своим formAction.
 */
export function ViewModeSwitch({
  mode,
  className,
}: {
  mode: ViewMode;
  className?: string;
}) {
  return (
    <form className={cn("inline-flex gap-0.5 rounded-xl border bg-muted/50 p-0.5", className)}>
      <ModeButton
        target="admin"
        current={mode}
        icon={<ShieldCheck className="size-3.5" />}
        label="Администратор"
      />
      <ModeButton
        target="user"
        current={mode}
        icon={<UserRound className="size-3.5" />}
        label="Пользователь"
      />
    </form>
  );
}

function ModeButton({
  target,
  current,
  icon,
  label,
}: {
  target: ViewMode;
  current: ViewMode;
  icon: React.ReactNode;
  label: string;
}) {
  const active = current === target;
  return (
    <button
      type="submit"
      formAction={switchViewMode.bind(null, target)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
