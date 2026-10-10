"use server";

import { getCurrentStaff } from "@/lib/user-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Записать, что координатор открыл раздел кабинета. Тихо ничего не делает для
 * остальных ролей и никогда не бросает ошибку: журнал не повод ломать страницу.
 * Из адреса берём только раздел (первые два уровня), без id и параметров.
 */
export async function recordAdminSectionView(pathname: string): Promise<void> {
  try {
    const staff = await getCurrentStaff();
    if (!staff || staff.role !== "coordinator") return;
    const section = "/" + pathname.split("?")[0].split("/").filter(Boolean).slice(0, 2).join("/");
    if (!section.startsWith("/admin")) return;
    await createSupabaseAdminClient().from("admin_page_views").insert({ user_id: staff.id, section });
  } catch {
    // журнал не повод ронять страницу
  }
}
