import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { RegionChatWorkspace } from "@/components/admin/region-chat-workspace";

export const metadata = { title: "Обращения" };
export const dynamic = "force-dynamic";

export default async function RegionChatPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/region-chat");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  if (scope !== "coordinator") redirect("/admin");

  const region = await resolveRegion(staff, scope);
  return <RegionChatWorkspace staff={staff} region={region} />;
}
