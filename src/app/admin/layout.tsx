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
} from "lucide-react";
import { countNewInquiries } from "@/lib/inquiries-db";
import { countNewBotHelpRequests } from "@/lib/bot-help";
import { countOpenDisputes } from "@/lib/measure-disputes";
import { getCurrentAdmin } from "@/lib/user-session";
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
  // Доступ только для владельца/техспеца. Остальных — на вход (там уже
  // залогиненного, но не-админа, перекинет в личный кабинет).
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin");

  const newInquiries = await countNewInquiries();
  // Заявки на кабинет: человек написал боту и ждёт входа — кружок в меню
  // нужен не меньше, чем у обращений.
  const newRequests = await countNewBotHelpRequests();
  const openDisputes = await countOpenDisputes();

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
            </p>
            <Link
              href="/admin"
              className="block truncate font-bold leading-none hover:text-primary"
            >
              <OrgName />
            </Link>
          </div>
          {/* Переключатель режима: уводит в личный кабинет и запоминает выбор,
              чтобы кабинет открывался как у обычного пользователя. */}
          <ViewModeSwitch mode="admin" className="shrink-0" />
        </div>

        <nav className="mt-3 flex flex-wrap gap-1.5">
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
            Представители в регионах
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
        </nav>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
