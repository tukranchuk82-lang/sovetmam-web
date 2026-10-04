import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/supabase/paged";
import { listByRole } from "@/lib/staff-db";
import { listConversationsByRegion } from "@/lib/coordinator-chat-db";

/**
 * Данные для кабинета координатора: обращения региона, сводка по людям и
 * приглашения по персональной ссылке.
 *
 * region = null — «без региона»: так владелец и техспец смотрят кабинет
 * координатора «на себе» и видят все регионы разом.
 */

// ── Обращения ───────────────────────────────────────────────────────────────

/**
 * Обращения региона теперь живут в чате: беседа — это человек, который писал.
 * «Не отвечено» — беседы, где последнее слово за человеком.
 */
export async function getChatInquiryCounts(
  region: string | null,
): Promise<{ total: number; waiting: number; unread: number }> {
  const conversations = await listConversationsByRegion(region);
  return {
    total: conversations.length,
    // Последнее слово за человеком — ответа ещё не было (даже если координатор уже прочитал).
    waiting: conversations.filter((c) => c.lastAuthor === "user").length,
    // Не открытые координатором — именно они горят кружком, пока их не прочитают.
    unread: conversations.filter((c) => c.unread).length,
  };
}

// ── Приглашения координатора ───────────────────────────────────────────────

/** Метка источника в пригласительной ссылке координатора. */
export const INVITE_SOURCE = "coordinator";

/**
 * Короткий код координатора для ссылки. Из id берём первые 8 знаков: этого
 * хватает, чтобы различать координаторов, и в ссылке не светится полный id.
 */
export function inviteCode(userId: string): string {
  return "k" + userId.replace(/-/g, "").slice(0, 8);
}

/**
 * Пригласительная ссылка координатора на главную страницу приложения: метка
 * источника, регион и личный код. userId = null — образец для владельца и
 * техспеца, смотрящих кабинет «на себе»: у них своей ссылки нет.
 */
export function buildInviteParams(userId: string | null, region: string | null): Record<string, string> {
  const params: Record<string, string> = {
    utm_source: INVITE_SOURCE,
    utm_content: userId ? inviteCode(userId) : "obrazec",
  };
  if (region) params.utm_campaign = region;
  return params;
}

/** Сколько человек зарегистрировалось по ссылке координатора. */
export async function countInvited(code: string): Promise<number> {
  const sb = createSupabaseAdminClient();
  const { count, error } = await sb
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("utm_source", INVITE_SOURCE)
    .eq("utm_content", code);
  if (error) throw error;
  return count ?? 0;
}

export interface CoordinatorInviteRow {
  id: string;
  region: string | null;
  name: string;
  email: string;
  invited: number;
}

/** Для владельца и техспеца: сколько привёл каждый координатор. */
export async function listInvitesByCoordinator(): Promise<{
  rows: CoordinatorInviteRow[];
  unknown: number;
}> {
  const sb = createSupabaseAdminClient();
  const coordinators = await listByRole("coordinator");
  const people = await fetchAllPages<{ utm_content: string | null }>((from, to) =>
    sb
      .from("app_users")
      .select("utm_content")
      .eq("utm_source", INVITE_SOURCE)
      .order("id", { ascending: true })
      .range(from, to),
  );
  const byCode = new Map<string, number>();
  for (const p of people) {
    const k = p.utm_content ?? "";
    byCode.set(k, (byCode.get(k) ?? 0) + 1);
  }
  const known = new Set<string>();
  const rows = coordinators.map((c) => {
    const code = inviteCode(c.id);
    known.add(code);
    return {
      id: c.id,
      region: c.region,
      name: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      invited: byCode.get(code) ?? 0,
    };
  });
  rows.sort((a, b) => {
    if (!a.region && !b.region) return 0;
    if (!a.region) return 1;
    if (!b.region) return -1;
    return a.region.localeCompare(b.region, "ru");
  });
  let unknown = 0;
  for (const [k, n] of byCode) if (!known.has(k)) unknown += n;
  return { rows, unknown };
}

// ── Сводка по людям региона ────────────────────────────────────────────────

export interface RegionPeopleSummary {
  surveyed: number;
  /** Подключили мессенджер (хотя бы один). */
  messenger: number;
  telegram: number;
  vk: number;
  max: number;
  /** Сколько человек сохраняли меры в избранное и сколько сохранений всего. */
  savedPeople: number;
  savedTotal: number;
  topSaved: { slug: string; title: string; count: number }[];
  /** Состав семей по анкетам. */
  families: {
    withChildren: number;
    large: number;
    singleParent: number;
    svo: number;
    disabledChild: number;
    pregnant: number;
  };
}

interface UserRow {
  id: string;
  telegram_id: number | null;
  vk_id: number | null;
  max_id: string | null;
  messenger_connected: boolean | null;
  survey: Record<string, unknown> | null;
}

export async function getRegionPeopleSummary(region: string | null): Promise<RegionPeopleSummary> {
  const sb = createSupabaseAdminClient();
  const users = await fetchAllPages<UserRow>((from, to) => {
    let q = sb
      .from("app_users")
      .select("id, telegram_id, vk_id, max_id, messenger_connected, survey")
      .not("survey", "is", null)
      .order("id", { ascending: true })
      .range(from, to);
    if (region) q = q.eq("survey->>region", region);
    return q as unknown as PromiseLike<{ data: UserRow[] | null; error: { message: string } | null }>;
  });

  const families = { withChildren: 0, large: 0, singleParent: 0, svo: 0, disabledChild: 0, pregnant: 0 };
  let telegram = 0;
  let vk = 0;
  let max = 0;
  let messenger = 0;
  for (const u of users) {
    const s = u.survey ?? {};
    if (u.telegram_id) telegram++;
    if (u.vk_id) vk++;
    if (u.max_id) max++;
    if (u.messenger_connected || u.telegram_id || u.vk_id || u.max_id) messenger++;
    if (s.hasChildren) families.withChildren++;
    if (Number(s.childrenCount) >= 3) families.large++;
    if (s.singleParent) families.singleParent++;
    if (s.svoFamily) families.svo++;
    if (s.disabledChild) families.disabledChild++;
    if (s.pregnant) families.pregnant++;
  }

  // Избранное: сохранения людей региона. id режем на пачки — длинный список в
  // URL запроса не проходит.
  const ids = users.map((u) => u.id);
  const saved: { user_id: string; measure_slug: string }[] = [];
  for (let i = 0; i < ids.length; i += 150) {
    const { data, error } = await sb
      .from("saved_measures")
      .select("user_id, measure_slug")
      .in("user_id", ids.slice(i, i + 150));
    if (error) throw error;
    saved.push(...(data ?? []));
  }
  const bySlug = new Map<string, number>();
  for (const s of saved) bySlug.set(s.measure_slug, (bySlug.get(s.measure_slug) ?? 0) + 1);
  const top = [...bySlug.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  const titles = new Map<string, string>();
  if (top.length) {
    const { data } = await sb.from("measures").select("slug, title").in("slug", top.map(([s]) => s));
    for (const m of data ?? []) titles.set(m.slug as string, m.title as string);
  }

  return {
    surveyed: users.length,
    messenger,
    telegram,
    vk,
    max,
    savedPeople: new Set(saved.map((s) => s.user_id)).size,
    savedTotal: saved.length,
    topSaved: top.map(([slug, count]) => ({ slug, title: titles.get(slug) ?? slug, count })),
    families,
  };
}
