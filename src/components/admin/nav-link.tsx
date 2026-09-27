"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Пункт навигации админки — два вида разметки под один и тот же набор
 * данных (href/иконка/подпись/бейдж), чтобы список пунктов не приходилось
 * писать дважды для телефона и широкого экрана:
 *
 * - "pill" — таблетка в горизонтальном ряду (телефон, узкий экран).
 * - "sidebar" — строка на всю ширину тёмного сайдбара (широкий экран):
 *   активный пункт — светлая подложка и бордовая полоска слева.
 */
export function AdminNavLink({
  href,
  icon,
  children,
  badge,
  exact,
  variant = "pill",
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
  exact?: boolean;
  variant?: "pill" | "sidebar";
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white",
          active &&
            "-ml-[3px] border-l-[3px] border-[#B9384A] bg-white/[0.09] pl-2 font-semibold text-white",
        )}
      >
        <span className="shrink-0 [&>svg]:size-[17px]">{icon}</span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {badge !== undefined && badge > 0 && (
          <span className="inline-flex h-[19px] min-w-[19px] shrink-0 items-center justify-center rounded-full bg-[#B9384A] px-1 text-[10.5px] font-bold text-white">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "bg-background hover:bg-muted",
      )}
    >
      {icon}
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
