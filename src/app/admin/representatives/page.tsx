import Link from "next/link";
import { redirect } from "next/navigation";
import { Landmark, Plus, Activity } from "lucide-react";
import { listRepresentativesForAdmin } from "@/lib/representatives-db";
import { listByRole } from "@/lib/staff-db";
import { getCoordinatorsOverview } from "@/lib/analytics/coordinator-report";
import { parsePeriod } from "@/lib/analytics/period";
import { getCurrentAdminOrAnalyst } from "@/lib/user-session";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { Plate } from "@/components/admin/ui/plate";
import { StatCard } from "@/components/admin/ui/primitives";
import { NkoList, type NkoCoordinator } from "@/components/admin/nko-list";
import { CoordinatorsTable } from "@/components/admin/coordinators-table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleRepresentativePublishedAction } from "./actions";

export const metadata = { title: "Региональные НКО" };
export const dynamic = "force-dynamic";

/**
 * Всё про региональные НКО в одном месте: сами организации, их координаторы
 * (сотрудники, закреплённые за тем же регионом) и работа координаторов.
 */
export default async function RegionalNkoPage() {
  const viewer = await getCurrentAdminOrAnalyst();
  if (!viewer) redirect("/admin");
  const canEdit = viewer.role !== "analyst";

  const [representatives, coordinators, overview] = await Promise.all([
    listRepresentativesForAdmin(),
    listByRole("coordinator"),
    getCoordinatorsOverview(parsePeriod("30")),
  ]);

  const byRegion: Record<string, NkoCoordinator[]> = {};
  for (const c of coordinators) {
    if (!c.region) continue;
    (byRegion[c.region] ??= []).push({ id: c.id, name: `${c.firstName} ${c.lastName}`.trim() || c.email, email: c.email });
  }
  const nkoRegions = new Set(representatives.map((r) => r.region));
  const withoutCoordinator = [...nkoRegions].filter((r) => !byRegion[r]).length;
  const attention = overview.filter((o) => o.status.tone !== "ok").length;
  const waiting = overview.reduce((s, o) => s + o.waitingNow, 0);

  return (
    <AdminPage
      icon={<Landmark />}
      title="Региональные НКО"
      description="Аккредитованные организации, к которым человек может обратиться по мерам своего региона, и координаторы, которые ведут эти регионы. Показываются в подборке и в карточках региональных мер."
      actions={
        canEdit ? (
          <Link href="/admin/representatives/new" className={cn(buttonVariants(), "h-10 gap-1.5 px-3 text-sm")}>
            <Plus className="size-4" /> Добавить НКО
          </Link>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Организаций" value={representatives.length} />
        <StatCard label="Регионов с координатором" value={Object.keys(byRegion).length} />
        <StatCard
          label="НКО без координатора в регионе"
          value={withoutCoordinator}
          tone={withoutCoordinator > 0 ? "warn" : "default"}
          hint="Регионов, где НКО есть, а координатор не назначен"
        />
        <StatCard label="Людей ждут ответа" value={waiting} tone={waiting > 0 ? "warn" : "default"} hint={`Координаторов, которым нужно внимание: ${attention}`} />
      </div>

      <div className="mt-5 space-y-3">
        <Plate title="Организации по регионам" hint="НКО, координатор региона и включение/отключение" count={representatives.length}>
          <NkoList
            rows={representatives.map((r) => ({ id: r.id, name: r.name, region: r.region, isPublished: r.isPublished }))}
            coordinatorsByRegion={byRegion}
            canOpenCoordinator
            canEdit={canEdit}
            toggle={toggleRepresentativePublishedAction}
          />
        </Plate>

        <Plate
          title="Работа координаторов"
          hint="Кто заходит, как быстро отвечает людям и сколько приглашает — за последние 30 дней"
          count={overview.length}
          badge={
            attention > 0 ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">{attention} требуют внимания</span>
            ) : undefined
          }
        >
          <CoordinatorsTable rows={overview} periodLabel="30 дней" />
          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/admin/coordinators" className="inline-flex items-center gap-1 font-medium text-primary underline">
              <Activity className="size-3.5" /> Открыть сравнение за другой период (7, 90 дней, всё время)
            </Link>
          </p>
        </Plate>
      </div>
    </AdminPage>
  );
}
