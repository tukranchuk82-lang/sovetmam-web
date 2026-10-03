import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { getCurrentAppUser } from "@/lib/user-session";
import { getThread, markThreadRead, hasCoordinatorForRegion } from "@/lib/coordinator-chat-db";
import { getUserChatRegion } from "@/lib/chat-region";
import { getMeasureBySlug } from "@/lib/measures-db";
import { CoordinatorChatThread } from "@/components/coordinator-chat-thread";
import { ChatNotifyPanel } from "@/components/chat-notify-panel";
import { sendCoordinatorChatMessageAction } from "./actions";

export const metadata = {
  title: "Чат с координатором",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function CoordinatorChatPage({
  searchParams,
}: {
  searchParams: Promise<{ measure?: string }>;
}) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login?next=/profile/coordinator-chat");

  // Без региона не понять, кому писать: просим выбрать — и возвращаем сюда.
  const region = await getUserChatRegion(user);
  if (!region) redirect("/profile/coordinator-chat/region");
  // В регионе нет координатора — чата не будет, вопрос уходит на почту
  // председателю через обычную форму обращения.
  if (!(await hasCoordinatorForRegion(region))) redirect("/profile/inquiries/new");

  const sp = await searchParams;
  const measure = sp.measure ? await getMeasureBySlug(sp.measure) : null;

  const messages = await getThread(user.id);
  await markThreadRead(user.id, "user");

  // Первое сообщение отправлено, а про уведомления человека ещё не спрашивали —
  // самое время предложить: он только что написал и ждёт ответа.
  const offerNotify = messages.some((m) => m.author === "user") && !user.chatNotifyAskedAt;

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
          initialText={measure && messages.length === 0 ? `Вопрос по мере «${measure.title}»: ` : undefined}
        />
      </div>

      {/* Предложение про уведомления — под перепиской: само сообщение и поле ввода
          важнее, подсказка не должна оттеснять их с первого экрана. */}
      {offerNotify && (
        <div className="mt-4">
          <ChatNotifyPanel user={user} audience="user" offer />
        </div>
      )}

      {/* Настройки остаются под рукой и после того, как предложение закрыли. */}
      {!offerNotify && (
        <details className="group mt-4 rounded-2xl bg-white/[0.07] text-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Уведомления об ответе</summary>
          <div className="px-2 pb-2">
            <ChatNotifyPanel user={user} audience="user" />
          </div>
        </details>
      )}
    </article>
  );
}
