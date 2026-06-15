"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Sparkles, Mail, User } from "lucide-react";
import { Doodle } from "@/components/home/crayon-doodles";
import { NAV_DOODLE } from "@/components/home/icons";
import { cn } from "@/lib/utils";

const tabs: {
  href: string;
  label: string;
  icon: typeof Home;
  emoji: string;
  match: (p: string) => boolean;
}[] = [
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
  {
    href: "/profile",
    label: "Профиль",
    icon: User,
    emoji: "🙎🏻",
    match: (p) =>
      (p.startsWith("/profile") && !p.startsWith("/profile/inquiries")) ||
      p.startsWith("/login"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm-bottom-nav relative z-20 shrink-0 rounded-t-3xl bg-brand shadow-[0_-6px_16px_-6px_rgba(0,0,0,0.25)]">
      <div className="grid grid-cols-5">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              data-active={active}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium leading-none transition-all",
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
                {t.emoji}
              </span>
              <Doodle
                name={NAV_DOODLE[t.href]}
                className={cn(
                  "sm-nav-doodle size-6 transition-transform",
                  active && "scale-110",
                )}
              />
              <span className="mt-0.5">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
