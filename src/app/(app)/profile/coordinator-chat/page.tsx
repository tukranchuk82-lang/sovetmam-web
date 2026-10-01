import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { getCurrentAppUser } from "@/lib/user-session";
import { getThread, markThreadRead, hasCoordinatorForRegion } from "@/lib/coordinator-chat-db";
import { CoordinatorChatThread } from "@/components/coordinator-chat-thread";
import { sendCoordinatorChatMessageAction } from "./actions";

export const metadata = {
  title: "Чат с координатором",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function CoordinatorChatPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login?next=/profile/coordinator-chat");

  const region = typeof user.survey?.region === "string" ? user.survey.region : null;
  // Без региона или без назначенного координатора этой странице делать
  // нечего — карточка в /profile тоже не показывается в этом случае.
  if (!region || !(await hasCoordinatorForRegion(region))) redirect("/profile");

  const messages = await getThread(user.id);
  await markThreadRead(user.id, "user");

  return (
    // Тёмный фон страницы — по контрасту с ним светлая панель диалога сразу
    // читается как «то самое окно», а не ещё один блок среди прочих.
    <article
      className="min-h-[75vh] px-4 py-5"
      style={{ background: "linear-gradient(180deg, #16233F 0%, #101A30 100%)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold leading-tight tracking-tight text-white">
          Чат с координатором
        </h1>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90">
          <MapPin className="size-3" />
          {region}
        </span>
      </div>

      <div className="mt-4">
        <CoordinatorChatThread
          messages={messages}
          viewer="user"
          counterpartName="Координатор"
          sendAction={sendCoordinatorChatMessageAction}
        />
      </div>
    </article>
  );
}
