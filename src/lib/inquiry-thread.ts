import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Переписка внутри обращения.
 *
 * Обращение перестало быть парой «вопрос — ответ»: теперь это лента сообщений,
 * где человек может уточнить, поблагодарить или задать встречный вопрос, а
 * Татьяна — ответить снова.
 *
 * Статус обращения выводим из ленты: последнее слово за человеком — «ждёт
 * ответа», за нами — «отвечено». Так продолжение разговора само возвращает
 * обращение в работу, и его не потеряют.
 */

export type MessageAuthor = "user" | "staff";

export interface ThreadMessage {
  id: string;
  author: MessageAuthor;
  authorName: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  author: MessageAuthor;
  author_name: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
}

const FIELDS = "id,author,author_name,body,read_at,created_at";

function fromRow(r: Row): ThreadMessage {
  return {
    id: r.id,
    author: r.author,
    authorName: r.author_name,
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

export async function getThread(inquiryId: string): Promise<ThreadMessage[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("inquiry_messages")
    .select(FIELDS)
    .eq("inquiry_id", inquiryId)
    .order("created_at");
  return ((data as Row[] | null) ?? []).map(fromRow);
}

/** Добавляет сообщение и приводит статус обращения в соответствие с лентой. */
export async function addMessage(input: {
  inquiryId: string;
  author: MessageAuthor;
  authorName: string | null;
  body: string;
}): Promise<ThreadMessage | null> {
  const sb = createSupabaseAdminClient();

  const { data, error } = await sb
    .from("inquiry_messages")
    .insert({
      inquiry_id: input.inquiryId,
      author: input.author,
      author_name: input.authorName,
      body: input.body.trim(),
    })
    .select(FIELDS)
    .single();

  if (error || !data) return null;

  // Написал человек — обращение снова ждёт ответа; ответили мы — отвечено.
  await sb
    .from("inquiries")
    .update({ status: input.author === "user" ? "new" : "answered" })
    .eq("id", input.inquiryId);

  return fromRow(data as Row);
}

/** Отмечает сообщения собеседника прочитанными. */
export async function markThreadRead(
  inquiryId: string,
  reader: MessageAuthor,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  // Читатель видит чужие сообщения: человек — наши, мы — его.
  const otherSide: MessageAuthor = reader === "user" ? "staff" : "user";
  await sb
    .from("inquiry_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("inquiry_id", inquiryId)
    .eq("author", otherSide)
    .is("read_at", null);
}

/** Сколько ответов человек ещё не видел — для значка в приложении. */
export async function countUnreadForUser(userId: string): Promise<number> {
  const sb = createSupabaseAdminClient();

  const { data: mine } = await sb.from("inquiries").select("id").eq("user_id", userId);
  const ids = (mine ?? []).map((r) => r.id as string);
  if (ids.length === 0) return 0;

  const { count } = await sb
    .from("inquiry_messages")
    .select("*", { count: "exact", head: true })
    .in("inquiry_id", ids)
    .eq("author", "staff")
    .is("read_at", null);

  return count ?? 0;
}

/** Сколько сообщений от людей ждут ответа — для значка в админке. */
export async function countUnreadForStaff(): Promise<number> {
  const sb = createSupabaseAdminClient();
  const { count } = await sb
    .from("inquiry_messages")
    .select("*", { count: "exact", head: true })
    .eq("author", "user")
    .is("read_at", null);
  return count ?? 0;
}
