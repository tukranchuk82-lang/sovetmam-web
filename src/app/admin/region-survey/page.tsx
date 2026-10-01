import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { countSurveyFillersByRegion, listSurveyFillersByRegion } from "@/lib/region-insights";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Пользователи региона" };
export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function RegionSurveyPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/region-survey");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  if (scope !== "coordinator") redirect("/admin");

  const region = await resolveRegion(staff, scope);
  const allUsers = await listSurveyFillersByRegion(region);
  // Без региона (просмотр «на себе» у владельца/техспеца) людей набирается
  // больше тысячи — у настоящего координатора их по одному региону в разы
  // меньше, но список всё равно нужно чем-то ограничить. «Всего» считаем
  // отдельным count-запросом: PostgREST сам режет выборку на 1000 строк,
  // так что длина allUsers для реального общего числа не годится.
  const PREVIEW_LIMIT = 150;
  const users = region ? allUsers : allUsers.slice(0, PREVIEW_LIMIT);
  const total = region ? users.length : await countSurveyFillersByRegion(null);

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<Users />}
        title="Пользователи региона"
        description={
          region
            ? `Кто в вашем регионе — «${region}» — заполнил анкету подбора мер: ${total} человек.`
            : `Вы видите эту страницу по своему региону. Выберите регион справа сверху, чтобы посмотреть его вживую, — пока ниже все, кто заполнил анкету по всем регионам сразу: самые свежие ${users.length} из ${total}.`
        }
      />

      <div className="mt-5 space-y-2">
        {users.length === 0 && (
          <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
            Пока никто из региона не заполнил анкету.
          </p>
        )}
        {users.map((u) => (
          <div key={u.id} className="rounded-2xl border bg-card p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-semibold leading-snug">
                {u.firstName} {u.lastName}
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(u.surveyUpdatedAt)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{u.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {!region && u.region && (
                <span className="rounded-full bg-muted px-2 py-0.5">{u.region}</span>
              )}
              {u.childrenCount != null && (
                <span className="rounded-full bg-muted px-2 py-0.5">
                  {u.childrenCount === 1 ? "1 ребёнок" : `детей: ${u.childrenCount}`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
