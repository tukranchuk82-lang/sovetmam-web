import { ShieldCheck, Wrench, Landmark, UserRound } from "lucide-react";
import { switchViewMode, type ViewLanding } from "@/app/view-mode-actions";
import { defaultViewMode, type ViewMode } from "@/lib/view-mode";
import type { AppRole } from "@/lib/onboarding-db";
import { cn } from "@/lib/utils";

const MODE_META: Record<ViewMode, { label: string; icon: React.ReactNode }> = {
  owner: { label: "Владелец", icon: <ShieldCheck className="size-3.5" /> },
  tech: { label: "Техспец", icon: <Wrench className="size-3.5" /> },
  coordinator: { label: "Координатор", icon: <Landmark className="size-3.5" /> },
  user: { label: "Пользователь", icon: <UserRound className="size-3.5" /> },
};

/**
 * Переключатель режима просмотра — виден владельцу, техспецу и координатору.
 * Сделан на server action без клиентского JS: по кнопке на каждый доступный
 * режим в одной форме, у каждой свой formAction.
 *
 * `available` — какие режимы показывать (см. ALLOWED_VIEW_MODES в
 * lib/view-mode.ts: у координатора это «координатор» и «пользователь», у
 * владельца/техспеца — все четыре). Само право переключиться сервер всё
 * равно проверяет заново в switchViewMode — этот список только про то, что
 * рисовать, не про то, что разрешено.
 *
 * `userTo` — куда вести по кнопке «Пользователь». Из админки это главная
 * страница (то, что видит обычный человек), из личного кабинета — он сам.
 */
export function ViewModeSwitch({
  mode,
  available,
  className,
  userTo,
}: {
  mode: ViewMode;
  available: ViewMode[];
  className?: string;
  userTo?: ViewLanding;
}) {
  return (
    <form className={cn("inline-flex flex-wrap gap-0.5 rounded-xl border bg-muted/50 p-0.5", className)}>
      {available.map((target) => (
        <ModeButton
          key={target}
          target={target}
          current={mode}
          to={target === "user" ? userTo : "/admin"}
          {...MODE_META[target]}
        />
      ))}
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
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-xs font-medium transition-colors",
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
 * владельцу, техспецу и координатору (решает серверный layout: обычному
 * человеку кнопка не рисуется вовсе, а сам action всё равно проверяет роль).
 *
 * Круглая и без подписи: в шапке рядом с названием и аватаркой места мало, а
 * на узких телефонах подпись вытолкнула бы название на вторую строку.
 */
export function AdminEntryButton({ role }: { role: AppRole }) {
  return (
    <form
      action={switchViewMode.bind(null, defaultViewMode(role), "/admin")}
      className="pointer-events-auto shrink-0"
    >
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
