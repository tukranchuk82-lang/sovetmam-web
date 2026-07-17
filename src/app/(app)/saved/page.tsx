import Link from "next/link";
import { Heart, LogIn } from "lucide-react";
import { MeasureCard } from "@/components/measure-card";
import { getCurrentAppUser } from "@/lib/user-session";
import { listSavedSlugs } from "@/lib/saved-measures-db";
import { getMeasuresBySlugs } from "@/lib/measures-db";

export const metadata = { title: "Избранное" };
export const dynamic = "force-dynamic";

function Header() {
  return (
    <div className="flex items-center gap-2">
      <Heart className="size-5 fill-[#8E1D2C] text-[#8E1D2C]" />
      <h1
        className="text-xl text-[#1E2A3A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Избранное
      </h1>
    </div>
  );
}

export default async function SavedPage() {
  const user = await getCurrentAppUser();

  // Гость видит раздел (это вкладка меню), но не список, а приглашение войти —
  // без резкого редиректа на авторизацию.
  if (!user) {
    return (
      <div className="px-4 py-5">
        <Header />
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#8E1D2C]/10 text-[#8E1D2C]">
            <Heart className="size-6 fill-current" />
          </div>
          <p className="mt-3 text-sm font-medium">Здесь будут ваши меры</p>
          <p className="mx-auto mt-1.5 max-w-[280px] text-xs text-muted-foreground">
            Войдите, чтобы отмечать меры сердечком и возвращаться к ним в любой
            момент — они сохранятся в вашем аккаунте.
          </p>
          <Link
            href="/login?next=/saved"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#8E1D2C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7A1826]"
          >
            <LogIn className="size-4" />
            Войти
          </Link>
        </div>
      </div>
    );
  }

  const slugs = await listSavedSlugs(user.id);
  const measures = await getMeasuresBySlugs(slugs);

  return (
    <div className="px-4 py-5">
      <Header />

      {measures.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center">
          <p className="text-sm font-medium">Пока ничего не сохранено</p>
          <p className="mx-auto mt-1.5 max-w-[260px] text-xs text-muted-foreground">
            Нажимайте на сердечко у меры в каталоге — она появится здесь, чтобы
            быстро вернуться.
          </p>
          <Link
            href="/catalog"
            className="mt-4 inline-flex items-center rounded-xl bg-[#3A4D63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2F3F52]"
          >
            Открыть каталог
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {measures.map((m) => (
            <MeasureCard key={m.slug} measure={m} />
          ))}
        </div>
      )}
    </div>
  );
}
