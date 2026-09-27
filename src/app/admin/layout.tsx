import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutGrid,
  MessageSquare,
  FolderInput,
  Share2,
  CalendarCheck,
  Users,
  Gauge,
  Inbox,
  HelpCircle,
  Landmark,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { countNewInquiries } from "@/lib/inquiries-db";
import { countNewBotHelpRequests } from "@/lib/bot-help";
import { countOpenDisputes } from "@/lib/measure-disputes";
import { getCurrentStaff } from "@/lib/user-session";
import { ALLOWED_VIEW_MODES, effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { AdminNavLink } from "@/components/admin/nav-link";
import { ViewModeSwitch } from "@/components/view-mode-switch";
import { OrgName } from "@/components/org-name";

export const metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Доступ для владельца, техспеца и координатора. Остальных — на вход (там
  // уже залогиненного, но не-сотрудника, перекинет в личный кабинет).
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin");

  const mode = await getViewMode(staff.role);
  const scope = effectiveAdminScope(staff.role, mode);
  // У владельца/техспеца, пробующих режим координатора «на себе», региона
  // нет — тогда координаторский экран показывает данные по всем регионам
  // разом, а не пустоту.
  const region = scope === "coordinator" ? staff.region : null;

  const newInquiries = await countNewInquiries(scope === "coordinator" ? (region ?? undefined) : undefined);
  // Заявки на кабинет и спорные меры — общая, не региональная очередь.
  const newRequests = scope !== "coordinator" ? await countNewBotHelpRequests() : 0;
  const openDisputes = scope !== "coordinator" ? await countOpenDisputes() : 0;

  return (
    <div
      data-admin-theme="city"
      className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col bg-background text-foreground shadow-2xl"
    >
      <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Админ-панель
              {scope === "coordinator" && region ? ` · ${region}` : ""}
            </p>
            <Link
              href="/admin"
              className="block truncate font-bold leading-none hover:text-primary"
            >
              <OrgName />
            </Link>
          </div>
          {/* Переключатель режима: у владельца/техспеца — все роли, у
              координатора — только «Координатор» и «Пользователь». */}
          <ViewModeSwitch
            mode={mode}
            available={ALLOWED_VIEW_MODES[staff.role]}
            className="shrink-0"
            userTo="/"
          />
        </div>

        <nav className="mt-3 flex flex-wrap gap-1.5">
          {scope === "coordinator" ? (
            <>
              <AdminNavLink href="/admin" icon={<Gauge className="size-4" />} exact>
                Сводка
              </AdminNavLink>
              <AdminNavLink
                href="/admin/inquiries"
                icon={<MessageSquare className="size-4" />}
                badge={newInquiries}
              >
                Обращения
              </AdminNavLink>
              <AdminNavLink href="/admin/measures" icon={<LayoutGrid className="size-4" />}>
                Меры региона
              </AdminNavLink>
              <AdminNavLink href="/admin/region-survey" icon={<Users className="size-4" />}>
                Анкеты региона
              </AdminNavLink>
              <AdminNavLink href="/admin/region-saved" icon={<Heart className="size-4" />}>
                Избранное региона
              </AdminNavLink>
            </>
          ) : (
            <>
              <AdminNavLink href="/admin" icon={<Gauge className="size-4" />} exact>
                Сводка
              </AdminNavLink>
              <AdminNavLink href="/admin/measures" icon={<LayoutGrid className="size-4" />}>
                Каталог мер
              </AdminNavLink>
              <AdminNavLink href="/admin/users" icon={<Users className="size-4" />}>
                Пользователи
              </AdminNavLink>
              <AdminNavLink href="/admin/representatives" icon={<Landmark className="size-4" />}>
                Координаторы в регионах
              </AdminNavLink>
              <AdminNavLink href="/admin/inquiries" icon={<MessageSquare className="size-4" />} badge={newInquiries}>
                Обращения
              </AdminNavLink>
              <AdminNavLink href="/admin/requests" icon={<Inbox className="size-4" />} badge={newRequests}>
                Заявки на кабинет
              </AdminNavLink>
              <AdminNavLink
                href="/admin/verification"
                icon={<CalendarCheck className="size-4" />}
              >
                Сверка
              </AdminNavLink>
              <AdminNavLink
                href="/admin/disputes"
                icon={<HelpCircle className="size-4" />}
                badge={openDisputes}
              >
                Спорные меры
              </AdminNavLink>
              <AdminNavLink href="/admin/share" icon={<Share2 className="size-4" />}>
                Откуда приходят
              </AdminNavLink>
              <AdminNavLink href="/admin/knowledge" icon={<FolderInput className="size-4" />}>
                База знаний
              </AdminNavLink>
              {/* Управление ролями — технический раздел: аккаунты
                  координаторов, техспецов, передача прав владельца. Видно
                  только в режиме техспеца; владелец доберётся сюда, переключившись. */}
              {scope === "tech" && (
                <AdminNavLink href="/admin/staff" icon={<ShieldCheck className="size-4" />}>
                  Доступ и роли
                </AdminNavLink>
              )}
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
