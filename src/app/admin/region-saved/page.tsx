import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { countSavedByRegion, listSavedByRegion } from "@/lib/region-insights";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Избранное региона" };
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function RegionSavedPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/region-saved");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  if (scope !== "coordinator") redirect("/admin");

  const region = await resolveRegion(staff, scope);
  const allRows = await listSavedByRegion(region);
  // Без региона (просмотр «на себе» у владельца/техспеца) строк набирается
  // под две тысячи — у настоящего координатора их по одному региону в разы
  // меньше, но здесь список всё равно нужно чем-то ограничить, иначе страница
  // тянется на сотни экранов.
  const PREVIEW_LIMIT = 150;
  const rows = region ? allRows : allRows.slice(0, PREVIEW_LIMIT);
  const total = region ? rows.length : await countSavedByRegion(null);

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<Heart />}
        title="Избранное региона"
        description={
          region
            ? `Какие меры сохраняют себе люди из вашего региона — «${region}» — не только региональные, любые.`
            : `Вы видите эту страницу по своему региону. Выберите регион справа сверху, чтобы посмотреть его вживую, — пока ниже избранное по всем регионам сразу: самые свежие ${rows.length} из ${total}.`
        }
      />

      <div className="mt-5 space-y-2">
        {rows.length === 0 && (
          <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
            Пока никто из региона ничего не сохранил в избранное.
          </p>
        )}
        {rows.map((r, i) => (
          <div key={`${r.userId}-${r.measureSlug}-${i}`} className="rounded-2xl border bg-card p-3.5">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/catalog/${r.measureSlug}`}
                target="_blank"
                className="min-w-0 truncate font-semibold leading-snug text-primary hover:underline"
              >
                {r.measureTitle ?? r.measureSlug}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(r.savedAt)}</span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {r.userName} · {r.userEmail}
              {!region && r.region ? ` · ${r.region}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
