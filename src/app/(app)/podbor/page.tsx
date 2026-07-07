import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { PodborForm } from "@/components/podbor-form";
import { getAllMeasures } from "@/lib/measures-db";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { getCurrentAppUser } from "@/lib/user-session";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Подбор по анкете" };
export const dynamic = "force-dynamic";

export default async function PodborPage() {
  const demoUser = await getCurrentDemoUser();
  const appUser = demoUser ? null : await getCurrentAppUser();

  if (!demoUser && !appUser) {
    return <AuthGate />;
  }

  const measures = await getAllMeasures();
  // Восстанавливаем последнюю заполненную анкету, чтобы подбор не слетал после
  // перехода к мере и обратно (сохраняется в app_users.survey при отправке).
  const savedSurvey = appUser?.survey ?? null;
  return <PodborForm measures={measures} savedSurvey={savedSurvey} />;
}

function AuthGate() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_-8px_rgba(142,29,44,0.55)]">
        <Sparkles className="size-8" />
      </div>
      <h1
        className="mt-5 text-[22px] font-normal leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Доступно только авторизованным пользователям
      </h1>
      <p className="mt-2.5 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
        Чтобы мы могли подобрать все доступные меры под вашу индивидуальную
        жизненную ситуацию, авторизуйтесь или пройдите регистрацию.
      </p>
      <Link
        href="/login?next=/podbor"
        className={cn(buttonVariants(), "mt-6 h-11 gap-2 px-6")}
      >
        <LogIn className="size-4" />
        Войти
      </Link>
      <Link
        href="/catalog"
        className="mt-3 text-sm text-muted-foreground hover:text-foreground"
      >
        Сначала посмотреть каталог →
      </Link>
    </div>
  );
}
