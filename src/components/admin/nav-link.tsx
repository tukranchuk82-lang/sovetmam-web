"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNavLink({
  href,
  icon,
  children,
  badge,
  exact,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

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
