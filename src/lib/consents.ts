import "server-only";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Согласия пользователя: на обработку персональных данных и на рассылку.
 *
 * Документы живут отдельным сайтом (doc.sovetmam.ru) и общие для всех наших
 * сервисов. Здесь хранится только след: кто, на что и под какой редакцией
 * согласился.
 */

/** Где лежат документы. Один адрес на все приложения и ботов. */
export const DOCS_URL = "https://doc.sovetmam.ru";

/**
 * Редакции документов, которые сейчас показываем.
 *
 * Должны совпадать с теми, что указаны на сайте документов (там — src/lib/org.ts).
 * Меняете текст по существу — поднимаете версию в обоих местах, и новые
 * согласия записываются уже с новым номером.
 */
export const DOC_VERSION = {
  personalData: "1.0",
  mailing: "1.0",
} as const;

export type ConsentKind = "personal_data" | "mailing";

/**
 * Записывает согласие.
 *
 * Строки не переписываем: каждое согласие — отдельная запись. Так видно всю
 * историю, включая повторное согласие после отзыва.
 */
export async function recordConsent(input: {
  userId: string;
  kind: ConsentKind;
  docVersion: string;
}): Promise<void> {
  const sb = createSupabaseAdminClient();
  const h = await headers();

  const { error } = await sb.from("user_consents").insert({
    user_id: input.userId,
    kind: input.kind,
    doc_version: input.docVersion,
    user_agent: h.get("user-agent")?.slice(0, 300) ?? null,
    // За обратным прокси настоящий адрес приходит в заголовке.
    ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
  });

  if (error) console.log(`[Согласия] не записал: ${error.message}`);
}

/** Отзыв согласия — отмечаем последнюю действующую запись. */
export async function revokeConsent(userId: string, kind: ConsentKind): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb
    .from("user_consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("kind", kind)
    .is("revoked_at", null);
}

/** Согласен ли человек на рассылку сейчас. */
export async function hasMailingConsent(userId: string): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("user_consents")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", "mailing")
    .is("revoked_at", null)
    .limit(1);
  return (data ?? []).length > 0;
}
