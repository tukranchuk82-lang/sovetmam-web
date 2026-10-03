import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { getCurrentAppUser } from "@/lib/user-session";
import { getUserChatRegion } from "@/lib/chat-region";
import { REGIONS } from "@/lib/measures";
import { chooseChatRegionAction } from "../actions";

export const metadata = {
  title: "Выберите регион",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Только внутренние пути: next приходит из адреса, и вести по нему наружу нельзя. */
function safeNext(raw: string | undefined): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/profile/coordinator-chat";
}

export default async function ChooseRegionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentAppUser();
  const { next } = await searchParams;
  const target = safeNext(next);
  if (!user) redirect(`/login?next=${encodeURIComponent(target)}`);
  // Регион уже известен — выбирать нечего.
  if (await getUserChatRegion(user)) redirect(target);

  return (
    <div
      className="min-h-[75vh] px-4 py-5"
      style={{ background: "linear-gradient(180deg, #16233F 0%, #101A30 100%)" }}
    >
      <h1 className="text-xl font-extrabold tracking-tight text-white">Из какого вы региона?</h1>
      <p className="mt-1 text-sm text-white/60">
        От региона зависит, кто вам ответит: в одних регионах это координатор региона, в других —
        председатель.
      </p>

      <form action={chooseChatRegionAction} className="mt-5 rounded-3xl bg-[#F7F6F3] p-4">
        <input type="hidden" name="next" value={target} />
        <label className="block text-sm font-medium">
          Ваш регион <span className="text-[#8E1D2C]">*</span>
          <div className="relative mt-2">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              name="region"
              required
              defaultValue=""
              className="w-full appearance-none rounded-xl border border-black/[0.08] bg-white py-3 pl-9 pr-3 text-sm"
            >
              <option value="" disabled>
                Выберите регион
              </option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </label>
        <button
          type="submit"
          className="mt-4 h-12 w-full rounded-2xl bg-[#1B3A6B] text-sm font-semibold text-white active:scale-[0.99]"
        >
          Продолжить
        </button>
      </form>
    </div>
  );
}
