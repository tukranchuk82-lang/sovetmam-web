import { notFound, redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/user-session";
import { getAppUserById } from "@/lib/onboarding-db";
import { getSupportThread, markSupportRead } from "@/lib/support-chat-db";
import { RefreshOnce } from "@/components/refresh-once";
import { SupportForTech } from "@/components/admin/support-workspace";
import { sendSupportReplyAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Техподдержка" };

/** Переписка с конкретным координатором — для техспеца и владельца. */
export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ coordinatorId: string }>;
}) {
  const { coordinatorId } = await params;
  const staff = await getCurrentStaff();
  if (!staff) redirect(`/login?next=/admin/support/${coordinatorId}`);
  if (staff.role === "coordinator") redirect("/admin/support");

  const coordinator = await getAppUserById(coordinatorId);
  if (!coordinator || coordinator.role !== "coordinator") notFound();

  const messages = await getSupportThread(coordinatorId);
  const hadUnread = messages.some((m) => m.author === "user" && !m.readAt);
  if (staff.role !== "analyst") await markSupportRead(coordinatorId, "tech");

  return (
    <>
      <RefreshOnce when={hadUnread} />
    <SupportForTech
      staff={staff}
      selected={{
        coordinatorId,
        name: `${coordinator.firstName} ${coordinator.lastName}`.trim() || coordinator.email,
        region: coordinator.region ?? "",
        email: coordinator.email,
        messengers: [
          coordinator.telegramId != null && "Telegram",
          coordinator.maxId != null && "MAX",
          coordinator.vkId != null && "ВКонтакте",
        ].filter(Boolean) as string[],
        messages,
        sendAction: sendSupportReplyAction.bind(null, coordinatorId),
      }}
    />
    </>
  );
}
