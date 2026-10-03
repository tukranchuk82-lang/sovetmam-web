import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatMessage } from "@/lib/coordinator-chat-db";

/**
 * Чат «координатор ↔ техническая поддержка» (таблица support_messages, 0037).
 *
 * Для ленты используем тот же компонент, что и в чате с подписчиками: он знает
 * двух собеседников «user» и «coordinator». Поэтому здесь роли переименованы
 * на лету: координатор — «user» (тот, кто просит помощи), техподдержка —
 * «coordinator» (тот, кто отвечает). В базе остаются настоящие названия.
 */

export type SupportSide = "coordinator" | "tech";

interface Row {
  id: string;
  author: SupportSide;
  body: string;
  read_at: string | null;
  created_at: string;
}

function toChat(r: Row): ChatMessage {
  return {
    id: r.id,
    author: r.author === "coordinator" ? "user" : "coordinator",
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

export async function getSupportThread(coordinatorId: string): Promise<ChatMessage[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("support_messages")
    .select("id, author, body, read_at, created_at")
    .eq("coordinator_id", coordinatorId)
    .order("created_at");
  return ((data as Row[] | null) ?? []).map(toChat);
}

export async function addSupportMessage(input: {
  coordinatorId: string;
  author: SupportSide;
  authorId: string;
  body: string;
}): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("support_messages").insert({
    coordinator_id: input.coordinatorId,
    author: input.author,
    author_id: input.authorId,
    body: input.body.trim(),
  });
  return !error;
}

/** Отмечает сообщения собеседника прочитанными. */
export async function markSupportRead(coordinatorId: string, reader: SupportSide): Promise<void> {
  const sb = createSupabaseAdminClient();
  const otherSide: SupportSide = reader === "coordinator" ? "tech" : "coordinator";
  await sb
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("coordinator_id", coordinatorId)
    .eq("author", otherSide)
    .is("read_at", null);
}

/** Сколько ответов техподдержки координатор ещё не видел — кружок в его меню. */
export async function countUnreadForCoordinator(coordinatorId: string): Promise<number> {
  const sb = createSupabaseAdminClient();
  const { count } = await sb
    .from("support_messages")
    .select("*", { count: "exact", head: true })
    .eq("coordinator_id", coordinatorId)
    .eq("author", "tech")
    .is("read_at", null);
  return count ?? 0;
}

/** Сколько координаторов ждут ответа техподдержки — кружок в меню техспеца и владельца. */
export async function countWaitingForTech(): Promise<number> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("support_messages")
    .select("coordinator_id")
    .eq("author", "coordinator")
    .is("read_at", null);
  return new Set((data ?? []).map((r) => r.coordinator_id as string)).size;
}

export interface SupportConversation {
  coordinatorId: string;
  name: string;
  region: string;
  lastMessage: string;
  lastAuthor: "user" | "coordinator";
  lastAt: string;
  unreadCount: number;
}

/** Список обращений координаторов: по одной строке на человека, свежие сверху. */
export async function listSupportConversations(): Promise<SupportConversation[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("support_messages")
    .select("coordinator_id, author, body, read_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as {
    coordinator_id: string;
    author: SupportSide;
    body: string;
    read_at: string | null;
    created_at: string;
  }[];
  if (rows.length === 0) return [];

  const last = new Map<string, (typeof rows)[number]>();
  const unread = new Map<string, number>();
  for (const r of rows) {
    if (!last.has(r.coordinator_id)) last.set(r.coordinator_id, r);
    if (r.author === "coordinator" && !r.read_at) unread.set(r.coordinator_id, (unread.get(r.coordinator_id) ?? 0) + 1);
  }

  const ids = [...last.keys()];
  const { data: people } = await sb.from("app_users").select("id, first_name, last_name, region").in("id", ids);
  const info = new Map(
    (people ?? []).map((p) => [
      p.id as string,
      { name: `${p.first_name} ${p.last_name}`.trim(), region: (p.region as string | null) ?? "" },
    ]),
  );

  return ids
    .map((id) => {
      const l = last.get(id)!;
      return {
        coordinatorId: id,
        name: info.get(id)?.name || "Координатор",
        region: info.get(id)?.region ?? "",
        lastMessage: l.body,
        lastAuthor: (l.author === "coordinator" ? "user" : "coordinator") as "user" | "coordinator",
        lastAt: l.created_at,
        unreadCount: unread.get(id) ?? 0,
      };
    })
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}
