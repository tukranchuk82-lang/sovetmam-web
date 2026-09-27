import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { listSavedByRegion } from "@/lib/region-insights";
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

  const region = staff.role === "coordinator" ? staff.region : null;
  const rows = await listSavedByRegion(region);

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<Heart />}
        title="Избранное региона"
        description={
          region
            ? `Какие меры сохраняют себе люди из «${region}» — не только региональные, любые.`
            : "Владелец и техспец видят сохранённое по всем регионам сразу — у вас самих региона не закреплено."
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
                className="min-w-0 truncate font-semibold leading-snug text-brand hover:underline"
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
