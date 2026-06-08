"use server";

import { revalidatePath } from "next/cache";
import { setAdminThemeCookie, type AdminTheme } from "@/lib/admin-theme";

export async function setAdminThemeAction(theme: AdminTheme) {
  await setAdminThemeCookie(theme);
  revalidatePath("/admin", "layout");
}
