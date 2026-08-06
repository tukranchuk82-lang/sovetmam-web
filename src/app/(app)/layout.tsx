import { getCurrentDemoUser } from "@/lib/demo-auth";
import { getCurrentAppUser } from "@/lib/user-session";
import { resolveUserAvatar } from "@/lib/avatar";
import { Avatar } from "@/components/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { AppShell } from "@/components/app-shell";
import { SavedProvider } from "@/components/saved-provider";
import { UtmCapture } from "@/components/utm-capture";
import { ShareArrival } from "@/components/share-arrival";
import { countUnreadForUser } from "@/lib/inquiry-thread";
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

  return (
    <>
      <SavedProvider authed={canSave}>
        <AppShell
          avatarSlot={avatarSlot}
          authed={Boolean(demoUser || appUser)}
          unread={unread}
        >
          {children}
        </AppShell>
      </SavedProvider>
      <UtmCapture />
      {/* Отметка о приходе по размеченной ссылке — считает пересылки и рассылки. */}
      <ShareArrival />
      {/* Кружок на иконке установленного приложения. */}
      <AppBadge count={unread} />
    </>
  );
}
