"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Строка навигации админки — сайдбар на широком экране и узкий бар-иконки
 * на телефоне (см. MobileAdminRail) используют один и тот же компонент:
 * активный пункт — светлая подложка и бордовая полоска слева.
 *
 * `collapsed` — только у бара-иконок: подпись остаётся в разметке (её видит
 * читалка с экрана), но визуально скрыта, а бейдж переезжает точкой на
 * иконку — иначе цифра бы просто обрубалась по ширине.
 */
export function AdminNavLink({
  href,
  icon,
  children,
  badge,
  exact,
  collapsed = false,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
  exact?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  const hasBadge = badge !== undefined && badge > 0;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? String(children) : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white",
        collapsed && "justify-center px-0",
        active &&
          (collapsed
            ? "bg-white/[0.09] font-semibold text-white"
            : "-ml-[3px] border-l-[3px] border-[#B9384A] bg-white/[0.09] pl-2 font-semibold text-white"),
      )}
    >
      <span className="relative shrink-0 [&>svg]:size-[17px]">
        {icon}
        {collapsed && hasBadge && (
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#B9384A] ring-2 ring-[#101A30]" />
        )}
      </span>
      <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{children}</span>
      {!collapsed && hasBadge && (
        <span className="inline-flex h-[19px] min-w-[19px] shrink-0 items-center justify-center rounded-full bg-[#B9384A] px-1 text-[10.5px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
