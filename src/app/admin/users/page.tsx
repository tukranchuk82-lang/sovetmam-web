import { Download, Users } from "lucide-react";
import { listAppUsersForAdmin, computeUsersStats } from "@/lib/users-admin";
import { UsersList } from "@/components/admin/users-list";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Пользователи" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await listAppUsersForAdmin();
  const stats = computeUsersStats(users);

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<Users />}
        title="Пользователи"
        description="Все, кто зарегистрировался в приложении. Свежие — сверху."
        action={
          <a
            href="/admin/users/export"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Download className="size-3.5" />
            CSV
          </a>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Всего" value={stats.total} />
        <Stat label="За 7 дней" value={stats.last7days} accent />
        <Stat label="Подтвердили почту" value={stats.verified} />
        <Stat label="Заполнили анкету" value={stats.withSurvey} />
      </div>

      <div className="mt-2 rounded-xl border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        Мессенджер подключили: <b className="text-foreground">{stats.withMessenger}</b>
        {" · "}Telegram {stats.byChannel.telegram}
        {" · "}VK {stats.byChannel.vk}
        {" · "}MAX {stats.byChannel.max}
      </div>

      <UsersList users={users} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card px-3 py-2.5">
      <p
        className={
          accent
            ? "text-2xl font-extrabold leading-none text-brand"
            : "text-2xl font-extrabold leading-none"
        }
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
