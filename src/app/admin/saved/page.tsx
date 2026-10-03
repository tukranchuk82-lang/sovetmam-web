import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { getSavedReport } from "@/lib/analytics/saved";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { AreaChart, BarList } from "@/components/admin/ui/charts";
import { StatCard } from "@/components/admin/ui/primitives";

export const metadata = { title: "Избранное" };
export const dynamic = "force-dynamic";

export default async function AdminSavedPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/saved");
  if (effectiveAdminScope(staff.role, await getViewMode(staff.role)) === "coordinator") redirect("/admin");

  const period = parsePeriod((await searchParams).period);
  const r = await getSavedReport(period);
  const usage = r.totalPeople ? Math.round((r.usersWithSaved / r.totalPeople) * 100) : 0;

  return (
    <AdminPage
      icon={<Heart />}
      title="Избранное"
      description="Какие меры люди сохраняют себе и сколько человек вообще пользуется избранным."
      actions={<PeriodTabs value={period.key} basePath="/admin/saved" />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Сохранений за период"
          value={r.savedNow.value}
          delta={period.days ? r.savedNow.delta : undefined}
          tone="accent"
          hint={`Всего за всё время: ${r.totalSaved}`}
        />
        <StatCard label="Людей сохраняли" value={r.people.value} delta={period.days ? r.people.delta : undefined} />
        <StatCard label="Пользуются избранным" value={r.usersWithSaved} hint={`${usage}% всех людей`} />
        <StatCard label="Людей в базе" value={r.totalPeople} />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-5">
        <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)] lg:col-span-3">
          <h2 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Сохранения по дням</h2>
          <AreaChart data={r.perDay} unit=" сохр." />
        </section>
        <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)] lg:col-span-2">
          <h2 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Топ мер</h2>
          <BarList
            items={r.top.map((t) => ({ label: t.title, value: t.value, hint: t.people > 1 ? `· ${t.people} чел.` : undefined, href: t.href }))}
            max={12}
            emptyText="За этот период ничего не сохраняли"
          />
        </section>
      </div>
    </AdminPage>
  );
}
