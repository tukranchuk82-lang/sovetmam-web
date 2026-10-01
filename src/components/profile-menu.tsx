"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { UserRound, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Аватар в шапке — теперь не прямая ссылка в профиль, а выпадающее меню:
 * «Перейти в профиль» / «Выйти из профиля». Первый клик открывает выбор,
 * а не сразу уводит со страницы.
 */
export function ProfileMenu({
  avatarSlot,
  showHint,
  logoutAction,
}: {
  avatarSlot: React.ReactNode;
  showHint: boolean;
  logoutAction: () => Promise<void>;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Личный кабинет"
        className="pointer-events-auto relative shrink-0 rounded-full p-[2px] shadow-[0_3px_10px_-2px_rgba(0,0,0,0.5)] transition-transform active:scale-95"
        style={{ background: "linear-gradient(135deg, #E7B65A 0%, #8E1D2C 100%)" }}
      >
        <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-white">
          {avatarSlot}
        </span>
        {showHint && (
          <span
            className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full bg-[#E4374B] ring-2 ring-white"
            aria-label="Есть непрочитанное в личном кабинете"
          />
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={10} className="z-50 outline-none">
          <Menu.Popup className="min-w-[210px] origin-[var(--transform-origin)] rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_18px_44px_-14px_rgba(16,29,56,0.4)] outline-none transition-[transform,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Menu.Item
              render={<Link href="/profile" />}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#1A1A1A] outline-none",
                "data-[highlighted]:bg-muted",
              )}
            >
              <UserRound className="size-4 text-muted-foreground" />
              Перейти в профиль
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                void logoutAction();
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#8E1D2C] outline-none",
                "data-[highlighted]:bg-[#8E1D2C]/[0.06]",
              )}
            >
              <LogOut className="size-4" />
              Выйти из профиля
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
