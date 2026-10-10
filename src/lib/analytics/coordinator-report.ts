import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/supabase/paged";
import { getAppUserById } from "@/lib/onboarding-db";
import { INVITE_SOURCE, inviteCode } from "@/lib/coordinator-insights";
import { inPeriod, type Period } from "@/lib/analytics/period";

/**
 * Отчёт по работе одного координатора — для владельца, техспеца и аналитика.
 *
 * Считаем только то, что реально записано, и честно говорим, где данные
 * неполные:
 *  - чат с людьми ведётся на весь регион, а не на конкретного человека, поэтому
 *    ответы считаются по региону (если в регионе несколько координаторов — это
 *    общий результат, об этом сказано в отчёте);
 *  - просмотры разделов кабинета пишутся только с момента включения журнала.
 */

export interface CoordinatorReport {
  coordinator: { id: string; name: string; email: string; region: string | null; since: string };
  /** Сколько координаторов в этом регионе (если больше одного, ответы в чате общие). */
  sameRegionCoordinators: number;

  login: { count: number; activeDays: number; lastAt: string | null; viaInstalledPct: number | null };
  cabinet: {
    views: number;
    activeDays: number;
    lastAt: string | null;
    sections: { section: string; count: number }[];
    trackedSince: string | null;
  };
  chat: {
    /** Сообщений от людей за период. */
    received: number;
    /** Ответов региона за период. */
    replied: number;
    /** Сколько разных людей написало за период. */
    people: number;
    /** Бесед, где сейчас последнее слово за человеком. */
    waitingNow: number;
    /** Самая долгая из них, часов. */
    longestWaitHours: number | null;
    /** Медианное время до первого ответа, минут (по обращениям периода). */
    medianReplyMin: number | null;
    /** Доля вопросов, на которые ответили в течение суток. */
    within24hPct: number | null;
    /** Сколько вопросов вошло в расчёт времени ответа. */
    answeredCount: number;
  };
  inquiries: {
    received: number;
    answered: number;
    unanswered: number;
    byThisCoordinator: number;
    medianReplyHours: number | null;
  };
  invites: {
    code: string;
    total: number;
    inPeriod: number;
    filledSurvey: number;
    wroteToChat: number;
  };
  region: { people: number; newPeople: number; measureViews: number };
  /** Короткие выводы по фактам: чему стоит уделить внимание. */
  flags: { tone: "warn" | "ok" | "info"; text: string }[];
}

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" });
}

interface ChatRow {
  user_id: string;
  author: "coordinator" | "user";
  created_at: string;
}


type ChatBlock = CoordinatorReport["chat"];

/**
 * Разбор переписки региона: сколько писали и отвечали, кто ждёт ответа,
 * сколько времени проходит до первого ответа. «Ожидание» начинается с первого
 * сообщения человека в серии и заканчивается ответом координатора.
 */
function analyzeChat(chat: ChatRow[], period: Period, now: number): ChatBlock {
  const threads = new Map<string, ChatRow[]>();
  for (const m of chat) {
    const list = threads.get(m.user_id) ?? [];
    list.push(m);
    threads.set(m.user_id, list);
  }
  let received = 0;
  let replied = 0;
  const writers = new Set<string>();
  let waitingNow = 0;
  let longestWait = 0;
  const replyTimes: number[] = [];
  for (const [userId, list] of threads) {
    let awaitingSince: number | null = null;
    for (const m of list) {
      const t = new Date(m.created_at).getTime();
      const inP = inPeriod(m.created_at, period);
      if (m.author === "user") {
        if (inP) {
          received++;
          writers.add(userId);
        }
        if (awaitingSince === null) awaitingSince = t;
      } else {
        if (inP) replied++;
        if (awaitingSince !== null) {
          if (inPeriod(new Date(awaitingSince).toISOString(), period)) replyTimes.push(t - awaitingSince);
          awaitingSince = null;
        }
      }
    }
    if (awaitingSince !== null) {
      waitingNow++;
      longestWait = Math.max(longestWait, now - awaitingSince);
    }
  }
  const med = median(replyTimes);
  return {
    received,
    replied,
    people: writers.size,
    waitingNow,
    longestWaitHours: waitingNow ? Math.round(longestWait / HOUR) : null,
    medianReplyMin: med === null ? null : Math.round(med / MIN),
    within24hPct: replyTimes.length ? Math.round((replyTimes.filter((x) => x <= DAY).length / replyTimes.length) * 100) : null,
    answeredCount: replyTimes.length,
  };
}

