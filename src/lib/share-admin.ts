import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SHARE_SOURCE } from "@/lib/share-source";

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
  /** Зарегистрировались, придя по кнопке «Поделиться». */
  signups: number;
  /** Чем делятся чаще всего. */
  topPaths: { path: string; count: number; title: string | null }[];
  /** Приходы по меткам: кнопка «Поделиться», рассылки, посты. */
  bySource: { source: string; visits: number }[];
}

interface EventRow {
  kind: "share" | "visit";
  path: string;
  ref: string | null;
  visitor: string | null;
  created_at: string;
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export async function getShareStats(): Promise<ShareStats> {
  const sb = createSupabaseAdminClient();

  // Событий немного (нажатие кнопки — редкое действие), поэтому читаем их
  // целиком и считаем на месте: так проще, чем шесть отдельных запросов с
  // count. Ограничение сверху на всякий случай — чтобы страница админки не
  // подвисла, если приложением вдруг начнут делиться тысячами.
  const { data } = await sb
    .from("share_events")
    .select("kind, path, ref, visitor, created_at")
    .order("created_at", { ascending: false })
    .limit(20_000);

  const rows = (data ?? []) as EventRow[];
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

  const bySourceMap = new Map<string, number>();
  for (const r of visits) {
    const key = r.ref ?? "без метки";
    bySourceMap.set(key, (bySourceMap.get(key) ?? 0) + 1);
  }
  const bySource = [...bySourceMap.entries()]
    .map(([source, v]) => ({ source, visits: v }))
    .sort((a, b) => b.visits - a.visits);

  const people = new Set(visits.map((r) => r.visitor).filter(Boolean)).size;

  const { count: signups } = await sb
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("utm_source", SHARE_SOURCE);

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
    signups: signups ?? 0,
    topPaths,
    bySource,
  };
}
