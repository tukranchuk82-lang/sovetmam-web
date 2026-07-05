import { getCurrentDemoUser } from "@/lib/demo-auth";
import { getCurrentAppUser } from "@/lib/user-session";
import { resolveUserAvatar } from "@/lib/avatar";
import { Avatar } from "@/components/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { AppShell } from "@/components/app-shell";
import { UtmCapture } from "@/components/utm-capture";

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

  return (
    <>
      <AppShell avatarSlot={avatarSlot} authed={Boolean(demoUser || appUser)}>
        {children}
      </AppShell>
      <UtmCapture />
    </>
  );
}