export type CoordinatorStatus = { tone: "ok" | "warn" | "idle"; label: string };

/**
 * Одним словом: как у координатора дела. Только по фактам, без оценок:
 * не входил / давно не заходил / ждут ответа больше суток / работает.
 */
export function coordinatorStatus(input: {
  lastLoginAt: string | null;
  waitingNow: number;
  longestWaitHours: number | null;
}): CoordinatorStatus {
  if (!input.lastLoginAt) return { tone: "idle", label: "Не входил" };
  const days = Math.floor((Date.now() - new Date(input.lastLoginAt).getTime()) / DAY);
  if (input.waitingNow > 0 && (input.longestWaitHours ?? 0) >= 24) return { tone: "warn", label: "Ждут ответа 24 ч+" };
  if (days >= 14) return { tone: "warn", label: "Давно не заходил" };
  return { tone: "ok", label: "Работает" };
}

export interface CoordinatorOverviewRow {
  id: string;
  name: string;
  email: string;
  region: string | null;
  status: CoordinatorStatus;
  lastLoginAt: string | null;
  loginDays: number;
  cabinetViews: number;
  replied: number;
  received: number;
  waitingNow: number;
  longestWaitHours: number | null;
  medianReplyMin: number | null;
  within24hPct: number | null;
  invited: number;
}

/** Все координаторы одной таблицей — для сравнения. Читаем данные пачкой, а не по одному. */
export async function getCoordinatorsOverview(period: Period): Promise<CoordinatorOverviewRow[]> {
  const sb = createSupabaseAdminClient();
  const { data: coords, error } = await sb
    .from("app_users")
    .select("id, first_name, last_name, email, region")
    .eq("role", "coordinator");
  if (error) throw error;
  const list = coords ?? [];
  if (list.length === 0) return [];
  const ids = list.map((c) => c.id as string);
  const now = Date.now();

  const [logins, views, chat, invited] = await Promise.all([
    fetchAllPages<{ user_id: string; created_at: string }>((from, to) =>
      sb.from("login_events").select("user_id, created_at").in("user_id", ids).order("created_at").range(from, to),
    ),
    fetchAllPages<{ user_id: string; created_at: string }>((from, to) =>
      sb.from("admin_page_views").select("user_id, created_at").in("user_id", ids).order("created_at").range(from, to),
    ),
    fetchAllPages<ChatRow & { region: string }>((from, to) =>
      sb.from("coordinator_messages").select("region, user_id, author, created_at").order("created_at").range(from, to),
    ),
    fetchAllPages<{ utm_content: string | null; created_at: string }>((from, to) =>
      sb.from("app_users").select("utm_content, created_at").eq("utm_source", INVITE_SOURCE).order("id").range(from, to),
    ),
  ]);

  const chatByRegion = new Map<string, ChatRow[]>();
  for (const m of chat) {
    const l = chatByRegion.get(m.region) ?? [];
    l.push(m);
    chatByRegion.set(m.region, l);
  }
  const invitedByCode = new Map<string, number>();
  for (const u of invited) {
    if (u.utm_content && inPeriod(u.created_at, period)) invitedByCode.set(u.utm_content, (invitedByCode.get(u.utm_content) ?? 0) + 1);
  }

  return list
    .map((c) => {
      const id = c.id as string;
      const myLogins = logins.filter((l) => l.user_id === id);
      const loginsIn = myLogins.filter((l) => inPeriod(l.created_at, period));
      const lastLoginAt = myLogins.length ? myLogins[myLogins.length - 1].created_at : null;
      const ch = analyzeChat(c.region ? (chatByRegion.get(c.region as string) ?? []) : [], period, now);
      return {
        id,
        name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || (c.email as string),
        email: c.email as string,
        region: (c.region as string | null) ?? null,
        status: coordinatorStatus({ lastLoginAt, waitingNow: ch.waitingNow, longestWaitHours: ch.longestWaitHours }),
        lastLoginAt,
        loginDays: new Set(loginsIn.map((l) => dayKey(l.created_at))).size,
        cabinetViews: views.filter((v) => v.user_id === id && inPeriod(v.created_at, period)).length,
        replied: ch.replied,
        received: ch.received,
        waitingNow: ch.waitingNow,
        longestWaitHours: ch.longestWaitHours,
        medianReplyMin: ch.medianReplyMin,
        within24hPct: ch.within24hPct,
        invited: invitedByCode.get(inviteCode(id)) ?? 0,
      };
    })
    .sort((x, y) => {
      if (!x.region && !y.region) return 0;
      if (!x.region) return 1;
      if (!y.region) return -1;
      return x.region.localeCompare(y.region, "ru");
    });
}

