import "server-only";
import { loadInquiriesLite, loadSaved, loadUsersLite } from "@/lib/analytics/data";
import { inPeriod, type Period } from "@/lib/analytics/period";

/** Отчёт «Регионы»: людей и обращений на каждый регион. */

export const NO_REGION = "Регион не указан";

export interface RegionRow {
  region: string;
  /** Все люди региона (по региону из анкеты). */
  people: number;
  /** Из них пришли за выбранный период. */
  newPeople: number;
  /** Обращений за период. */
  inquiries: number;
  /** Обращений без ответа сейчас (за всё время). */
  unanswered: number;
  /** Сохранено мер в избранное людьми региона. */
  saved: number;
  /** Обращений на 100 человек региона. */
  per100: number;
}

export interface RegionsReport {
  rows: RegionRow[];
  totals: { people: number; newPeople: number; inquiries: number; unanswered: number; saved: number };
  withRegion: number;
}

export async function getRegionsReport(period: Period): Promise<RegionsReport> {
  const [users, inquiries, saved] = await Promise.all([loadUsersLite(), loadInquiriesLite(), loadSaved()]);
  const people = users.filter((u) => u.role === "user");

  const rows = new Map<string, RegionRow>();
  const row = (region: string): RegionRow => {
    let r = rows.get(region);
    if (!r) {
      r = { region, people: 0, newPeople: 0, inquiries: 0, unanswered: 0, saved: 0, per100: 0 };
      rows.set(region, r);
    }
    return r;
  };

  const regionOf = new Map<string, string>();
  for (const u of people) {
    const region = u.region || NO_REGION;
    regionOf.set(u.id, region);
    const r = row(region);
    r.people += 1;
    if (inPeriod(u.created_at, period)) r.newPeople += 1;
  }

  for (const i of inquiries) {
    const r = row(i.region || NO_REGION);
    if (inPeriod(i.created_at, period)) r.inquiries += 1;
    if (i.status === "new") r.unanswered += 1;
  }

  for (const s of saved) {
    const region = regionOf.get(s.user_id);
    if (region) row(region).saved += 1;
  }

  const list = [...rows.values()].map((r) => ({
    ...r,
    per100: r.people > 0 ? Math.round((r.inquiries / r.people) * 1000) / 10 : 0,
  }));
  list.sort((a, b) => b.people - a.people);

  const totals = list.reduce(
    (t, r) => ({
      people: t.people + r.people,
      newPeople: t.newPeople + r.newPeople,
      inquiries: t.inquiries + r.inquiries,
      unanswered: t.unanswered + r.unanswered,
      saved: t.saved + r.saved,
    }),
    { people: 0, newPeople: 0, inquiries: 0, unanswered: 0, saved: 0 },
  );

  return {
    rows: list,
    totals,
    withRegion: list.filter((r) => r.region !== NO_REGION).reduce((s, r) => s + r.people, 0),
  };
}
