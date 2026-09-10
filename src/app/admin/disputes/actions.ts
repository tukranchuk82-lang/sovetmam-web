"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/user-session";
import { addDisputeNote, resolveDispute, reopenDispute } from "@/lib/measure-disputes";

export async function addDisputeNoteAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const disputeId = String(formData.get("disputeId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!disputeId || !body) return;

  const authorName = `${admin.firstName} ${admin.lastName}`.trim();
  await addDisputeNote(disputeId, authorName, body);

  revalidatePath("/admin/disputes");
}

export async function resolveDisputeAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const disputeId = String(formData.get("disputeId") ?? "");
  if (!disputeId) return;

  await resolveDispute(disputeId, `${admin.firstName} ${admin.lastName}`.trim());
  revalidatePath("/admin/disputes");
}

export async function reopenDisputeAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const disputeId = String(formData.get("disputeId") ?? "");
  if (!disputeId) return;

  await reopenDispute(disputeId);
  revalidatePath("/admin/disputes");
}
