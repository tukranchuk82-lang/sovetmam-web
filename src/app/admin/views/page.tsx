import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { getViewsReport } from "@/lib/analytics/views";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { RegionFilter } from "@/components/admin/region-filter";
import { ViewsReportBody } from "@/components/admin/views-report-body";

export const metadata = { title: "Что смотрят" };
export const dynamic = "force-dynamic";

export default async function AdminViewsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; region?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/views");
  if (effectiveAdminScope(staff.role, await getViewMode(staff.role)) === "coordinator") redirect("/admin");

  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const region = sp.region || null;
  const r = await getViewsReport(period, region);

  return (
    <AdminPage
      icon={<Eye />}
      title="Что смотрят"
      description="Какие меры открывают, откуда приходят в карточку, сколько читают и что нажимают: ссылку на источник или «Задать вопрос»."
      actions={
        <>
          <RegionFilter regions={r.regionsAvailable} value={region ?? ""} basePath="/admin/views" period={period.key} />
          <PeriodTabs value={period.key} basePath="/admin/views" extra={{ region: region ?? undefined }} />
        </>
      }
    >
      <ViewsReportBody r={r} showDelta={Boolean(period.days)} />
    </AdminPage>
  );
}
