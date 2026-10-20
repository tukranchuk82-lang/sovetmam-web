import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { getMeasureStatusReport } from "@/lib/analytics/measure-status";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { StatCard } from "@/components/admin/ui/primitives";
import { MeasureStatusTable } from "@/components/admin/measure-status-table";

export const metadata = { title: "Оформление мер" };
export const dynamic = "force-dynamic";

export default async function MeasureStatusPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/measure-status");
  // Сводка по всем мерам — для владельца, техспеца и аналитика.
  if (effectiveAdminScope(staff.role, await getViewMode(staff.role)) === "coordinator") redirect("/admin");

  const period = parsePeriod((await searchParams).period, "all");
  const r = await getMeasureStatusReport(period);

  return (
    <AdminPage
      icon={<ClipboardCheck />}
      title="Оформление мер"
      description="Люди отмечают рядом с мерами в своей подборке: пользуюсь, не подавал(а) или отказали. Так видно, где мера доходит до человека, а где её не подают или отказывают."
      actions={<PeriodTabs value={period.key} basePath="/admin/measure-status" />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ответов" value={r.answers} hint={`Ответили людей: ${r.people}`} />
        <StatCard label="Пользуются" value={r.using} tone="accent" />
        <StatCard label="Не подавали" value={r.notApplied} />
        <StatCard
          label="Отказали"
          value={r.refused}
          tone={r.refused > 0 ? "warn" : "default"}
          hint={r.refusedPct !== null ? `${r.refusedPct}% среди подавших` : undefined}
        />
      </div>

      <div className="mt-5">
        <MeasureStatusTable rows={r.rows} />
      </div>
    </AdminPage>
  );
}
