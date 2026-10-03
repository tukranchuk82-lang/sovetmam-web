import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/user-session";
import { getSupportThread, markSupportRead } from "@/lib/support-chat-db";
import { SupportForCoordinator, SupportForTech } from "@/components/admin/support-workspace";
import { sendSupportMessageAction } from "./actions";

export const metadata = { title: "Техподдержка" };
export const dynamic = "force-dynamic";

/**
 * Координатор — своя переписка с техподдержкой. Техспец и владелец — список
 * обращений координаторов.
 */
export default async function SupportPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/support");

  if (staff.role === "coordinator") {
    const messages = await getSupportThread(staff.id);
    await markSupportRead(staff.id, "coordinator");
    return <SupportForCoordinator user={staff} messages={messages} sendAction={sendSupportMessageAction} />;
  }

  return <SupportForTech staff={staff} />;
}
