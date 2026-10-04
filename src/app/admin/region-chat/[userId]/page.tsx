import { notFound, redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { getAppUserById } from "@/lib/onboarding-db";
import { getThread, markThreadRead } from "@/lib/coordinator-chat-db";
import { getThreadRegion } from "@/lib/chat-region";
import { getClientCard } from "@/lib/chat-client-card";
import { RefreshOnce } from "@/components/refresh-once";
import { RegionChatWorkspace } from "@/components/admin/region-chat-workspace";
import { sendCoordinatorReplyAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Обращения" };

export default async function RegionChatThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const staff = await getCurrentStaff();
  if (!staff) redirect(`/login?next=/admin/region-chat/${userId}`);

  const target = await getAppUserById(userId);
  if (!target) notFound();
  const threadRegion = await getThreadRegion(userId, target);
  if (!threadRegion) notFound();
  if (staff.role === "coordinator" && threadRegion !== staff.region) notFound();

  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  const region = await resolveRegion(staff, scope);

  const [messages, card] = await Promise.all([getThread(userId), getClientCard(userId, threadRegion)]);
  const hadUnread = messages.some((m) => m.author === "user" && !m.readAt);
  await markThreadRead(userId, "coordinator");

  return (
    <>
      <RefreshOnce when={hadUnread} />
    <RegionChatWorkspace
      staff={staff}
      region={region}
      selected={{
        userId,
        name: `${target.firstName} ${target.lastName}`.trim(),
        threadRegion,
        messages,
        card,
        sendAction: sendCoordinatorReplyAction.bind(null, userId),
      }}
    />
    </>
  );
}
