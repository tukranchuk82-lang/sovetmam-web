"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Sparkles, Mail, User } from "lucide-react";
import { Doodle } from "@/components/home/crayon-doodles";
import { NAV_DOODLE } from "@/components/home/icons";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  emoji: string;
  match: (p: string) => boolean;
};

const tabs: Tab[] = [
  {
    href: "/",
    label: "Главная",
    icon: Home,
    emoji: "🏠",
    match: (p) => p === "/" || p.startsWith("/segment"),
  },
  {
    href: "/catalog",
    label: "Каталог",
    icon: LayoutGrid,
    emoji: "🗂️",
    match: (p) => p.startsWith("/catalog"),
  },
  {
    href: "/podbor",
    label: "Подбор",
    icon: Sparkles,
    emoji: "⭐️",
    match: (p) => p.startsWith("/podbor"),
  },
  {
    href: "/profile/inquiries/new",
    label: "Обращение",
    icon: Mail,
    emoji: "✉️",
    match: (p) => p.startsWith("/profile/inquiries"),
  },
];

// Пятый слот меню: «Профиль» (по умолчанию) либо «Установить» (когда установка
// приложения возможна и оно ещё не стоит на устройстве).
const profileTab: Tab = {
  href: "/profile",
  label: "Профиль",
  icon: User,
  emoji: "🙎🏻",
  match: (p) =>
    (p.startsWith("/profile") && !p.startsWith("/profile/inquiries")) ||
    p.startsWith("/login"),
};

const navClasses =
  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium leading-none transition-all";

export function BottomNav({ background }: { background?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className="sm-bottom-nav relative z-20 shrink-0 rounded-t-3xl bg-brand shadow-[0_-6px_16px_-6px_rgba(0,0,0,0.25)] transition-[background] duration-300"
      // В fullscreen окно доходит до самого низа экрана: подкладываем safe-area,
      // иначе подписи вкладок налезают на зону системного жеста.
      style={
        {
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          ...(background ? { "--nav-bg": background } : {}),
        } as React.CSSProperties
      }
    >
      <div className="grid grid-cols-5">
        {tabs.map((t) => (
          <NavTab key={t.href} tab={t} active={t.match(pathname)} />
        ))}

        {/* Пятый слот — всегда «Профиль». Установка приложения предлагается
            отдельной всплывающей плашкой (InstallBanner), а не пунктом меню. */}
        <NavTab tab={profileTab} active={profileTab.match(pathname)} />
      </div>
    </nav>
  );
}

function NavTab({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      data-active={active}
      className={cn(
        navClasses,
        active ? "text-white" : "text-white/65 hover:text-white",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="sm-nav-indicator absolute -top-px h-0.5 w-8 rounded-b-full bg-white"
        />
      )}
      {/* Иконка: line-вариант (по умолчанию) + эмодзи (в теме «Яркий»). */}
      <Icon
        className={cn(
          "sm-nav-lucide size-5 transition-transform",
          active && "scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "sm-nav-emoji text-xl leading-none transition-transform",
          active && "scale-110",
        )}
      >
        {tab.emoji}
      </span>
      <Doodle
        name={NAV_DOODLE[tab.href]}
        className={cn(
          "sm-nav-doodle size-6 transition-transform",
          active && "scale-110",
        )}
      />
      <span className="mt-0.5">{tab.label}</span>
    </Link>
  );
}
