import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { addMessage } from "@/lib/inquiry-thread";

// Тип обращения живёт в @/lib/inquiries — он нужен и клиентским компонентам,
// а этот модуль server-only.
export type { InquiryType } from "@/lib/inquiries";
import type { InquiryType } from "@/lib/inquiries";
export type InquiryStatus = "new" | "answered";
export type InquiryChannel = "telegram" | "vk" | "max";

export interface Inquiry {
  id: string;
  userId: string;
  userName: string;
  userChannel: InquiryChannel | null;
  region: string | null;
  type: InquiryType;
  subject: string;
  body: string;
  measureSlug: string | null;
  status: InquiryStatus;
  response: string | null;
  respondedAt: string | null;
  respondedByName: string | null;
  createdAt: string;
  /**
   * Снимок представителя региона на момент маршрутизации — не связь по id.
   * Если представителя потом отключат или заменят, уже созданные обращения
   * не должны «переехать» к новому адресату посреди разговора.
   */
  representativeName: string | null;
  representativeEmail: string | null;
}

interface InquiryRow {
  id: string;
  user_id: string;
  user_name: string;
  user_channel: InquiryChannel | null;
  region: string | null;
  type: InquiryType;
  subject: string;
  body: string;
  measure_slug: string | null;
  status: InquiryStatus;
  response: string | null;
  responded_at: string | null;
  responded_by_name: string | null;
  created_at: string;
  representative_name: string | null;
  representative_email: string | null;
}

function fromRow(r: InquiryRow): Inquiry {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userChannel: r.user_channel,
    region: r.region,
    type: r.type,
    subject: r.subject,
    body: r.body,
    measureSlug: r.measure_slug,
    status: r.status,
    response: r.response,
    respondedAt: r.responded_at,
    respondedByName: r.responded_by_name,
    createdAt: r.created_at,
    representativeName: r.representative_name,
    representativeEmail: r.representative_email,
  };
}

export interface NewInquiry {
  userId: string;
  userName: string;
  userChannel: InquiryChannel | null;
  region: string;
  type: InquiryType;
  subject: string;
  body: string;
  measureSlug: string | null;
}

export async function createInquiry(input: NewInquiry): Promise<Inquiry> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      user_id: input.userId,
      user_name: input.userName,
      user_channel: input.userChannel,
      region: input.region,
      type: input.type,
      subject: input.subject,
      body: input.body,
      measure_slug: input.measureSlug,
    })
    .select()
    .single();
  if (error) throw error;

  const inquiry = fromRow(data as InquiryRow);
  // Первое сообщение ленты — сам вопрос: дальше разговор продолжается в ней.
  await addMessage({
    inquiryId: inquiry.id,
    author: "user",
    authorName: inquiry.userName,
    body: inquiry.body,
  });
  return inquiry;
}

export async function listInquiriesForUser(userId: string): Promise<Inquiry[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as InquiryRow[]).map(fromRow);
}

export async function listAllInquiries(region?: string): Promise<Inquiry[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("inquiries")
    .select()
    // 'new' > 'answered' алфавитно — по возрастанию было бы наоборот,
    // отвеченные сверху; нужно по убыванию, чтобы неотвеченные были первыми.
    .order("status", { ascending: false })
    .order("created_at", { ascending: false });
  if (region) query = query.eq("region", region);
  const { data, error } = await query;
  if (error) throw error;
  return (data as InquiryRow[]).map(fromRow);
}

/** Снимок представителя, которому направлено обращение — сохраняется один раз при маршрутизации. */
export async function setInquiryRepresentative(
  id: string,
  name: string,
  email: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ representative_name: name, representative_email: email })
    .eq("id", id);
  if (error) throw error;
}

/** Различные регионы среди обращений — для фильтра в списке админки. */
export async function listInquiryRegions(): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("region")
    .not("region", "is", null);
  if (error) throw error;
  const set = new Set((data ?? []).map((r) => r.region as string).filter(Boolean));
  return [...set].sort((a, b) => a.localeCompare(b, "ru"));
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as InquiryRow) : null;
}

export async function respondToInquiry(
  id: string,
  response: string,
  respondedByName: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("inquiries")
    .update({
      response,
      responded_by_name: respondedByName,
      responded_at: new Date().toISOString(),
      status: "answered",
    })
    .eq("id", id);
  if (error) throw error;

  // Тот же ответ кладём в ленту — переписка должна быть целиком в одном месте.
  await addMessage({
    inquiryId: id,
    author: "staff",
    authorName: respondedByName,
    body: response,
  });
}

export async function countNewInquiries(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  if (error) throw error;
  return count ?? 0;
}

export async function countUnreadResponsesForUser(
  userId: string,
): Promise<number> {
  // В прототипе считаем «непрочитанным» любой отвеченный (нет таблицы прочтений).
  // Реально потом добавим notifications table или read_at в inquiries.
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "answered");
  if (error) throw error;
  return count ?? 0;
}
