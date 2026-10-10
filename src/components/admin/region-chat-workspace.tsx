import Link from "next/link";
import { ArrowLeft, MailPlus, MapPin, MessageCircle } from "lucide-react";
import { markConversationUnreadAction } from "@/app/admin/region-chat/actions";
import type { AppUser } from "@/lib/onboarding-db";
import { listConversationsByRegion, type ChatMessage } from "@/lib/coordinator-chat-db";
import type { ClientCard } from "@/lib/chat-client-card";
import { Avatar } from "@/components/avatar";
import { ChatNotifyPanel } from "@/components/chat-notify-panel";
import { CoordinatorChatThread, type ChatSendState } from "@/components/coordinator-chat-thread";
import { ChatClientCardView } from "@/components/admin/chat-client-card";
import { ChatCardSheet } from "@/components/admin/chat-card-sheet";
import { ChatConversationList } from "@/components/admin/chat-conversation-list";
import { ChatNotifyDrawer } from "@/components/admin/chat-notify-drawer";
import { cn } from "@/lib/utils";

/**
 * Рабочее место координатора: три отдельные панели на тёмном фоне — слева
 * список обратившихся, в центре переписка, справа карточка выбранного человека.
 *
 * Широкий экран — все три рядом. Телефон — по одной: сначала список, по
 * нажатию на человека — переписка, а карточка прячется за кнопкой «Карточка».
 */

const PANEL = "rounded-2xl border border-white/[0.13] bg-[#1f3258] text-white";

export async function RegionChatWorkspace({
  staff,
  region,
  selected,
}: {
  staff: AppUser;
  /** Регион координатора; null — владелец/техспец «на себе», все регионы. */
  region: string | null;
  selected?: {
    userId: string;
    name: string;
    threadRegion: string | null;
    messages: ChatMessage[];
    card: ClientCard | null;
    sendAction: (prev: ChatSendState, fd: FormData) => Promise<ChatSendState>;
  };
}) {
  const conversations = await listConversationsByRegion(region);
  const waiting = conversations.filter((c) => c.lastAuthor === "user").length;

  return (
    <div className="m-3 flex h-[calc(100dvh-52px-24px)] min-h-[480px] gap-3 rounded-2xl bg-[#0E1830] p-3">
      {/* ── Список обратившихся ───────────────────────────────────── */}
      <aside
        className={cn(PANEL, "flex w-full min-w-0 flex-col lg:w-[330px] lg:shrink-0", selected && "hidden lg:flex")}
      >
        <div className="px-4 pb-3 pt-4">
          <h1 className="font-heading text-[21px] font-bold leading-tight">Обращения</h1>
          <p className="mt-1 text-xs text-white/60">
            {region ? `Регион «${region}»` : "Все регионы"}
            {waiting > 0 && <span className="ml-1.5 rounded-full bg-[#C2334A] px-2 py-0.5 text-[11px] font-semibold text-white">ждут ответа: {waiting}</span>}
          </p>
        </div>

        <div className="px-3 pb-3">
          <ChatNotifyDrawer highlight={!staff.chatNotifyAskedAt}>
            <ChatNotifyPanel user={staff} audience="staff" />
          </ChatNotifyDrawer>
        </div>

        <ChatConversationList
          items={conversations.map((c) => ({
            userId: c.userId,
            userName: c.userName,
            region: c.region,
            lastMessage: c.lastMessage,
            lastAuthor: c.lastAuthor,
            lastAt: c.lastAt,
            unreadCount: c.unreadCount,
          }))}
          selectedId={selected?.userId}
          showRegion={!region}
        />

        {/* Старые обращения (по почте) никуда не делись — лежат тихо, на случай,
            если нужно найти прежнюю переписку. */}
        <div className="border-t border-white/10 px-4 py-3 text-center">
          <Link href="/admin/inquiries" className="text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline">
            Прежние обращения (по почте)
          </Link>
        </div>
      </aside>

      {/* ── Переписка ──────────────────────────────────────────────── */}
      <section className={cn(PANEL, "flex min-w-0 flex-1 flex-col", !selected && "hidden lg:flex")}>
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Link
                href="/admin/region-chat"
                aria-label="К списку"
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/20 text-white/80 hover:bg-white/10 lg:hidden"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <Avatar name={selected.name} color="#4F73B8" size={38} className="hidden sm:inline-flex" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold leading-snug">{selected.name}</p>
                {selected.threadRegion && (
                  <p className="inline-flex items-center gap-1 text-xs text-white/55">
                    <MapPin className="size-3" />
                    {selected.threadRegion}
                  </p>
                )}
              </div>
              {staff.role !== "analyst" && (
              <form action={markConversationUnreadAction.bind(null, selected.userId)}>
                <button
                  type="submit"
                  title="Отметить непрочитанным и вернуться к списку"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <MailPlus className="size-4" />
                  <span className="hidden sm:inline">Непрочитанным</span>
                </button>
              </form>
              )}
              {selected.card && (
                <ChatCardSheet name={selected.name}>
                  <ChatClientCardView card={selected.card} />
                </ChatCardSheet>
              )}
            </header>
            <div className="min-h-0 flex-1">
              <CoordinatorChatThread
                fill
                dark
                messages={selected.messages}
                viewer="coordinator"
                counterpartName={selected.name}
                sendAction={selected.sendAction}
                readOnly={staff.role === "analyst"}
              />
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <MessageCircle className="mx-auto size-10 text-white/30" strokeWidth={1.5} />
              <p className="mt-3 text-base font-semibold">Выберите беседу слева</p>
              <p className="mt-1 text-sm text-white/55">Переписка и карточка человека откроются здесь.</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Карточка клиента (широкий экран) ───────────────────────── */}
      {selected?.card && (
        <aside className={cn(PANEL, "hidden w-[300px] shrink-0 overflow-y-auto p-4 xl:block")}>
          <ChatClientCardView card={selected.card} dark />
        </aside>
      )}
    </div>
  );
}
