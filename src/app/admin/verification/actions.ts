"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/user-session";

/** Отметить меру как сверённую с официальным источником. */
export async function markVerifiedAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("measures")
    .update({
      verified_at: new Date().toISOString(),
      verified_by: `${admin.firstName} ${admin.lastName}`.trim(),
    })
    .eq("slug", slug);

  revalidatePath("/admin/verification");
}

/** Снять отметку — если при вычитке нашлось расхождение и меру надо доработать. */
export async function unmarkVerifiedAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("measures")
    .update({ verified_at: null, verified_by: null })
    .eq("slug", slug);

  revalidatePath("/admin/verification");
}
