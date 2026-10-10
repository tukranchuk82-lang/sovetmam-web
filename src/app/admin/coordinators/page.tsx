import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { getCurrentAdminOrAnalyst } from "@/lib/user-session";
import { getCoordinatorsOverview } from "@/lib/analytics/coordinator-report";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { StatCard } from "@/components/admin/ui/primitives";
import { CoordinatorsTable } from "@/components/admin/coordinators-table";

export const metadata = { title: "Работа координаторов" };
export const dynamic = "force-dynamic";

export default async function CoordinatorsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  // Сравнение координаторов — для владельца, техспеца и аналитика (только просмотр).
  const viewer = await getCurrentAdminOrAnalyst();
  if (!viewer) redirect("/admin");

  const period = parsePeriod((await searchParams).period);
  const rows = await getCoordinatorsOverview(period);
  const waiting = rows.reduce((s, r) => s + r.waitingNow, 0);
  const attention = rows.filter((r) => r.status.tone !== "ok").length;
  const replied = rows.reduce((s, r) => s + r.replied, 0);
  const invited = rows.reduce((s, r) => s + r.invited, 0);

  return (
    <AdminPage
      icon={<Activity />}
      title="Работа координаторов"
      description="Все координаторы рядом: кто заходит, как быстро отвечает людям и сколько приглашает. Нажмите на строку, чтобы открыть подробный отчёт."
      actions={<PeriodTabs value={period.key} basePath="/admin/coordinators" />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Координаторов" value={rows.length} />
        <StatCard
          label="Требуют внимания"
          value={attention}
          hint="Не входили, давно не заходили или не отвечают сутки"
          tone={attention > 0 ? "warn" : "default"}
        />
        <StatCard label="Людей ждут ответа сейчас" value={waiting} tone={waiting > 0 ? "warn" : "default"} />
        <StatCard label={`Ответов и приглашённых · ${period.label.toLowerCase()}`} value={`${replied} / ${invited}`} />
      </div>

      <div className="mt-5">
        <CoordinatorsTable rows={rows} periodLabel={period.label} />
      </div>
    </AdminPage>
  );
}
