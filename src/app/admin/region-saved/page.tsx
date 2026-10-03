import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark, Heart, LayoutGrid, Users } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { listSavedByRegion } from "@/lib/region-insights";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { StatCard } from "@/components/admin/ui/primitives";

export const metadata = { title: "Избранное региона" };
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function plural(n: number, one: string, few: string, many: string): string {
  const d10 = n % 10;
  const d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return few;
  return many;
}

export default async function RegionSavedPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/region-saved");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  if (scope !== "coordinator") redirect("/admin");

  const region = await resolveRegion(staff, scope);
  const allRows = await listSavedByRegion(region);

  // Сводка: сколько раз сохранена каждая мера. Считаем по всем сохранениям, а не
  // по обрезанному списку ниже — иначе цифры занижались бы.
  const byMeasure = new Map<string, { title: string; count: number }>();
  for (const r of allRows) {
    const e = byMeasure.get(r.measureSlug) ?? { title: r.measureTitle ?? r.measureSlug, count: 0 };
    e.count += 1;
    byMeasure.set(r.measureSlug, e);
  }
  const summary = [...byMeasure.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "ru"));
  const top = Math.max(1, ...summary.map((s) => s.count));
  const people = new Set(allRows.map((r) => r.userId)).size;

  // Подробный журнал «кто что сохранил» — свежие сверху; без региона (просмотр
  // «на себе») строк под две тысячи, поэтому показываем только последние.
  const PREVIEW_LIMIT = 150;
  const log = region ? allRows : allRows.slice(0, PREVIEW_LIMIT);

  return (
    <AdminPage
      icon={<Heart />}
      title="Избранное региона"
      description={
        region
          ? `Какие меры сохраняют себе люди из региона «${region}» — не только региональные, любые. Ниже сводка: сколько раз сохранена каждая мера.`
          : "Избранное по всем регионам сразу. Ниже сводка: сколько раз сохранена каждая мера."
      }
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Всего сохранений" value={allRows.length} icon={<Bookmark />} color="rose" />
        <StatCard label="Людей сохраняли меры" value={people} icon={<Users />} color="blue" />
        <StatCard label="Разных мер сохранено" value={summary.length} icon={<LayoutGrid />} color="green" />
      </div>

      <section className="light-surface mt-4 rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          Сводка: сколько раз сохранена каждая мера
        </h2>

        {summary.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Пока никто из региона ничего не сохранил в избранное.
          </p>
        ) : (
          <ol className="mt-3 divide-y">
            {summary.map((s, i) => (
              <li key={s.slug} className="py-2.5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 shrink-0 text-right text-[13px] font-semibold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/catalog/${s.slug}`}
                      target="_blank"
                      className="text-[14px] font-semibold leading-snug text-[#20242c] hover:text-primary hover:underline"
                    >
                      {s.title}
                    </Link>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(s.count / top) * 100}%` }} />
                    </div>
                  </div>
                  <span className="shrink-0 text-right">
                    <b className="text-[17px] font-bold tabular-nums">{s.count}</b>
                    <span className="block text-[11px] text-muted-foreground">
                      {plural(s.count, "раз", "раза", "раз")}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {log.length > 0 && (
        <details className="light-surface mt-4 rounded-2xl border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
            Кто и что сохранял{!region ? ` (последние ${log.length})` : ""}
          </summary>
          <ul className="divide-y border-t">
            {log.map((r, i) => (
              <li key={`${r.userId}-${r.measureSlug}-${i}`} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/catalog/${r.measureSlug}`}
                    target="_blank"
                    className="min-w-0 truncate text-[13.5px] font-semibold leading-snug text-primary hover:underline"
                  >
                    {r.measureTitle ?? r.measureSlug}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(r.savedAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {r.userName} · {r.userEmail}
                  {!region && r.region ? ` · ${r.region}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </AdminPage>
  );
}
