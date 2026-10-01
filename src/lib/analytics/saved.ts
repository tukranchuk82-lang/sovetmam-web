import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSaved, loadUsersLite } from "@/lib/analytics/data";
import { dayBuckets, deltaPct, inPeriod, inPrevPeriod, localDay, type Period } from "@/lib/analytics/period";

/** Отчёт «Избранное»: что люди сохраняют себе. */

export interface SavedReport {
  totalSaved: number;
  savedNow: { value: number; delta: number | null };
  people: { value: number; delta: number | null };
  totalPeople: number;
  usersWithSaved: number;
  perDay: { day: string; value: number }[];
  top: { slug: string; title: string; value: number; people: number; href: string }[];
}

export async function getSavedReport(period: Period): Promise<SavedReport> {
  const [saved, users] = await Promise.all([loadSaved(), loadUsersLite()]);
  const realIds = new Set(users.filter((u) => u.role === "user").map((u) => u.id));
  const rows = saved.filter((s) => realIds.has(s.user_id));

  const now = rows.filter((s) => inPeriod(s.created_at, period));
  const prev = rows.filter((s) => inPrevPeriod(s.created_at, period));
  const peopleNow = new Set(now.map((s) => s.user_id)).size;
  const peoplePrev = new Set(prev.map((s) => s.user_id)).size;

  const earliest = rows.length ? new Date(rows[rows.length - 1].created_at) : undefined;
  const days = dayBuckets(period, earliest);
  const perDay = new Map(days.map((d) => [d, 0]));
  for (const s of now) {
    const k = localDay(new Date(s.created_at));
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }

  const bySlug = new Map<string, { count: number; users: Set<string> }>();
  for (const s of now) {
    const e = bySlug.get(s.measure_slug) ?? { count: 0, users: new Set<string>() };
    e.count += 1;
    e.users.add(s.user_id);
    bySlug.set(s.measure_slug, e);
  }
  const topSlugs = [...bySlug.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 25);

  const titles = new Map<string, string>();
  if (topSlugs.length) {
    const sb = createSupabaseAdminClient();
    const { data } = await sb.from("measures").select("slug, title").in("slug", topSlugs.map(([s]) => s));
    for (const m of data ?? []) titles.set(m.slug as string, m.title as string);
  }

  return {
    totalSaved: rows.length,
    savedNow: { value: now.length, delta: deltaPct(now.length, prev.length) },
    people: { value: peopleNow, delta: deltaPct(peopleNow, peoplePrev) },
    totalPeople: realIds.size,
    usersWithSaved: new Set(rows.map((s) => s.user_id)).size,
    perDay: days.map((day) => ({ day, value: perDay.get(day) ?? 0 })),
    top: topSlugs.map(([slug, e]) => ({
      slug,
      title: titles.get(slug) ?? slug,
      value: e.count,
      people: e.users.size,
      href: `/admin/measures/${slug}`,
    })),
  };
}
