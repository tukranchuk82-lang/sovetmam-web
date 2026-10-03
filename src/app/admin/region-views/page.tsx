import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { getViewsReport } from "@/lib/analytics/views";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { ViewsReportBody } from "@/components/admin/views-report-body";

export const metadata = { title: "Что смотрят" };
export const dynamic = "force-dynamic";

/** «Что смотрят» для координатора: интерес людей его региона к мерам. */
export default async function RegionViewsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/region-views");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  if (scope !== "coordinator") redirect("/admin");

  const region = await resolveRegion(staff, scope);
  const period = parsePeriod((await searchParams).period);
  const r = await getViewsReport(period, region);

  return (
    <AdminPage
      icon={<Eye />}
      title="Что смотрят"
      description={
        region
          ? `Какие меры открывают люди из региона «${region}»: откуда приходят, сколько читают, что нажимают. Считаются те, кто указал регион в анкете или в приложении.`
          : "Какие меры открывают люди из всех регионов."
      }
      actions={<PeriodTabs value={period.key} basePath="/admin/region-views" />}
    >
      <ViewsReportBody r={r} showDelta={Boolean(period.days)} />
    </AdminPage>
  );
}
