import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { getAppUserById } from "@/lib/onboarding-db";
import { getThread, markThreadRead } from "@/lib/coordinator-chat-db";
import { CoordinatorChatThread } from "@/components/coordinator-chat-thread";
import { sendCoordinatorReplyAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Чат с регионом" };

export default async function RegionChatThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const staff = await getCurrentStaff();
  if (!staff) redirect(`/login?next=/admin/region-chat/${userId}`);

  const target = await getAppUserById(userId);
  const region = typeof target?.survey?.region === "string" ? target.survey.region : null;
  if (!target || !region) notFound();
  if (staff.role === "coordinator" && region !== staff.region) notFound();

  const fullName = `${target.firstName} ${target.lastName}`.trim();
  const messages = await getThread(userId);
  await markThreadRead(userId, "coordinator");

  const reply = sendCoordinatorReplyAction.bind(null, userId);

  return (
    <article className="px-4 py-5">
      <Link
        href="/admin/region-chat"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку бесед
      </Link>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold leading-tight tracking-tight">{fullName}</h1>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{target.email}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1B3A6B]/8 px-2.5 py-1 text-[11px] font-semibold text-[#1B3A6B]">
          <MapPin className="size-3" />
          {region}
        </span>
      </div>

      <div className="mt-4">
        <CoordinatorChatThread
          messages={messages}
          viewer="coordinator"
          counterpartName={fullName}
          sendAction={reply}
        />
      </div>
    </article>
  );
}
