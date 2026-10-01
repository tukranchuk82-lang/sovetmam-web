import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Внутренний чат «пользователь ↔ координатор региона».
 *
 * В отличие от «Обращений» (тикеты, у каждого своя тема и статус) — это один
 * непрерывный тред на пару (пользователь, регион): как переписка в
 * мессенджере, без начала и конца. Таблица coordinator_messages заведена
 * заранее миграцией 0032.
 */

export type ChatAuthor = "user" | "coordinator";

export interface ChatMessage {
  id: string;
  author: ChatAuthor;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  author: ChatAuthor;
  body: string;
  read_at: string | null;
  created_at: string;
}

const FIELDS = "id,author,body,read_at,created_at";

function fromRow(r: Row): ChatMessage {
  return {
    id: r.id,
    author: r.author,
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

export async function getThread(userId: string): Promise<ChatMessage[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("coordinator_messages")
    .select(FIELDS)
    .eq("user_id", userId)
    .order("created_at");
  return ((data as Row[] | null) ?? []).map(fromRow);
}

export async function addMessage(input: {
  userId: string;
  region: string;
  author: ChatAuthor;
  body: string;
}): Promise<ChatMessage | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("coordinator_messages")
    .insert({
      user_id: input.userId,
      region: input.region,
      author: input.author,
      body: input.body.trim(),
    })
    .select(FIELDS)
    .single();
  if (error || !data) return null;
  return fromRow(data as Row);
}

/** Отмечает сообщения собеседника прочитанными. */
export async function markThreadRead(userId: string, reader: ChatAuthor): Promise<void> {
  const sb = createSupabaseAdminClient();
  const otherSide: ChatAuthor = reader === "user" ? "coordinator" : "user";
  await sb
    .from("coordinator_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("author", otherSide)
    .is("read_at", null);
}

/** Сколько сообщений координатора человек ещё не видел — бейдж в кабинете. */
export async function countUnreadForUser(userId: string): Promise<number> {
  const sb = createSupabaseAdminClient();
  const { count } = await sb
    .from("coordinator_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("author", "coordinator")
    .is("read_at", null);
  return count ?? 0;
}

/** Сколько сообщений от людей ждут координатора — бейдж в админке. `region` null — без фильтра. */
export async function countUnreadForRegion(region: string | null): Promise<number> {
  const sb = createSupabaseAdminClient();
  let query = sb
    .from("coordinator_messages")
    .select("*", { count: "exact", head: true })
    .eq("author", "user")
    .is("read_at", null);
  if (region) query = query.eq("region", region);
  const { count } = await query;
  return count ?? 0;
}

export interface RegionConversation {
  userId: string;
  userName: string;
  region: string;
  lastMessage: string;
  lastAuthor: ChatAuthor;
  lastAt: string;
  unread: boolean;
}

/**
 * Список бесед — по одной строке на пользователя, свежие сверху. `region`
 * null — без фильтра: так владелец/техспец смотрят координаторский экран
 * «на себе», у них самих региона нет (см. resolveRegion в preview-region.ts).
 */
export async function listConversationsByRegion(
  region: string | null,
): Promise<RegionConversation[]> {
  const sb = createSupabaseAdminClient();
  let query = sb
    .from("coordinator_messages")
    .select("user_id, region, author, body, read_at, created_at")
    .order("created_at", { ascending: false });
  if (region) query = query.eq("region", region);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as {
    user_id: string;
    region: string;
    author: ChatAuthor;
    body: string;
    read_at: string | null;
    created_at: string;
  }[];
  if (rows.length === 0) return [];

  // Строки отсортированы по убыванию даты — первая встреченная на каждого
  // пользователя и есть последнее сообщение его беседы.
  const lastByUser = new Map<string, (typeof rows)[number]>();
  const unreadUsers = new Set<string>();
  for (const r of rows) {
    if (!lastByUser.has(r.user_id)) lastByUser.set(r.user_id, r);
    if (r.author === "user" && !r.read_at) unreadUsers.add(r.user_id);
  }

  const userIds = [...lastByUser.keys()];
  const { data: users, error: usersError } = await sb
    .from("app_users")
    .select("id, first_name, last_name")
    .in("id", userIds);
  if (usersError) throw usersError;
  const nameById = new Map(
    (users ?? []).map((u) => [u.id as string, `${u.first_name} ${u.last_name}`.trim()]),
  );

  return userIds
    .map((id) => {
      const last = lastByUser.get(id)!;
      return {
        userId: id,
        userName: nameById.get(id) ?? "—",
        region: last.region,
        lastMessage: last.body,
        lastAuthor: last.author,
        lastAt: last.created_at,
        unread: unreadUsers.has(id),
      };
    })
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

/** Есть ли в регионе назначенный координатор — от этого зависит, показывать ли чат пользователю. */
export async function hasCoordinatorForRegion(region: string): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { count, error } = await sb
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "coordinator")
    .eq("region", region);
  if (error) throw error;
  return (count ?? 0) > 0;
}
