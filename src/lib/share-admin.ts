import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Отчёты по кнопке «Поделиться» для админки.
 *
 * Отвечают на три вопроса подряд: сколько раз поделились, сколько людей по
 * этим ссылкам пришло и сколько из них осталось — то есть зарегистрировалось.
 * Последнее берём не из событий, а из профилей: метка ссылки попадает в
 * профиль при регистрации (см. utm-capture.tsx), и это самый честный счёт.
 */

export interface ShareStats {
  shares: { total: number; last7: number; last30: number };
  visits: { total: number; last7: number; last30: number };
  /** Сколько разных устройств приходило по размеченным ссылкам. */
  people: number;
  /** Люди за 7 и 30 дней — для сводки. */
  peopleLast7: number;
  peopleLast30: number;
  /** Зарегистрировались, придя по кнопке «Поделиться». */
  signups: number;
  /** Чем делятся чаще всего. */
  topPaths: { path: string; count: number; title: string | null }[];
  /** Куда отправляют ссылку: Telegram, MAX, копирование. */
  byChannel: { channel: string; count: number }[];
  /** Приходы по меткам: кнопка «Поделиться», квиз, рассылки, посты. */
  bySource: { source: string; visits: number; people: number; signups: number }[];
  /** Уходы по нашим ссылкам наружу — сейчас это только плашка курса. */
  exits: { target: string; people: number; clicks: number; last30: number }[];
  /** Метка, по которой отфильтрованы остальные цифры (null — все сразу). */
  source: string | null;
}

interface EventRow {
  kind: "share" | "visit" | "exit";
  path: string;
  ref: string | null;
  channel: string | null;
  visitor: string | null;
  created_at: string;
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export async function getShareStats(source?: string | null): Promise<ShareStats> {
  const sb = createSupabaseAdminClient();

  // Событий немного (нажатие кнопки — редкое действие), поэтому читаем их
  // целиком и считаем на месте: так проще, чем шесть отдельных запросов с
  // count. Ограничение сверху на всякий случай — чтобы страница админки не
  // подвисла, если приложением вдруг начнут делиться тысячами.
  const { data } = await sb
    .from("share_events")
    .select("kind, path, ref, channel, visitor, created_at")
    .order("created_at", { ascending: false })
    .limit(20_000);

  const allRows = (data ?? []) as EventRow[];
  // Сводку по меткам считаем всегда по всем событиям — иначе, выбрав одну
  // метку, мы бы потеряли из виду остальные и не смогли переключиться.
  const rows = source ? allRows.filter((r) => (r.ref ?? "без метки") === source) : allRows;
  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  const shares = rows.filter((r) => r.kind === "share");
  const visits = rows.filter((r) => r.kind === "visit");

  const count = (list: EventRow[], since?: string) =>
    since ? list.filter((r) => r.created_at >= since).length : list.length;

  // Чем делятся чаще: складываем нажатия по адресу страницы.
  const byPath = new Map<string, number>();
  for (const r of shares) byPath.set(r.path, (byPath.get(r.path) ?? 0) + 1);
  const topPaths = [...byPath.entries()]
    .map(([path, cnt]) => ({ path, count: cnt, title: null as string | null }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Названия мер вместо адресов — читать «Пособие по уходу» понятнее, чем
  // «/catalog/fed-014».
  const slugs = topPaths
    .filter((p) => p.path.startsWith("/catalog/"))
    .map((p) => p.path.replace("/catalog/", ""));
  if (slugs.length > 0) {
    const { data: measures } = await sb
      .from("measures")
      .select("slug, title")
      .in("slug", slugs);
    const titles = new Map(
      ((measures ?? []) as { slug: string; title: string }[]).map((m) => [
        m.slug,
        m.title,
      ]),
    );
    for (const p of topPaths) {
      if (p.path === "/") p.title = "Главная страница";
      else p.title = titles.get(p.path.replace("/catalog/", "")) ?? null;
    }
  } else {
    for (const p of topPaths) if (p.path === "/") p.title = "Главная страница";
  }

  // Куда носят ссылки. У событий до августа 2026 канал не записан — тогда в
  // окне «Поделиться» ещё не было выбора мессенджера.
  const byChannelMap = new Map<string, number>();
  for (const r of shares) {
    const key = r.channel ?? "неизвестно";
    byChannelMap.set(key, (byChannelMap.get(key) ?? 0) + 1);
  }
  const byChannel = [...byChannelMap.entries()]
    .map(([channel, cnt]) => ({ channel, count: cnt }))
    .sort((a, b) => b.count - a.count);

  // Сколько людей и регистраций дала каждая метка. Людей считаем по разным
  // устройствам, регистрации — по профилям: метка попадает в профиль при
  // регистрации, и это самый честный счёт.
  const bySourceMap = new Map<string, { visits: number; visitors: Set<string> }>();
  for (const r of allRows) {
    if (r.kind !== "visit") continue;
    const key = r.ref ?? "без метки";
    const cell = bySourceMap.get(key) ?? { visits: 0, visitors: new Set<string>() };
    cell.visits += 1;
    if (r.visitor) cell.visitors.add(r.visitor);
    bySourceMap.set(key, cell);
  }

  const { data: signupRows } = await sb
    .from("app_users")
    .select("utm_source")
    .not("utm_source", "is", null);
  const signupsBySource = new Map<string, number>();
  for (const u of (signupRows ?? []) as { utm_source: string }[]) {
    signupsBySource.set(u.utm_source, (signupsBySource.get(u.utm_source) ?? 0) + 1);
  }

  const bySource = [...bySourceMap.entries()]
    .map(([key, cell]) => ({
      source: key,
      visits: cell.visits,
      people: cell.visitors.size,
      signups: signupsBySource.get(key) ?? 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  // Переходы наружу считаем по всем событиям, а не по выбранной метке: метка
  // отвечает на вопрос «откуда человек пришёл», а уход — совсем про другое.
  const exitsMap = new Map<
    string,
    { clicks: number; visitors: Set<string>; last30: number }
  >();
  for (const r of allRows) {
    if (r.kind !== "exit") continue;
    const key = r.channel ?? "неизвестно";
    const cell = exitsMap.get(key) ?? {
      clicks: 0,
      visitors: new Set<string>(),
      last30: 0,
    };
    cell.clicks += 1;
    if (r.visitor) cell.visitors.add(r.visitor);
    if (r.created_at >= d30) cell.last30 += 1;
    exitsMap.set(key, cell);
  }
  const exits = [...exitsMap.entries()]
    .map(([target, cell]) => ({
      target,
      people: cell.visitors.size,
      clicks: cell.clicks,
      last30: cell.last30,
    }))
    .sort((a, b) => b.people - a.people);

  const peopleIn = (since?: string) =>
    new Set(
      visits
        .filter((r) => (since ? r.created_at >= since : true))
        .map((r) => r.visitor)
        .filter(Boolean),
    ).size;
  const people = peopleIn();

  const signups = source
    ? (signupsBySource.get(source) ?? 0)
    : [...signupsBySource.values()].reduce((a, b) => a + b, 0);

  return {
    shares: {
      total: count(shares),
      last7: count(shares, d7),
      last30: count(shares, d30),
    },
    visits: {
      total: count(visits),
      last7: count(visits, d7),
      last30: count(visits, d30),
    },
    people,
    peopleLast7: peopleIn(d7),
    peopleLast30: peopleIn(d30),
    signups,
    topPaths,
    byChannel,
    bySource,
    exits,
    source: source ?? null,
  };
}
