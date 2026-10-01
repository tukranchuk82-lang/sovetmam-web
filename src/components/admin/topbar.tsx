"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

/**
 * Верхняя полоса админки: где я сейчас (раздел из меню) слева, управление
 * режимом просмотра справа. Раньше здесь была одна зелёная пилюля без
 * подписи — из шапки нельзя было понять ни раздел, ни что это за пилюля.
 */
export function AdminTopbar({
  sections,
  children,
}: {
  sections: { href: string; label: string }[];
  children?: React.ReactNode;
}) {
  const pathname = usePathname();

  // Самый длинный совпавший адрес: /admin/measures/abc → «Каталог мер».
  const current = sections
    .filter((s) => (s.href === "/admin" ? pathname === "/admin" : pathname.startsWith(s.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="sticky top-0 z-10 flex h-[52px] items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8">
      <nav aria-label="Где я" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="hidden text-muted-foreground sm:inline">Админ-панель</span>
        <ChevronRight className="hidden size-3.5 text-muted-foreground/60 sm:inline" />
        <span className="truncate font-semibold text-foreground">{current?.label ?? "Раздел"}</span>
      </nav>
      <div className="flex shrink-0 items-center gap-2.5">{children}</div>
    </div>
  );
}
