"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { visitorId } from "@/lib/share";
import { getCurrentAppUser } from "@/lib/user-session";

/**
 * Отметка «человек открыл карточку меры» — для отчёта «Что смотрят» в админке.
 *
 * Пишем не чаще одного раза в сутки на устройство и меру: обновление страницы
 * или возврат «назад» не должны накручивать счётчик. Кабинеты сотрудников не
 * считаем — они листают каталог по работе, и их просмотры исказили бы картину.
 * Ошибки не показываем никому: счётчик не стоит того, чтобы ломать страницу.
 */
export async function recordMeasureView(slug: string): Promise<void> {
  if (!/^[a-z0-9-]{1,160}$/i.test(slug)) return;

  const user = await getCurrentAppUser();
  if (user && user.role !== "user") return;

  const visitor = await visitorId();
  const sb = createSupabaseAdminClient();

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { count } = await sb
    .from("measure_views")
    .select("id", { count: "exact", head: true })
    .eq("visitor", visitor)
    .eq("slug", slug)
    .gte("created_at", dayStart.toISOString());
  if ((count ?? 0) > 0) return;

  const { error } = await sb.from("measure_views").insert({
    slug,
    visitor,
    user_id: user?.id ?? null,
  });
  if (error) console.log(`[Просмотры мер] не записал: ${error.message}`);
}
