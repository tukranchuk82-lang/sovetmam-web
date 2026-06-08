import Link from "next/link";
import { LayoutGrid, MessageSquare, FolderInput, ArrowLeft } from "lucide-react";
import { getAdminTheme } from "@/lib/admin-theme";
import { countNewInquiries } from "@/lib/inquiries-db";
import { AdminThemeSwitcher } from "@/components/admin/theme-switcher";
import { AdminNavLink } from "@/components/admin/nav-link";

export const metadata = {
  title: "Админ-панель",
  // Без авторизации админка открыта по URL — закрываем от поисковиков.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getAdminTheme();
  const newInquiries = await countNewInquiries();

  return (
    <div
      data-admin-theme={theme}
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
              Совет матерей
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <AdminThemeSwitcher current={theme} />
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs hover:bg-muted"
            >
              <ArrowLeft className="size-3" />
              В кабинет
            </Link>
          </div>
        </div>

        <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto">
          <AdminNavLink href="/admin/inquiries" icon={<MessageSquare className="size-4" />} badge={newInquiries}>
            Обращения
          </AdminNavLink>
          <AdminNavLink href="/admin/knowledge" icon={<FolderInput className="size-4" />}>
            База знаний
          </AdminNavLink>
          <AdminNavLink href="/admin" icon={<LayoutGrid className="size-4" />} exact>
            Каталог мер
          </AdminNavLink>
        </nav>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
