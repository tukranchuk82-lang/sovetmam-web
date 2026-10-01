import { Download, Users } from "lucide-react";
import { listAppUsersForAdmin, computeUsersStats } from "@/lib/users-admin";
import { UsersList } from "@/components/admin/users-list";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { StatCard } from "@/components/admin/ui/primitives";

export const metadata = { title: "Пользователи" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await listAppUsersForAdmin();
  const stats = computeUsersStats(users);

  return (
    <AdminPage
      icon={<Users />}
      title="Пользователи"
      description="Все, кто зарегистрировался в приложении. Нажмите на строку — справа откроются подробности."
      actions={
        <a
          href="/admin/users/export"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium shadow-[0_1px_2px_rgba(32,36,44,0.04)] transition-colors hover:bg-muted"
        >
          <Download className="size-3.5" />
          Выгрузить CSV
        </a>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Всего" value={stats.total} />
        <StatCard label="За 7 дней" value={stats.last7days} tone="accent" />
        <StatCard label="Подтвердили почту" value={stats.verified} />
        <StatCard label="Заполнили анкету" value={stats.withSurvey} />
        <StatCard
          label="Подключили мессенджер"
          value={stats.withMessenger}
          hint={`Telegram ${stats.byChannel.telegram} · VK ${stats.byChannel.vk} · MAX ${stats.byChannel.max}`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="mt-5">
        <UsersList users={users} />
      </div>
    </AdminPage>
  );
}
