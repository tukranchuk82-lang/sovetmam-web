import { Bell, Mail, MessageCircle, X } from "lucide-react";
import type { AppUser } from "@/lib/onboarding-db";
import { resolveChannels } from "@/lib/coordinator-notify";
import { MessengerManager } from "@/components/messenger-manager";
import { PushToggle } from "@/components/push-toggle";
import {
  dismissChatNotifyAction,
  setChatNotifyEmailAction,
  setChatNotifyMessengerAction,
} from "@/app/(app)/profile/coordinator-chat/actions";
import { cn } from "@/lib/utils";

/**
 * Настройка уведомлений чата: три независимых канала.
 *
 *  - пуш на устройство (и кружок на значке приложения);
 *  - сообщение от бота в мессенджере (Telegram, MAX, ВКонтакте);
 *  - письмо.
 *
 * Одна и та же панель для человека и для координатора: меняется только то,
 * о чём рассказывает текст. Включает человек сам, ничего не включено «за него»
 * молча: пуш просит разрешение браузера по нажатию, бот подключается своей
 * кнопкой, письмо — переключателем.
 *
 * Сервер-компонент: переключатели — формы с серверными действиями, без
 * клиентского JS (как ViewModeSwitch); клиентские только пуш и подключение бота.
 */

function Switch({
  on,
  action,
  label,
}: {
  on: boolean;
  action: (on: boolean) => Promise<void>;
  label: string;
}) {
  return (
    <form action={action.bind(null, !on)}>
      <button
        type="submit"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          on ? "bg-[#1B3A6B]" : "bg-black/20",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            on ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </form>
  );
}

export function ChatNotifyPanel({
  user,
  audience,
  offer = false,
  what: whatOverride,
}: {
  user: AppUser;
  audience: "user" | "staff";
  /** Свой оборот вместо «когда координатор ответит» / «когда человек напишет вам». */
  what?: string;
  /** Показать как предложение: с заголовком-вопросом и кнопкой «Не сейчас». */
  offer?: boolean;
}) {
  const channels = resolveChannels({
    id: user.id,
    email: user.email,
    salebot_client_id: user.salebotClientId,
    telegram_id: user.telegramId,
    vk_id: user.vkId,
    max_id: user.maxId,
    coordinator_chat_notify_channel: user.coordinatorChatNotifyChannel,
    chat_notify_messenger: user.chatNotifyMessenger,
    chat_notify_email: user.chatNotifyEmail,
    chat_notify_asked_at: user.chatNotifyAskedAt,
  });
  const messengerConnected = user.telegramId != null || user.vkId != null || user.maxId != null;
  const connectedNames = [
    user.telegramId != null && "Telegram",
    user.maxId != null && "MAX",
    user.vkId != null && "ВКонтакте",
  ].filter(Boolean) as string[];

  const what = whatOverride ?? (audience === "user" ? "когда координатор ответит" : "когда человек напишет вам");

  return (
    <div
      className={
        offer
          ? "light-surface overflow-hidden rounded-2xl border border-[#2FA36B] bg-white text-[#2b2f36]"
          : "light-surface rounded-2xl border bg-white p-4 text-[#2b2f36]"
      }
    >
      {/* Предложение: зелёная шапка с крестиком, которым его можно закрыть. */}
      {offer && (
        <div className="flex items-center gap-2 bg-[#2FA36B] py-2.5 pl-4 pr-1.5 text-white">
          <p className="min-w-0 flex-1 text-sm font-bold">
            {audience === "user" ? "Хотите узнавать об ответе сразу?" : "Хотите узнавать о новых вопросах сразу?"}
          </p>
          <form action={dismissChatNotifyAction}>
            <button
              type="submit"
              aria-label="Закрыть"
              title="Закрыть"
              className="grid size-8 place-items-center rounded-lg text-white/85 transition-colors hover:bg-black/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </form>
        </div>
      )}
      <div className={offer ? "p-4" : undefined}>
      {!offer && <p className="text-sm font-bold">Уведомления</p>}
      <p className="mt-0.5 text-xs text-muted-foreground">
        {offer ? "Включите любой способ или несколько сразу — сообщим, " : "Сообщим, "}
        {what}. К каждому уведомлению приложена ссылка на переписку.
      </p>

      <div className="mt-3 divide-y">
        {/* Бот в мессенджере */}
        <div className="py-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="size-5 shrink-0 text-[#1B3A6B]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Бот в мессенджере</p>
              <p className="text-xs text-muted-foreground">
                {messengerConnected
                  ? `Подключён: ${connectedNames.join(", ")}`
                  : "Telegram, MAX или ВКонтакте — пока не подключён"}
              </p>
            </div>
            {messengerConnected && (
              <Switch on={channels.messenger} action={setChatNotifyMessengerAction} label="Уведомления в боте" />
            )}
          </div>
          <details className="mt-2" open={!messengerConnected}>
            <summary className="cursor-pointer text-xs font-medium text-[#1B3A6B]">
              {messengerConnected ? "Подключить другой мессенджер" : "Подключить бота"}
            </summary>
            <div className="mt-2">
              <MessengerManager
                initial={{
                  telegram: user.telegramId != null,
                  vk: user.vkId != null,
                  max: user.maxId != null,
                }}
              />
            </div>
          </details>
        </div>

        {/* Пуш на устройство */}
        <div className="py-3">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 size-5 shrink-0 text-[#1B3A6B]" />
            <div className="min-w-0 flex-1">
              <PushToggle
                bare
                description="Появятся в шторке уведомлений телефона, а на значке приложения будет кружок с числом новых сообщений."
              />
            </div>
          </div>
        </div>

        {/* Почта */}
        <div className="flex items-center gap-3 py-3">
          <Mail className="size-5 shrink-0 text-[#1B3A6B]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Письмо на почту</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Switch on={channels.email} action={setChatNotifyEmailAction} label="Письма на почту" />
        </div>
      </div>

      </div>
    </div>
  );
}
