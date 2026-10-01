import "server-only";
import {
  loadDeviceEvents,
  loadInquiriesLite,
  loadLogins,
  loadUsersLite,
} from "@/lib/analytics/data";
import { sourceLabel } from "@/lib/analytics/labels";
import {
  dayBuckets,
  deltaPct,
  inPeriod,
  inPrevPeriod,
  localDay,
  type Period,
} from "@/lib/analytics/period";

/** Отчёт «Обзор аудитории»: сколько людей приходит, кто из них живой и откуда. */

export interface CountWithDelta {
  value: number;
  delta: number | null;
}

export interface AudienceOverview {
  totalPeople: number;
  newPeople: CountWithDelta;
  activePeople: CountWithDelta;
  surveyed: CountWithDelta;
  installs: CountWithDelta;
  withMessenger: number;
  verified: number;
  /** Регистрации по дням выбранного периода. */
  registrations: { day: string; value: number }[];
  /** Новые люди периода по источникам (utm_source). */
  sources: { label: string; value: number }[];
  /** Новые люди периода по регионам. */
  regions: { label: string; value: number; inquiries: number }[];
}

const NO_REGION = "Регион не указан";

function count<T>(rows: T[], get: (r: T) => string, pred: (r: T) => boolean): number {
  return rows.filter(pred).length;
}

export async function getAudienceOverview(period: Period): Promise<AudienceOverview> {
  const [users, logins, devices, inquiries] = await Promise.all([
    loadUsersLite(),
    loadLogins(),
    loadDeviceEvents(),
    loadInquiriesLite(),
  ]);

  // Кабинеты сотрудников в аудиторию не входят: они искажают и «новых», и «активных».
  const people = users.filter((u) => u.role === "user");

  const newNow = people.filter((u) => inPeriod(u.created_at, period));
  const newPrev = people.filter((u) => inPrevPeriod(u.created_at, period));

  const uniqUsers = (rows: { user_id: string; created_at: string }[], pred: (iso: string) => boolean) =>
    new Set(rows.filter((r) => pred(r.created_at)).map((r) => r.user_id)).size;
  const activeNow = uniqUsers(logins, (iso) => inPeriod(iso, period));
  const activePrev = uniqUsers(logins, (iso) => inPrevPeriod(iso, period));

  const surveyedNow = people.filter((u) => u.survey_updated_at && inPeriod(u.survey_updated_at, period)).length;
  const surveyedPrev = people.filter((u) => u.survey_updated_at && inPrevPeriod(u.survey_updated_at, period)).length;

  const installs = devices.filter((d) => d.kind === "install");
  const installNow = new Set(installs.filter((d) => inPeriod(d.created_at, period)).map((d) => d.visitor ?? d.created_at)).size;
  const installPrev = new Set(installs.filter((d) => inPrevPeriod(d.created_at, period)).map((d) => d.visitor ?? d.created_at)).size;

  // Регистрации по дням
  const earliest = people.length ? new Date(people[people.length - 1].created_at) : undefined;
  const days = dayBuckets(period, earliest);
  const perDay = new Map(days.map((d) => [d, 0]));
  for (const u of newNow) {
    const k = localDay(new Date(u.created_at));
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }

  const group = (get: (u: (typeof people)[number]) => string) => {
    const m = new Map<string, number>();
    for (const u of newNow) m.set(get(u), (m.get(get(u)) ?? 0) + 1);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };

  const inqByRegion = new Map<string, number>();
  for (const i of inquiries) {
    if (!inPeriod(i.created_at, period)) continue;
    const r = i.region ?? NO_REGION;
    inqByRegion.set(r, (inqByRegion.get(r) ?? 0) + 1);
  }

  return {
    totalPeople: people.length,
    newPeople: { value: newNow.length, delta: deltaPct(newNow.length, newPrev.length) },
    activePeople: { value: activeNow, delta: deltaPct(activeNow, activePrev) },
    surveyed: { value: surveyedNow, delta: deltaPct(surveyedNow, surveyedPrev) },
    installs: { value: installNow, delta: deltaPct(installNow, installPrev) },
    withMessenger: count(people, () => "", (u) => u.messenger_connected),
    verified: count(people, () => "", (u) => Boolean(u.email_verified_at)),
    registrations: days.map((day) => ({ day, value: perDay.get(day) ?? 0 })),
    sources: group((u) => sourceLabel(u.utm_source)),
    regions: group((u) => u.region || NO_REGION).map((r) => ({
      ...r,
      inquiries: inqByRegion.get(r.label) ?? 0,
    })),
  };
}
