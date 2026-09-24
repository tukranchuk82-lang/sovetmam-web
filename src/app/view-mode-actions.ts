"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/user-session";
import { setViewMode, type ViewMode } from "@/lib/view-mode";

// Куда можно приземлиться после переключения. Список закрытый, а не
// произвольный адрес из формы: иначе action превратился бы в открытый
// редирект (bind-параметры server action приходят от клиента).
const LANDINGS = ["/", "/profile", "/admin"] as const;
export type ViewLanding = (typeof LANDINGS)[number];

/**
 * Переключение режима «пользователь ↔ администратор».
 *
 * Доступно только владельцу и техспецу: обычному пользователю переключать
 * нечего, а подделка cookie ничего не даст — доступ к /admin по-прежнему
 * проверяется по роли, а не по режиму.
 *
 * `to` — куда перейти после переключения. По умолчанию: в админку или в
 * личный кабинет (как раньше). Из админки в «пользовательский интерфейс»
 * ведём на главную — это и есть то, что видит обычный человек.
 */
export async function switchViewMode(mode: ViewMode, to?: ViewLanding): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/profile");

  await setViewMode(mode);
  revalidatePath("/profile");
  revalidatePath("/admin", "layout");

  const fallback = mode === "admin" ? "/admin" : "/profile";
  redirect(to && LANDINGS.includes(to) ? to : fallback);
}
