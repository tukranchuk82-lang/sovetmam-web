import { redirect } from "next/navigation";
import { Map } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { getRegionsReport } from "@/lib/analytics/regions";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { StatCard } from "@/components/admin/ui/primitives";
import { RegionsTable } from "@/components/admin/regions-table";

export const metadata = { title: "Регионы" };
export const dynamic = "force-dynamic";

export default async function AdminRegionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/regions");
  // Сравнение всех регионов — для владельца и техспеца; координатору доступен только свой срез.
  if (effectiveAdminScope(staff.role, await getViewMode(staff.role)) === "coordinator") redirect("/admin");

  const period = parsePeriod((await searchParams).period);
  const report = await getRegionsReport(period);
  const withRegionPct = report.totals.people ? Math.round((report.withRegion / report.totals.people) * 100) : 0;

  return (
    <AdminPage
      icon={<Map />}
      title="Регионы"
      description="Сколько людей в каждом регионе и сколько обращений они оставляют. Регион человека — тот, что он указал в анкете подбора."
      actions={<PeriodTabs value={period.key} basePath="/admin/regions" />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Людей всего" value={report.totals.people} />
        <StatCard
          label="С указанным регионом"
          value={report.withRegion}
          hint={`${withRegionPct}% от всех`}
          tone="accent"
        />
        <StatCard label={`Обращений · ${period.label.toLowerCase()}`} value={report.totals.inquiries} />
        <StatCard
          label="Обращений без ответа"
          value={report.totals.unanswered}
          tone={report.totals.unanswered > 0 ? "warn" : "default"}
        />
      </div>

      <div className="mt-5">
        <RegionsTable rows={report.rows} periodLabel={period.label} />
      </div>
    </AdminPage>
  );
}
