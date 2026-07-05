import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { getCurrentAppUser } from "@/lib/user-session";
import { EmailAuthFlow } from "@/components/email-auth-flow";

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
    </div>
  );
}
