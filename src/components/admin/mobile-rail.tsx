"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Landmark, LogOut } from "lucide-react";
import { AdminNavLink } from "@/components/admin/nav-link";
import { OrgName } from "@/components/org-name";
import { cn } from "@/lib/utils";

export interface NavGroup {
  title?: string;
  items: RailNavItem[];
}

export interface RailNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  exact?: boolean;
}

const SIDEBAR_BG = "linear-gradient(180deg, #16233F 0%, #101A30 100%)";

/**
 * Левый бар навигации на телефоне — узкая полоска с одними иконками
 * («как в десктопной, но узкая»). Разворачивается на половину экрана,
 * когда по нему или по стрелочке внутри нажали, — тогда видно подписи,
 * ровно как в сайдбаре на широком экране. Сворачивается обратно по стрелочке,
 * по тёмной подложке за краем панели или сам, когда открыли другую страницу
 * (иначе так и оставался бы развёрнутым поверх следующего экрана).
 */
export function MobileAdminRail({
  groups,
  region,
  userInitials,
  userName,
  userRoleLabel,
  logoutAction,
}: {
  groups: NavGroup[];
  region?: string | null;
  userInitials: string;
  userName: string;
  userRoleLabel: string;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Открыли другую страницу — сворачиваем панель. Не через эффект: React
  // сам рекомендует подгонять состояние под смену пропа прямо в теле
  // рендера (сравнение с предыдущим значением), а не setState в useEffect —
  // тот лишний повторный рендер только замедлил бы дело.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Пока панель открыта, страница за ней не должна прокручиваться и
  // случайно нажиматься сквозь подложку.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[1px] md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col overflow-hidden py-4 transition-[width] duration-200 ease-out md:hidden",
          open ? "w-[min(78vw,300px)] px-3.5" : "w-14 px-1.5",
        )}
        style={{ background: SIDEBAR_BG }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Свернуть меню" : "Развернуть меню"}
          className={cn(
            "flex shrink-0 items-center gap-2.5 rounded-lg px-1.5 py-1.5",
            !open && "justify-center",
          )}
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#8E1D2C] transition-transform",
              open && "rotate-180",
            )}
          >
            <ChevronRight className="size-4 text-white" strokeWidth={2.4} />
          </span>
          {open && (
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-wider text-white/45">
                Админ-панель{region ? ` · ${region}` : ""}
              </span>
              <Link
                href="/admin"
                onClick={(e) => e.stopPropagation()}
                className="block truncate font-bold leading-tight text-white hover:text-white/85"
              >
                <OrgName />
              </Link>
            </span>
          )}
        </button>

        {!open && (
          <span className="mx-auto mt-1 grid size-8 shrink-0 place-items-center rounded-[9px] bg-white/[0.08]" aria-hidden>
            <Landmark className="size-4 text-white/70" strokeWidth={1.8} />
          </span>
        )}

        <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-0.5">
              {gi > 0 && <div className="my-2.5 h-px shrink-0 bg-white/10" />}
              {group.title && open && (
                <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => (
                <AdminNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  badge={item.badge}
                  exact={item.exact}
                  collapsed={!open}
                >
                  {item.label}
                </AdminNavLink>
              ))}
            </div>
          ))}
        </nav>

        <div
          className={cn(
            "mt-3 flex shrink-0 items-center gap-2.5 border-t border-white/10 px-2 pt-3.5",
            !open && "justify-center px-0",
          )}
        >
          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-white/[0.14] text-[11px] font-bold text-white">
            {userInitials}
          </span>
          {open && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-white">{userName}</p>
                <p className="text-[11px] text-white/50">{userRoleLabel}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Выйти"
                  className="grid size-[30px] shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/[0.1] hover:text-white"
                >
                  <LogOut className="size-4" strokeWidth={1.8} />
                </button>
              </form>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
