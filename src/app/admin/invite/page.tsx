import { redirect } from "next/navigation";
import { UserPlus, Info } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { countInvited, inviteCode, buildInviteParams } from "@/lib/coordinator-insights";
import { absoluteUrl } from "@/lib/site";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { StatCard } from "@/components/admin/ui/primitives";
import { ShareButton } from "@/components/share-button";

export const metadata = { title: "Пригласить пользователя" };
export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/invite");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  if (scope !== "coordinator") redirect("/admin");

  const region = await resolveRegion(staff, scope);
  const isCoordinator = staff.role === "coordinator";
  // Владелец и техспец, смотрящие кабинет «на себе», своей ссылки не имеют:
  // показываем образец с пометкой, чтобы его не разослали вместо настоящей.
  const code = isCoordinator ? inviteCode(staff.id) : "obrazec";
  const invited = isCoordinator ? await countInvited(code) : 0;

  const utm = buildInviteParams(isCoordinator ? staff.id : null, region);

  const link = new URL(absoluteUrl("/"));
  for (const [k, v] of Object.entries(utm)) link.searchParams.set(k, v);

  return (
    <AdminPage
      icon={<UserPlus />}
      title="Пригласить пользователя"
      description="Ваша личная ссылка на «Шпаргалку для родителей». По метке в ней видно, сколько человек пришло от вас."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Зарегистрировались по вашей ссылке" value={invited} tone="accent" />
      </div>

      <section className="mt-5 light-surface rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Ваша ссылка</h2>
        <p className="mt-2 break-all rounded-xl bg-muted px-3 py-2.5 text-[13px] leading-snug text-foreground/80">
          {decodeURI(link.toString())}
        </p>
        <div className="mt-3 max-w-sm">
          <ShareButton
            path="/"
            utm={utm}
            variant="wide"
            title="Шпаргалка для родителей"
            text="Шпаргалка для родителей: какие меры поддержки положены семье с детьми. Подбор за пять минут."
          />
        </div>
        <p className="mt-3 text-[12.5px] leading-snug text-muted-foreground">
          Нажмите «Поделиться»: можно скопировать ссылку или сразу отправить в Telegram, MAX или ВКонтакте.
        </p>
      </section>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-[12.5px] leading-snug text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        {isCoordinator
          ? "Считаем тех, кто перешёл по ссылке и зарегистрировался. Человек, который уже был зарегистрирован раньше, в счёт не попадает."
          : "Это образец: у настоящего координатора ссылка личная, с его меткой. Не рассылайте образец — переходы по нему никому не засчитаются."}
      </p>
    </AdminPage>
  );
}
