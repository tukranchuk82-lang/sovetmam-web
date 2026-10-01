import { redirect } from "next/navigation";
import { Eye, Info } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { getViewsReport } from "@/lib/analytics/views";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { AreaChart } from "@/components/admin/ui/charts";
import { EmptyState, StatCard } from "@/components/admin/ui/primitives";
import { MeasureViewsTable } from "@/components/admin/measure-views-table";

export const metadata = { title: "Что смотрят" };
export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export default async function AdminViewsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/views");
  if (effectiveAdminScope(staff.role, await getViewMode(staff.role)) === "coordinator") redirect("/admin");

  const period = parsePeriod((await searchParams).period);
  const r = await getViewsReport(period);

  return (
    <AdminPage
      icon={<Eye />}
      title="Что смотрят"
      description="Какие меры люди открывают чаще всего и как это связано с сохранением в избранное."
      actions={<PeriodTabs value={period.key} basePath="/admin/views" />}
    >
      {r.since && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[12.5px] text-muted-foreground">
          <Info className="size-3.5" />
          Просмотры считаются с {fmtDate(r.since)} — раньше их не записывали.
        </p>
      )}

      {r.views.value === 0 && !r.since ? (
        <div className="rounded-2xl border bg-card">
          <EmptyState icon={<Eye />} title="Пока нет ни одного просмотра">
            Учёт включён: как только люди начнут открывать карточки мер, здесь появятся цифры. Историю до сегодняшнего дня
            восстановить нельзя.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Просмотров мер" value={r.views.value} delta={period.days ? r.views.delta : undefined} tone="accent" />
            <StatCard label="Разных людей" value={r.people.value} delta={period.days ? r.people.delta : undefined} />
            <StatCard label="Разных мер открывали" value={r.measures} />
          </div>

          <section className="mt-4 rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
            <h2 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Просмотры по дням</h2>
            <AreaChart data={r.perDay} unit=" просм." />
          </section>

          <MeasureViewsTable rows={r.top} />
        </>
      )}
    </AdminPage>
  );
}
