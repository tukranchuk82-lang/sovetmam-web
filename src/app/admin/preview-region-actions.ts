"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/user-session";
import { setPreviewRegion } from "@/lib/preview-region";

/**
 * Владелец/техспец выбирают регион для предпросмотра роли координатора.
 * Вызывается напрямую из PreviewRegionPicker (не через <form action>) —
 * компонент сам зовёт router.refresh() следом, поэтому здесь редиректа нет.
 */
export async function setPreviewRegionAction(fd: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin");

  const region = String(fd.get("region") ?? "").trim();
  await setPreviewRegion(region || null);
  revalidatePath("/admin", "layout");
}
