import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Избранное пользователя: список сохранённых мер. Пишем/читаем через
// service_role (RLS закрыт для клиентов). См. миграцию 0009_saved_measures.

interface SavedRow {
  measure_slug: string;
}

/** Слаги сохранённых мер пользователя, свежие сверху. */
export async function listSavedSlugs(userId: string): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("saved_measures")
    .select("measure_slug")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as SavedRow[]).map((r) => r.measure_slug);
}

/** Сохранена ли конкретная мера. */
export async function isMeasureSaved(
  userId: string,
  slug: string,
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("saved_measures")
    .select("id")
    .eq("user_id", userId)
    .eq("measure_slug", slug)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/** Добавить меру в избранное (повтор игнорируется — есть unique-ключ). */
export async function addSaved(userId: string, slug: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("saved_measures")
    .upsert(
      { user_id: userId, measure_slug: slug },
      { onConflict: "user_id,measure_slug", ignoreDuplicates: true },
    );
  if (error) throw error;
}

/** Убрать меру из избранного. */
export async function removeSaved(userId: string, slug: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("saved_measures")
    .delete()
    .eq("user_id", userId)
    .eq("measure_slug", slug);
  if (error) throw error;
}

/**
 * Переключить сохранение и вернуть новое состояние (true — теперь в избранном).
 */
export async function toggleSaved(
  userId: string,
  slug: string,
): Promise<boolean> {
  const already = await isMeasureSaved(userId, slug);
  if (already) {
    await removeSaved(userId, slug);
    return false;
  }
  await addSaved(userId, slug);
  return true;
}
