import { getUserChatRegion } from "@/lib/chat-region";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { getCurrentAppUser } from "@/lib/user-session";
import { logout } from "@/app/(app)/login/onboarding-actions";
import { logoutDemoUser } from "@/app/(app)/login/actions";
import { resolveUserAvatar } from "@/lib/avatar";
import { Avatar } from "@/components/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { AppShell } from "@/components/app-shell";
import { SavedProvider } from "@/components/saved-provider";
import { UtmCapture } from "@/components/utm-capture";
import { ShareArrival } from "@/components/share-arrival";
import { NavTrail } from "@/components/nav-trail";
import { VisitPing } from "@/components/visit-ping";
import { countUnreadForUser } from "@/lib/inquiry-thread";
import {
  countUnreadForUser as countCoordinatorChatUnread,
  hasCoordinatorForRegion,
} from "@/lib/coordinator-chat-db";
import { AppBadge } from "@/components/app-badge";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Сессия читается на сервере; готовый аватар отдаём клиентскому каркасу.
  const demoUser = await getCurrentDemoUser();
  const appUser = demoUser ? null : await getCurrentAppUser();
  const avatarSlot = demoUser ? (
    <Avatar name={demoUser.name} color={demoUser.avatarColor} size={44} />
  ) : appUser ? (
    <UserAvatar avatar={resolveUserAvatar(appUser)} size={44} />
  ) : null;

  // Сохранять меры может только «настоящий» (email) пользователь — на него и
  // завязано избранное. Демо-роли (заказчик/техспец) — служебные.
  const canSave = Boolean(appUser);

  // Кружок на «Обращении»: сколько ответов человек ещё не открывал.
  const unread = appUser ? await countUnreadForUser(appUser.id) : 0;
  const coordinatorChatUnread = appUser ? await countCoordinatorChatUnread(appUser.id) : 0;

  // Пункт «Обращение» в нижнем меню — единая точка входа «поговорить с нами»:
  // ведёт в чат с координатором региона, если он там назначен, иначе — в
  // обычную форму обращения (она уходит на почту). Обе системы человеку
  // видеть незачем — только одна дорога, та, что реально доведёт до ответа.
  const region = appUser ? await getUserChatRegion(appUser) : null;
  const hasCoordinator = region ? await hasCoordinatorForRegion(region) : false;
  const inquiryHref = hasCoordinator ? "/profile/coordinator-chat" : "/profile/inquiries/new";
  const inquiryUnread = hasCoordinator ? coordinatorChatUnread : unread;

  // Кружок на аватарке: напомнить подключить мессенджер. Показывается только
  // тем, кто ещё ни разу не открывал кабинет после регистрации без бота, —
  // как только откроют, отметка гасится (см. profile/page.tsx).
  const messengerHint = Boolean(
    appUser && !appUser.messengerConnected && !appUser.messengerHintSeenAt,
  );

  return (
    <>
      <SavedProvider authed={canSave}>
        <AppShell
          avatarSlot={avatarSlot}
          authed={Boolean(demoUser || appUser)}
          logoutAction={demoUser ? logoutDemoUser : logout}
          inquiryHref={inquiryHref}
          inquiryLabel={hasCoordinator ? "Чат" : "Обращение"}
          unread={inquiryUnread}
          messengerHint={messengerHint}
        >
          {children}
        </AppShell>
      </SavedProvider>
      <UtmCapture />
      {/* Отметка о приходе по размеченной ссылке — считает пересылки и рассылки. */}
      <ShareArrival />
      <NavTrail />
      {/* Одна отметка о заходе в сутки: без неё видны только те, кто
          пришёл по размеченной ссылке. */}
      <VisitPing />
      {/* Кружок на иконке установленного приложения. */}
      <AppBadge count={unread + coordinatorChatUnread} />
    </>
  );
}
