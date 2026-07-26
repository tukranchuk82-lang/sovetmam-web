"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/user-session";
import { setViewMode, type ViewMode } from "@/lib/view-mode";

/**
 * Переключение режима «пользователь ↔ администратор».
 *
 * Доступно только владельцу и техспецу: обычному пользователю переключать
 * нечего, а подделка cookie ничего не даст — доступ к /admin по-прежнему
 * проверяется по роли, а не по режиму.
 */
export async function switchViewMode(mode: ViewMode): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/profile");

  await setViewMode(mode);
  revalidatePath("/profile");
  revalidatePath("/admin", "layout");

  redirect(mode === "admin" ? "/admin" : "/profile");
}