export async function getCoordinatorReport(coordinatorId: string, period: Period): Promise<CoordinatorReport | null> {
  const coordinator = await getAppUserById(coordinatorId);
  if (!coordinator || coordinator.role !== "coordinator") return null;
  const sb = createSupabaseAdminClient();
  const region = coordinator.region;
  const name = `${coordinator.firstName} ${coordinator.lastName}`.trim() || coordinator.email;
  const now = Date.now();
  const { data: created } = await sb.from("app_users").select("created_at").eq("id", coordinatorId).maybeSingle();

  const [logins, views, chat, inquiries, invited, regionCoordinators] = await Promise.all([
    fetchAllPages<{ created_at: string; standalone: boolean | null }>((from, to) =>
      sb.from("login_events").select("created_at, standalone").eq("user_id", coordinatorId).order("created_at").range(from, to),
    ),
    fetchAllPages<{ created_at: string; section: string }>((from, to) =>
      sb.from("admin_page_views").select("created_at, section").eq("user_id", coordinatorId).order("created_at").range(from, to),
    ),
    region
      ? fetchAllPages<ChatRow>((from, to) =>
          sb.from("coordinator_messages").select("user_id, author, created_at").eq("region", region).order("created_at").range(from, to),
        )
      : Promise.resolve([] as ChatRow[]),
    region
      ? fetchAllPages<{ created_at: string; responded_at: string | null; responded_by_name: string | null; status: string }>((from, to) =>
          sb
            .from("inquiries")
            .select("created_at, responded_at, responded_by_name, status")
            .eq("region", region)
            .order("created_at")
            .range(from, to),
        )
      : Promise.resolve([]),
    fetchAllPages<{ id: string; created_at: string; survey: unknown }>((from, to) =>
      sb
        .from("app_users")
        .select("id, created_at, survey")
        .eq("utm_source", INVITE_SOURCE)
        .eq("utm_content", inviteCode(coordinatorId))
        .order("id")
        .range(from, to),
    ),
    region
      ? sb.from("app_users").select("id", { count: "exact", head: true }).eq("role", "coordinator").eq("region", region)
      : Promise.resolve({ count: 1 }),
  ]);

  // ── Вход в приложение ──
  const loginsIn = logins.filter((l) => inPeriod(l.created_at, period));
  const standaloneKnown = loginsIn.filter((l) => l.standalone !== null);
  const login = {
    count: loginsIn.length,
    activeDays: new Set(loginsIn.map((l) => dayKey(l.created_at))).size,
    lastAt: logins.length ? logins[logins.length - 1].created_at : null,
    viaInstalledPct: standaloneKnown.length
      ? Math.round((standaloneKnown.filter((l) => l.standalone).length / standaloneKnown.length) * 100)
      : null,
  };

  // ── Работа в кабинете ──
  const viewsIn = views.filter((v) => inPeriod(v.created_at, period));
  const bySection = new Map<string, number>();
  for (const v of viewsIn) bySection.set(v.section, (bySection.get(v.section) ?? 0) + 1);
  const cabinet = {
    views: viewsIn.length,
    activeDays: new Set(viewsIn.map((v) => dayKey(v.created_at))).size,
    lastAt: views.length ? views[views.length - 1].created_at : null,
    sections: [...bySection.entries()].map(([section, count]) => ({ section, count })).sort((a, b) => b.count - a.count),
    trackedSince: views.length ? views[0].created_at : null,
  };

  // ── Чат: ответы людям ──
  const chatBlock = analyzeChat(chat, period, now);

  // ── Обращения (форма) ──
  const inqIn = inquiries.filter((i) => inPeriod(i.created_at, period));
  const answered = inqIn.filter((i) => i.responded_at);
  const inquiriesBlock = {
    received: inqIn.length,
    answered: answered.length,
    unanswered: inqIn.length - answered.length,
    byThisCoordinator: answered.filter((i) => (i.responded_by_name ?? "").trim() === name).length,
    medianReplyHours: (() => {
      const m = median(answered.map((i) => new Date(i.responded_at as string).getTime() - new Date(i.created_at).getTime()));
      return m === null ? null : Math.round(m / HOUR);
    })(),
  };

  // ── Приглашённые ──
  const invitedIds = new Set(invited.map((u) => u.id));
  const wroteToChat = new Set<string>();
  for (const m of chat) if (m.author === "user" && invitedIds.has(m.user_id)) wroteToChat.add(m.user_id);
  const invites = {
    code: inviteCode(coordinatorId),
    total: invited.length,
    inPeriod: invited.filter((u) => inPeriod(u.created_at, period)).length,
    filledSurvey: invited.filter((u) => u.survey != null).length,
    wroteToChat: wroteToChat.size,
  };

  // ── Регион ──
  let regionBlock = { people: 0, newPeople: 0, measureViews: 0 };
  if (region) {
    const sinceIso = period.from?.toISOString();
    const [people, newPeople, mv] = await Promise.all([
      sb.from("app_users").select("id", { count: "exact", head: true }).eq("survey->>region", region),
      (() => {
        let q = sb.from("app_users").select("id", { count: "exact", head: true }).eq("survey->>region", region);
        if (sinceIso) q = q.gte("created_at", sinceIso);
        return q;
      })(),
      (() => {
        let q = sb.from("measure_views").select("id", { count: "exact", head: true }).eq("region", region);
        if (sinceIso) q = q.gte("created_at", sinceIso);
        return q;
      })(),
    ]);
    regionBlock = { people: people.count ?? 0, newPeople: newPeople.count ?? 0, measureViews: mv.count ?? 0 };
  }

  // ── Выводы по фактам ──
  const flags: CoordinatorReport["flags"] = [];
  if (login.lastAt) {
    const days = Math.floor((now - new Date(login.lastAt).getTime()) / DAY);
    if (days >= 14) flags.push({ tone: "warn", text: `Давно не заходил: последний вход ${days} дн. назад.` });
  } else {
    flags.push({ tone: "warn", text: "Ни разу не входил в приложение." });
  }
  if (chatBlock.waitingNow > 0) {
    flags.push({
      tone: chatBlock.longestWaitHours !== null && chatBlock.longestWaitHours >= 24 ? "warn" : "info",
      text: `Ждут ответа в чате: ${chatBlock.waitingNow} (дольше всех — ${chatBlock.longestWaitHours} ч).`,
    });
  } else if (chatBlock.received > 0) {
    flags.push({ tone: "ok", text: "На все сообщения в чате ответили." });
  }
  if (chatBlock.within24hPct !== null && chatBlock.within24hPct < 70) {
    flags.push({ tone: "warn", text: `В течение суток отвечено только ${chatBlock.within24hPct}% вопросов.` });
  }
  if (inquiriesBlock.unanswered > 0) {
    flags.push({ tone: "warn", text: `Обращений без ответа за период: ${inquiriesBlock.unanswered}.` });
  }
  if (!region) flags.push({ tone: "info", text: "Регион координатору не назначен — данные по региону не считаются." });

  return {
    coordinator: { id: coordinator.id, name, email: coordinator.email, region, since: (created?.created_at as string | undefined) ?? new Date().toISOString() },
    sameRegionCoordinators: regionCoordinators.count ?? 1,
    login,
    cabinet,
    chat: chatBlock,
    inquiries: inquiriesBlock,
    invites,
    region: regionBlock,
    flags,
  };
}

export const SECTION_LABELS: Record<string, string> = {
  "/admin": "Сводка",
  "/admin/region-chat": "Обращения (чат)",
  "/admin/inquiries": "Обращения",
  "/admin/measures": "Меры региона",
  "/admin/region-survey": "Пользователи региона",
  "/admin/region-saved": "Избранное региона",
  "/admin/region-views": "Что смотрят",
  "/admin/invite": "Пригласить пользователя",
  "/admin/instructions": "Инструкции",
  "/admin/support": "Техподдержка",
};
