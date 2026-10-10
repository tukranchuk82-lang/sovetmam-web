"use client";

import { Menu } from "@base-ui/react/menu";
import { ShieldCheck, Wrench, Landmark, UserRound, ChartNoAxesCombined, ChevronDown, Check } from "lucide-react";
import { switchViewMode } from "@/app/view-mode-actions";
import type { ViewMode } from "@/lib/view-mode";
import { cn } from "@/lib/utils";

const MODE_META: Record<ViewMode, { label: string; icon: React.ReactNode }> = {
  owner: { label: "Владелец", icon: <ShieldCheck className="size-3.5" /> },
  tech: { label: "Техспец", icon: <Wrench className="size-3.5" /> },
  coordinator: { label: "Координатор", icon: <Landmark className="size-3.5" /> },
  analyst: { label: "Аналитик", icon: <ChartNoAxesCombined className="size-3.5" /> },
  user: { label: "Пользователь", icon: <UserRound className="size-3.5" /> },
};

/**
 * Переключатель режима просмотра — виден владельцу, техспецу и координатору.
 *
 * Выпадающий список, а не ряд кнопок: значков одних мало, чтобы с одного
 * взгляда понять, какая роль есть какая, а всплывающая подсказка по
 * наведению на телефоне не срабатывает — там нет курсора, только тап. Список
 * открывается по тому же тапу и показывает названия ролей текстом.
 *
 * `available` — какие режимы показывать (см. ALLOWED_VIEW_MODES в
 * lib/view-mode.ts: у координатора это «координатор» и «пользователь», у
 * владельца/техспеца — все четыре). Само право переключиться сервер всё
 * равно проверяет заново в switchViewMode — этот список только про то, что
 * рисовать, не про то, что разрешено.
 *
 * Адреса назначения — УТВЕРЖДЕНО, больше не менять без явной просьбы:
 * «Пользователь» всегда ведёт в личный кабинет (/profile), откуда бы ни
 * переключали, а не на главную страницу приложения. Кнопки рабочих ролей
 * (владелец/техспец/координатор) всегда ведут в админку — там настоящий
 * сайдбар с разделами, в узком личном кабинете ему просто негде поместиться.
 */
export function ViewModeSwitch({
  mode,
  available,
  className,
}: {
  mode: ViewMode;
  available: ViewMode[];
  className?: string;
}) {
  const current = MODE_META[mode];

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-800 shadow-sm transition-colors hover:bg-emerald-200",
          className,
        )}
      >
        {current.icon}
        {current.label}
        <ChevronDown className="size-3 opacity-60" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50 outline-none">
          <Menu.Popup className="min-w-[190px] rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_18px_44px_-14px_rgba(16,29,56,0.4)] outline-none transition-[transform,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {available.map((target) => {
              const active = target === mode;
              const meta = MODE_META[target];
              return (
                <Menu.Item
                  key={target}
                  onClick={() => {
                    void switchViewMode(target, target === "user" ? undefined : "/admin");
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium outline-none",
                    active
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-[#1A1A1A] data-[highlighted]:bg-muted",
                  )}
                >
                  {meta.icon}
                  {meta.label}
                  {active && <Check className="ml-auto size-4" />}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
