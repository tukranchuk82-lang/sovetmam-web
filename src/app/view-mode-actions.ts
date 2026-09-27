"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAppUser } from "@/lib/user-session";
import { isStaff } from "@/lib/onboarding-db";
import { ALLOWED_VIEW_MODES, setViewMode, type ViewMode } from "@/lib/view-mode";

// Куда можно приземлиться после переключения. Список закрытый, а не
// произвольный адрес из формы: иначе action превратился бы в открытый
// редирект (bind-параметры server action приходят от клиента).
const LANDINGS = ["/", "/profile", "/admin"] as const;
export type ViewLanding = (typeof LANDINGS)[number];

/**
 * Переключение режима «владелец ↔ техспец ↔ координатор ↔ пользователь».
 *
 * Доступно только владельцу, техспецу и координатору — остальным переключать
 * нечего. Какие переходы разрешены — решает настоящая роль из базы
 * (см. ALLOWED_VIEW_MODES в lib/view-mode.ts), а не то, что пришло в `mode`:
 * координатор, приславший mode="tech" напрямую (например, руками через
 * devtools), просто не получит запрошенный режим — тут действие тихо не
 * применяется, а не роняет ошибку, потому что это не редкая ошибка ввода,
 * а ровно тот случай, который стоит различать: не «что-то сломалось», а
 * «попытка получить то, что не положено».
 *
 * `to` — куда перейти после переключения. По умолчанию: в админку (owner/
 * tech/coordinator) или в личный кабинет (user).
 */
export async function switchViewMode(mode: ViewMode, to?: ViewLanding): Promise<void> {
  const user = await getCurrentAppUser();
  if (!user || !isStaff(user)) redirect("/profile");

  if (!ALLOWED_VIEW_MODES[user.role].includes(mode)) {
    // Запрошенный режим этой роли не положен — остаёмся как есть.
    redirect(to && LANDINGS.includes(to) ? to : "/admin");
  }

  await setViewMode(mode);
  revalidatePath("/profile");
  revalidatePath("/admin", "layout");

  const fallback = mode === "user" ? "/profile" : "/admin";
  redirect(to && LANDINGS.includes(to) ? to : fallback);
}
