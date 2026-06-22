import Link from "next/link";
import { LogIn } from "lucide-react";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { Avatar } from "@/components/avatar";
import { OrgName } from "@/components/org-name";

// Хедер по утверждённому дизайну: плавающая белая карточка на светлом фоне,
// логотип слева, название (Playfair) + подзаголовок (Inter) по центру,
// pill-кнопка «Войти» справа — тихая, полупрозрачная (синий тинт бренд-кита),
// чтобы не перетягивать внимание с основного действия.
export async function AppHeader() {
  const user = await getCurrentDemoUser();

  return (
    <header className="relative z-20 shrink-0 border-b border-black/10 bg-white shadow-[0_6px_18px_-6px_rgba(0,0,0,0.20)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Совет матерей"
            width={52}
            height={52}
            className="size-[52px] shrink-0 object-contain"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span
              className="text-[22px] font-semibold leading-none text-[#8E1D2C]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              <OrgName />
            </span>
            <span
              className="mt-1.5 text-[11px] leading-tight text-[#666666]"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              общероссийская общественная организация
            </span>
          </span>
        </Link>

        {user ? (
          <Link href="/profile" aria-label="Личный кабинет" className="shrink-0">
            <Avatar name={user.name} color={user.avatarColor} size={44} />
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#3A4D63]/20 bg-[#3A4D63]/12 px-5 text-sm font-semibold text-[#3A4D63]"
          >
            <LogIn className="size-4" />
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}
