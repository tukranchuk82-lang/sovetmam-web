import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentAdminOrAnalyst } from "@/lib/user-session";
import { listByRole, listPendingOwnerRequests, type StaffRow } from "@/lib/staff-db";
import { REGIONS } from "@/lib/measures";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { StaffDirectory, type StaffPerson } from "@/components/admin/staff-directory";
import { getCoordinatorsOverview } from "@/lib/analytics/coordinator-report";
import { parsePeriod } from "@/lib/analytics/period";
import {
  decideOwnerRequestAction,
  demoteAnalystAction,
  demoteCoordinatorAction,
  demoteTechAction,
  grantOwnerDirectAction,
  promoteToAnalystAction,
  promoteToCoordinatorAction,
  promoteToTechAction,
  requestOwnerAction,
} from "./actions";

export const metadata = { title: "Сотрудники" };
export const dynamic = "force-dynamic";

const person = (r: StaffRow): StaffPerson => ({
  id: r.id,
  name: `${r.firstName} ${r.lastName}`.trim() || r.email,
  email: r.email,
  region: r.region,
});

export default async function StaffPage() {
  const admin = await getCurrentAdminOrAnalyst();
  if (!admin) redirect("/login?next=/admin/staff");
  const viewerRole = admin.role as "owner" | "tech" | "analyst";

  const overview = await getCoordinatorsOverview(parsePeriod("30"));
  const statusById = new Map(overview.map((o) => [o.id, o.status]));

  const [coordinatorsRaw, techs, analysts, owners, pending] = await Promise.all([
    listByRole("coordinator"),
    listByRole("tech"),
    listByRole("analyst"),
    listByRole("owner"),
    admin.role === "owner" ? listPendingOwnerRequests() : Promise.resolve([]),
  ]);

  return (
    <AdminPage
      icon={<ShieldCheck />}
      title="Сотрудники"
      description="Кто ведёт какой регион, кто отвечает за техническую часть и кому переданы права владельца."
    >
      <StaffDirectory
        coordinators={coordinatorsRaw.map((c) => ({ ...person(c), status: statusById.get(c.id) }))}
        techs={techs.map(person)}
        analysts={analysts.map(person)}
        owners={owners.map(person)}
        pending={pending.map((p) => ({
          id: p.id,
          requestedByName: p.requestedByName,
          targetName: p.targetName,
          targetEmail: p.targetEmail,
        }))}
        viewerRole={viewerRole}
        regions={[...REGIONS]}
        actions={{
          promoteCoordinator: promoteToCoordinatorAction,
          promoteTech: promoteToTechAction,
          promoteAnalyst: promoteToAnalystAction,
          grantOwner: grantOwnerDirectAction,
          requestOwner: requestOwnerAction,
          demoteCoordinator: demoteCoordinatorAction,
          demoteTech: demoteTechAction,
          demoteAnalyst: demoteAnalystAction,
          decideOwnerRequest: decideOwnerRequestAction,
        }}
      />
    </AdminPage>
  );
}
