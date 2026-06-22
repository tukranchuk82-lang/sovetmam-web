import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { PodborForm } from "@/components/podbor-form";
import { getAllMeasures } from "@/lib/measures-db";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Подбор по анкете" };
export const dynamic = "force-dynamic";

export default async function PodborPage() {
  const user = await getCurrentDemoUser();

  if (!user) {
    return <AuthGate />;
  }

  const measures = await getAllMeasures();
  return <PodborForm measures={measures} />;
}

function AuthGate() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_-8px_rgba(142,29,44,0.55)]">
        <Sparkles className="size-8" />
      </div>
      <h1 className="mt-5 text-xl font-extrabold tracking-tight">
        Подбор мер — после входа
      </h1>
      <p className="mt-2 max-w-[280px] text-sm text-muted-foreground">
        Чтобы пройти анкету и сохранить результат в личном кабинете, войдите
        через Telegram, ВКонтакте или MAX. Каталог можно смотреть без входа.
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
