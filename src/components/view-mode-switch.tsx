import { ShieldCheck, UserRound } from "lucide-react";
import { switchViewMode, type ViewLanding } from "@/app/view-mode-actions";
import type { ViewMode } from "@/lib/view-mode";
import { cn } from "@/lib/utils";

/**
 * Переключатель «Пользователь ↔ Администратор» — виден только владельцу и
 * техспецу. Сделан на server action без клиентского JS: две кнопки в одной
 * форме, каждая со своим formAction.
 *
 * `userTo` — куда вести по кнопке «Пользователь». Из админки это главная
 * страница (то, что видит обычный человек), из личного кабинета — он сам.
 */
export function ViewModeSwitch({
  mode,
  className,
  userTo,
}: {
  mode: ViewMode;
  className?: string;
  userTo?: ViewLanding;
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
        to={userTo}
        icon={<UserRound className="size-3.5" />}
        label="Пользователь"
      />
    </form>
  );
}

function ModeButton({
  target,
  current,
  to,
  icon,
  label,
}: {
  target: ViewMode;
  current: ViewMode;
  to?: ViewLanding;
  icon: React.ReactNode;
  label: string;
}) {
  const active = current === target;
  return (
    <button
      type="submit"
      formAction={switchViewMode.bind(null, target, to)}
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

/**
 * Кнопка входа в админку в шапке пользовательского приложения — видна только
 * владельцу и техспецу (решает серверный layout: обычному человеку кнопка не
 * рисуется вовсе, а сам action всё равно проверяет роль).
 *
 * Круглая и без подписи: в шапке рядом с названием и аватаркой места мало, а
 * на узких телефонах подпись вытолкнула бы название на вторую строку.
 */
export function AdminEntryButton() {
  return (
    <form action={switchViewMode.bind(null, "admin", "/admin")} className="pointer-events-auto shrink-0">
      <button
        type="submit"
        title="Перейти в админ-панель"
        aria-label="Перейти в админ-панель"
        className="grid size-11 place-items-center rounded-full border border-white/50 bg-white/25 text-white backdrop-blur-sm transition-transform active:scale-95"
      >
        <ShieldCheck className="size-[22px]" strokeWidth={1.8} />
      </button>
    </form>
  );
}
