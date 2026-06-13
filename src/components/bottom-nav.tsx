"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs: {
  href: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
}[] = [
  {
    href: "/",
    label: "Главная",
    icon: Home,
    match: (p) => p === "/" || p.startsWith("/segment"),
  },
  {
    href: "/catalog",
    label: "Каталог",
    icon: LayoutGrid,
    match: (p) => p.startsWith("/catalog"),
  },
  {
    href: "/podbor",
    label: "Подбор",
    icon: Sparkles,
    match: (p) => p.startsWith("/podbor"),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: User,
    match: (p) => p.startsWith("/profile") || p.startsWith("/login"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-20 shrink-0 rounded-t-3xl bg-brand shadow-[0_-6px_16px_-6px_rgba(0,0,0,0.25)]">
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-all",
                active ? "text-white" : "text-white/65 hover:text-white",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute -top-px h-0.5 w-8 rounded-b-full bg-white"
                />
              )}
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  active && "scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]",
                )}
              />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
