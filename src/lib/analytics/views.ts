import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSaved, loadViews } from "@/lib/analytics/data";
import { dayBuckets, deltaPct, inPeriod, inPrevPeriod, localDay, type Period } from "@/lib/analytics/period";

/** Отчёт «Что смотрят»: какие карточки мер открывают чаще всего. */

export interface ViewsReport {
  views: { value: number; delta: number | null };
  people: { value: number; delta: number | null };
  measures: number;
  /** С какого дня ведётся учёт; null — просмотров ещё нет. */
  since: string | null;
  perDay: { day: string; value: number }[];
  top: { slug: string; title: string; views: number; people: number; saved: number; href: string }[];
}

export async function getViewsReport(period: Period): Promise<ViewsReport> {
  const [views, saved] = await Promise.all([loadViews(), loadSaved()]);

  const now = views.filter((v) => inPeriod(v.created_at, period));
  const prev = views.filter((v) => inPrevPeriod(v.created_at, period));
  const who = (rows: typeof views) => new Set(rows.map((v) => v.user_id ?? v.visitor ?? v.created_at)).size;

  const earliest = views.length ? new Date(views[views.length - 1].created_at) : undefined;
  const days = dayBuckets(period, earliest);
  const perDay = new Map(days.map((d) => [d, 0]));
  for (const v of now) {
    const k = localDay(new Date(v.created_at));
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }

  const bySlug = new Map<string, { views: number; people: Set<string> }>();
  for (const v of now) {
    const e = bySlug.get(v.slug) ?? { views: 0, people: new Set<string>() };
    e.views += 1;
    e.people.add(v.user_id ?? v.visitor ?? v.created_at);
    bySlug.set(v.slug, e);
  }
  const savedBySlug = new Map<string, number>();
  for (const s of saved) if (inPeriod(s.created_at, period)) savedBySlug.set(s.measure_slug, (savedBySlug.get(s.measure_slug) ?? 0) + 1);

  const topSlugs = [...bySlug.entries()].sort((a, b) => b[1].views - a[1].views).slice(0, 30);
  const titles = new Map<string, string>();
  if (topSlugs.length) {
    const sb = createSupabaseAdminClient();
    const { data } = await sb.from("measures").select("slug, title").in("slug", topSlugs.map(([s]) => s));
    for (const m of data ?? []) titles.set(m.slug as string, m.title as string);
  }

  return {
    views: { value: now.length, delta: deltaPct(now.length, prev.length) },
    people: { value: who(now), delta: deltaPct(who(now), who(prev)) },
    measures: bySlug.size,
    since: earliest ? localDay(earliest) : null,
    perDay: days.map((day) => ({ day, value: perDay.get(day) ?? 0 })),
    top: topSlugs.map(([slug, e]) => ({
      slug,
      title: titles.get(slug) ?? slug,
      views: e.views,
      people: e.people.size,
      saved: savedBySlug.get(slug) ?? 0,
      href: `/admin/measures/${slug}`,
    })),
  };
}
