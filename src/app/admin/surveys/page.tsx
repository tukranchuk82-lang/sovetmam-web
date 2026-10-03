import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { getSurveysReport } from "@/lib/analytics/surveys";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { BarList } from "@/components/admin/ui/charts";
import { StatCard } from "@/components/admin/ui/primitives";
import { RegionFilter } from "@/components/admin/region-filter";
import { cn } from "@/lib/utils";

export const metadata = { title: "Анкеты" };
export const dynamic = "force-dynamic";

export default async function AdminSurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; region?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/surveys");
  if (effectiveAdminScope(staff.role, await getViewMode(staff.role)) === "coordinator") redirect("/admin");

  const sp = await searchParams;
  const period = parsePeriod(sp.period, "all");
  const region = sp.region || null;
  const report = await getSurveysReport(period, region);

  return (
    <AdminPage
      icon={<ClipboardList />}
      title="Анкеты: что отвечают люди"
      description="Какие ответы в анкете подбора выбирают чаще. Считаются анкеты, заполненные или обновлённые в выбранный период."
      actions={
        <>
          <RegionFilter regions={report.regionsAvailable} value={region ?? ""} basePath="/admin/surveys" period={period.key} />
          <PeriodTabs value={period.key} basePath="/admin/surveys" extra={{ region: region ?? undefined }} />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Анкет в выборке" value={report.total} tone="accent" hint={region ?? "Все регионы"} />
      </div>

      {report.total === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          За этот период анкет нет. Выберите период подлиннее или другой регион.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          {report.distributions
            .filter((d) => d.items.length > 0 && !(region && d.key === "region"))
            .map((d) => (
              <section
                key={d.key}
                className={cn(
                  "light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]",
                  d.key === "region" && "lg:col-span-2",
                )}
              >
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{d.title}</h2>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground">ответили: {d.answered}</span>
                </div>
                <BarList items={d.items} max={d.key === "region" ? 12 : undefined} tone={d.key === "region" ? "navy" : "brand"} />
              </section>
            ))}
          {report.flags.length > 0 && (
            <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)] lg:col-span-2">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Отметили в анкете (доля от анкет)
                </h2>
              </div>
              <BarList items={report.flags} total={report.total} tone="navy" />
            </section>
          )}
        </div>
      )}
    </AdminPage>
  );
}
