import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { getCurrentAppUser } from "@/lib/user-session";
import { EmailAuthFlow } from "@/components/email-auth-flow";
import { LoginForm } from "@/components/login-form";
import { OrgName } from "@/components/org-name";

export const metadata = { title: "Вход" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [appUser, demoUser] = await Promise.all([
    getCurrentAppUser(),
    getCurrentDemoUser(),
  ]);
  if (appUser || demoUser) redirect("/profile");

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-10">
      {/* Заголовок и подпись живут внутри формы — на шагах регистрации/кода
          они скрываются (см. EmailAuthFlow). */}
      <Suspense fallback={null}>
        <EmailAuthFlow />
      </Suspense>

      <Link
        href="/catalog"
        className="mt-6 text-sm text-[#6b7078] hover:text-[#1A1A1A]"
      >
        ← Без входа, посмотреть каталог
      </Link>

      {/* Демо-вход — только для прототипа/тестирования. Убрать перед боевой
          выкаткой вместе с плашкой «Прототип». */}
      <details className="mt-8 w-full max-w-[340px]">
        <summary className="cursor-pointer list-none text-center text-xs text-[#b0b4ba] hover:text-[#8a8f97]">
          Демо-вход (прототип)
        </summary>
        <div className="mt-3 flex flex-col items-center rounded-2xl border border-black/[0.06] bg-[#f6f7f9] p-4">
          <p className="mb-2 text-center text-[11px] text-[#8a8f97]">
            Имитация входа через мессенджер для демонстрации.{" "}
            <OrgName />
          </p>
          <LoginForm />
        </div>
      </details>
    </div>
  );
}
