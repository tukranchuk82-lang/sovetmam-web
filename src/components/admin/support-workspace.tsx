import Link from "next/link";
import { ArrowLeft, LifeBuoy, MailPlus, MapPin, MessageCircle } from "lucide-react";
import { markSupportUnreadAction } from "@/app/admin/support/actions";
import type { AppUser } from "@/lib/onboarding-db";
import type { ChatMessage } from "@/lib/coordinator-chat-db";
import { listSupportConversations } from "@/lib/support-chat-db";
import { Avatar } from "@/components/avatar";
import { ChatNotifyPanel } from "@/components/chat-notify-panel";
import { CoordinatorChatThread, type ChatSendState } from "@/components/coordinator-chat-thread";
import { ChatConversationList } from "@/components/admin/chat-conversation-list";
import { ChatNotifyDrawer } from "@/components/admin/chat-notify-drawer";
import { cn } from "@/lib/utils";

/**
 * Чат с техподдержкой — два вида одного экрана.
 *
 * Координатор видит одну переписку с техподдержкой и кнопку уведомлений.
 * Техспец и владелец видят список координаторов, написавших в поддержку, и
 * выбранную переписку — по тому же образцу, что рабочее место координатора.
 */

const PANEL = "rounded-2xl border border-white/[0.13] bg-[#1f3258] text-white";
const FRAME = "m-3 flex h-[calc(100dvh-52px-24px)] min-h-[480px] gap-3 rounded-2xl bg-[#0E1830] p-3";

type Send = (prev: ChatSendState, fd: FormData) => Promise<ChatSendState>;

/** Вид координатора: одна переписка с техподдержкой. */
export function SupportForCoordinator({
  user,
  messages,
  sendAction,
}: {
  user: AppUser;
  messages: ChatMessage[];
  sendAction: Send;
}) {
  return (
    <div className={FRAME}>
      <section className={cn(PANEL, "mx-auto flex w-full max-w-3xl min-w-0 flex-col")}>
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F6EDE8] text-[#8E1D2C]">
            <LifeBuoy className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-[19px] font-bold leading-tight">Техподдержка</h1>
            <p className="text-xs text-white/60">Что-то не работает или непонятно? Напишите — ответит технический специалист.</p>
          </div>
        </header>

        <div className="px-3 pt-3">
          <ChatNotifyDrawer highlight={!user.chatNotifyAskedAt} title="Уведомления об ответе" subtitle="Ответы техподдержки">
            <ChatNotifyPanel user={user} audience="staff" what="когда техподдержка ответит" />
          </ChatNotifyDrawer>
        </div>

        <div className="min-h-0 flex-1">
          <CoordinatorChatThread
            fill
            dark
            messages={messages}
            viewer="user"
            counterpartName="Техподдержка"
            sendAction={sendAction}
          />
        </div>
      </section>
    </div>
  );
}

/** Вид техспеца и владельца: список координаторов и выбранная переписка. */
export async function SupportForTech({
  staff,
  selected,
}: {
  staff: AppUser;
  selected?: {
    coordinatorId: string;
    name: string;
    region: string;
    email: string;
    messengers: string[];
    messages: ChatMessage[];
    sendAction: Send;
  };
}) {
  const conversations = await listSupportConversations();
  const waiting = conversations.filter((c) => c.lastAuthor === "user").length;

  return (
    <div className={FRAME}>
      {/* ── Список ─────────────────────────────────────────────── */}
      <aside className={cn(PANEL, "flex w-full min-w-0 flex-col lg:w-[330px] lg:shrink-0", selected && "hidden lg:flex")}>
        <div className="px-4 pb-3 pt-4">
          <h1 className="font-heading text-[21px] font-bold leading-tight">Техподдержка</h1>
          <p className="mt-1 text-xs text-white/60">
            Обращения координаторов
            {waiting > 0 && (
              <span className="ml-1.5 rounded-full bg-[#C2334A] px-2 py-0.5 text-[11px] font-semibold text-white">
                ждут ответа: {waiting}
              </span>
            )}
          </p>
        </div>

        <div className="px-3 pb-3">
          <ChatNotifyDrawer
            highlight={!staff.chatNotifyAskedAt}
            title="Уведомления"
            subtitle="О новых обращениях в техподдержку"
          >
            <ChatNotifyPanel user={staff} audience="staff" what="когда координатор напишет в техподдержку" />
          </ChatNotifyDrawer>
        </div>

        <ChatConversationList
          items={conversations.map((c) => ({
            userId: c.coordinatorId,
            userName: c.name,
            region: c.region,
            lastMessage: c.lastMessage,
            lastAuthor: c.lastAuthor,
            lastAt: c.lastAt,
            unreadCount: c.unreadCount,
          }))}
          selectedId={selected?.coordinatorId}
          showRegion
          hrefBase="/admin/support"
        />
      </aside>

      {/* ── Переписка ──────────────────────────────────────────── */}
      <section className={cn(PANEL, "flex min-w-0 flex-1 flex-col", !selected && "hidden lg:flex")}>
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Link
                href="/admin/support"
                aria-label="К списку"
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/20 text-white/80 hover:bg-white/10 lg:hidden"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <Avatar name={selected.name} color="#4F73B8" size={38} className="hidden sm:inline-flex" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold leading-snug">{selected.name}</p>
                <p className="inline-flex flex-wrap items-center gap-x-2 text-xs text-white/55">
                  {selected.region && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {selected.region}
                    </span>
                  )}
                  <span className="truncate">{selected.email}</span>
                </p>
              </div>
              <form action={markSupportUnreadAction.bind(null, selected.coordinatorId)}>
                <button
                  type="submit"
                  title="Отметить непрочитанным и вернуться к списку"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <MailPlus className="size-4" />
                  <span className="hidden sm:inline">Непрочитанным</span>
                </button>
              </form>
            </header>
            <div className="min-h-0 flex-1">
              <CoordinatorChatThread
                fill
                dark
                messages={selected.messages}
                viewer="coordinator"
                counterpartName={selected.name}
                sendAction={selected.sendAction}
              />
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <MessageCircle className="mx-auto size-10 text-white/30" strokeWidth={1.5} />
              <p className="mt-3 text-base font-semibold">
                {conversations.length === 0 ? "Пока никто не обращался" : "Выберите обращение слева"}
              </p>
              <p className="mt-1 text-sm text-white/55">
                {conversations.length === 0
                  ? "Когда координатор напишет в техподдержку, обращение появится здесь."
                  : "Переписка откроется здесь."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
