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
} from "lucide-react";
import { countNewInquiries } from "@/lib/inquiries-db";
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
          <AdminNavLink href="/admin/inquiries" icon={<MessageSquare className="size-4" />} badge={newInquiries}>
            Обращения
          </AdminNavLink>
          <AdminNavLink
            href="/admin/verification"
            icon={<CalendarCheck className="size-4" />}
          >
            Сверка
          </AdminNavLink>
          <AdminNavLink href="/admin/share" icon={<Share2 className="size-4" />}>
            Поделились
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
