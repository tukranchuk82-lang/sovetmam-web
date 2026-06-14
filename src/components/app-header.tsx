import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { Avatar } from "@/components/avatar";

export async function AppHeader() {
  const user = await getCurrentDemoUser();

  return (
    <header className="relative z-20 shrink-0 border-b border-border bg-card">
      {/* Тонкая фирменная полоса сверху: navy + красный акцент */}
      <div className="flex h-1">
        <div className="flex-1 bg-brand" />
        <div className="w-1/4 bg-accent-red" />
      </div>
      <div className="flex h-14 items-center justify-between gap-2.5 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft ring-1 ring-brand/15">
            <Image
              src="/logo.png"
              alt="Совет матерей"
              width={28}
              height={28}
              priority
              className="size-7 rounded-full object-contain"
            />
          </div>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-serif text-sm font-bold uppercase tracking-wide text-brand">
              Шпаргалка для родителей
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              Проект «Совета матерей»
            </span>
          </span>
        </Link>

        {user ? (
          <Link
            href="/profile"
            aria-label="Личный кабинет"
            className="shrink-0 rounded-full ring-2 ring-brand/20 ring-offset-2 ring-offset-card transition-transform hover:scale-105"
          >
            <Avatar name={user.name} color={user.avatarColor} size={36} />
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/10"
          >
            <LogIn className="size-3.5" />
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}
