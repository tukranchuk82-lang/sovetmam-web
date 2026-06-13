import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { Avatar } from "@/components/avatar";

export async function AppHeader() {
  const user = await getCurrentDemoUser();

  return (
    <header className="relative z-20 shrink-0 rounded-b-3xl bg-brand shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)]">
      <div className="flex h-14 items-center justify-between gap-2.5 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <Image
              src="/logo.png"
              alt="Совет матерей"
              width={28}
              height={28}
              priority
              className="size-7 rounded-full object-contain"
            />
          </div>
          <span className="flex min-w-0 flex-col leading-tight text-white">
            <span className="truncate text-sm font-extrabold tracking-tight">
              Совет матерей
            </span>
            <span className="truncate text-[10px] text-white/75">
              Общероссийская общественная организация
            </span>
          </span>
        </Link>

        {user ? (
          <Link
            href="/profile"
            aria-label="Личный кабинет"
            className="shrink-0 rounded-full ring-2 ring-white/40 ring-offset-2 ring-offset-brand transition-transform hover:scale-105"
          >
            <Avatar name={user.name} color={user.avatarColor} size={36} />
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <LogIn className="size-3.5" />
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}
