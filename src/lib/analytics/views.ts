import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSaved, loadViews, type ViewLite } from "@/lib/analytics/data";
import { dayBuckets, deltaPct, inPeriod, inPrevPeriod, localDay, type Period } from "@/lib/analytics/period";

/**
 * Отчёт «Что смотрят»: какие карточки мер открывают и насколько глубоко.
 *
 * Просмотр — это открытая карточка (раз в сутки на устройство и меру). Глубина —
 * то, что человек делал на странице: сколько был, как далеко прокрутил, до каких
 * разделов дошёл и что нажал. Глубина копится только с момента, когда включили
 * её учёт, поэтому считаем её по просмотрам, где данные есть (tracked), и честно
 * пишем их число.
 */

export const SOURCE_LABEL: Record<string, string> = {
  podbor: "Из подборки мер",
  catalog: "Из каталога",
  search: "Из поиска",
  saved: "Из избранного",
  topics: "Из тем и жизненных ситуаций",
  home: "С главной страницы",
  profile: "Из личного кабинета",
  external: "По ссылке снаружи",
  direct: "Напрямую",
  unknown: "Не определено",
};

const SECTION_LABEL: Record<string, string> = {
  eligibility: "Кому положено",
  howto: "Как оформить",
  documents: "Какие документы нужны",
  tips: "Полезно знать",
};

/** Прокрутили почти до конца — считаем, что дочитали. */
const READ_SCROLL = 75;

export interface MeasureViewRow {
  slug: string;
  title: string;
  views: number;
  people: number;
  saved: number;
  /** Среднее время на странице, секунды; null — данных о времени нет. */
  avgSeconds: number | null;
  /** Доля дочитавших (прокрутили до конца), %; null — данных нет. */
  readPct: number | null;
  /** Доля сделавших действие (ссылка, вопрос), %; null — данных нет. */
  actionPct: number | null;
  href: string;
}

export interface ViewsReport {
  views: { value: number; delta: number | null };
  people: { value: number; delta: number | null };
  measures: number;
  /** С какого дня ведётся учёт; null — просмотров ещё нет. */
  since: string | null;
  /** Просмотры, по которым есть данные о поведении на странице. */
  tracked: number;
  avgSeconds: number | null;
  readPct: number | null;
  howtoPct: number | null;
  actionPct: number | null;
  perDay: { day: string; value: number }[];
  sources: { label: string; value: number }[];
  /** Какая доля просмотров дошла до каждого раздела карточки. */
  sections: { label: string; value: number }[];
  regionsAvailable: string[];
  top: MeasureViewRow[];
}

const hasEngagement = (v: ViewLite) =>
  v.dwell_seconds > 0 || v.max_scroll > 0 || v.sections.length > 0 || v.actions.length > 0;

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);

function avg(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((s, x) => s + x, 0) / values.length) : null;
}

export async function getViewsReport(period: Period, region: string | null = null): Promise<ViewsReport> {
  const [allViews, saved] = await Promise.all([loadViews(), loadSaved()]);
  const regionsAvailable = [...new Set(allViews.map((v) => v.region).filter((r): r is string => Boolean(r)))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
  const views = region ? allViews.filter((v) => v.region === region) : allViews;

  const now = views.filter((v) => inPeriod(v.created_at, period));
  const prev = views.filter((v) => inPrevPeriod(v.created_at, period));
  const who = (rows: ViewLite[]) => new Set(rows.map((v) => v.user_id ?? v.visitor ?? v.created_at)).size;

  const earliest = views.length ? new Date(views[views.length - 1].created_at) : undefined;
  const days = dayBuckets(period, earliest);
  const perDay = new Map(days.map((d) => [d, 0]));
  for (const v of now) {
    const k = localDay(new Date(v.created_at));
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }

  const tracked = now.filter(hasEngagement);
  const dwell = tracked.filter((v) => v.dwell_seconds > 0).map((v) => v.dwell_seconds);

  const sourceCount = new Map<string, number>();
  for (const v of now) {
    const k = v.source ?? "unknown";
    sourceCount.set(k, (sourceCount.get(k) ?? 0) + 1);
  }

  // По мерам.
  const bySlug = new Map<string, ViewLite[]>();
  for (const v of now) {
    const arr = bySlug.get(v.slug) ?? [];
    arr.push(v);
    bySlug.set(v.slug, arr);
  }
  const savedBySlug = new Map<string, number>();
  for (const s of saved) {
    if (inPeriod(s.created_at, period)) savedBySlug.set(s.measure_slug, (savedBySlug.get(s.measure_slug) ?? 0) + 1);
  }

  const topSlugs = [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 40);
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
    tracked: tracked.length,
    avgSeconds: avg(dwell),
    readPct: pct(tracked.filter((v) => v.max_scroll >= READ_SCROLL).length, tracked.length),
    howtoPct: pct(tracked.filter((v) => v.sections.includes("howto")).length, tracked.length),
    actionPct: pct(tracked.filter((v) => v.actions.length > 0).length, tracked.length),
    perDay: days.map((day) => ({ day, value: perDay.get(day) ?? 0 })),
    sources: [...sourceCount.entries()]
      .map(([k, value]) => ({ label: SOURCE_LABEL[k] ?? k, value }))
      .sort((a, b) => b.value - a.value),
    sections: Object.entries(SECTION_LABEL).map(([key, label]) => ({
      label,
      value: tracked.filter((v) => v.sections.includes(key)).length,
    })),
    regionsAvailable,
    top: topSlugs.map(([slug, rows]) => {
      const t = rows.filter(hasEngagement);
      return {
        slug,
        title: titles.get(slug) ?? slug,
        views: rows.length,
        people: who(rows),
        saved: savedBySlug.get(slug) ?? 0,
        avgSeconds: avg(t.filter((v) => v.dwell_seconds > 0).map((v) => v.dwell_seconds)),
        readPct: pct(t.filter((v) => v.max_scroll >= READ_SCROLL).length, t.length),
        actionPct: pct(t.filter((v) => v.actions.length > 0).length, t.length),
        href: `/catalog/${slug}`,
      };
    }),
  };
}
