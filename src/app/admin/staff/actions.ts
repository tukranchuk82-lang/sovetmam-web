"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/user-session";
import { getAppUserByEmail } from "@/lib/onboarding-db";
import {
  createOwnerRequest,
  decideOwnerRequest,
  setUserRole,
} from "@/lib/staff-db";

function requireAdmin() {
  return getCurrentAdmin().then((admin) => {
    if (!admin) redirect("/login?next=/admin/staff");
    return admin;
  });
}

/** Назначить существующего пользователя координатором региона. */
export async function promoteToCoordinatorAction(fd: FormData) {
  await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const region = String(fd.get("region") ?? "").trim();
  if (!email || !region) throw new Error("Укажите почту и регион");

  const user = await getAppUserByEmail(email);
  if (!user) throw new Error("Такого email нет среди зарегистрированных пользователей — сначала человек должен один раз войти в приложение");
  if (user.role === "owner") throw new Error("Нельзя понизить владельца назначением координатором — сначала снимите с него роль владельца");

  await setUserRole(user.id, "coordinator", region);
  revalidatePath("/admin/staff");
}

/** Разжаловать координатора — обратно в обычного пользователя. */
export async function demoteCoordinatorAction(userId: string) {
  await requireAdmin();
  await setUserRole(userId, "user");
  revalidatePath("/admin/staff");
}

/** Разжаловать техспеца — только владелец. */
export async function demoteTechAction(userId: string) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Разжаловать техспеца может только владелец");
  await setUserRole(userId, "user");
  revalidatePath("/admin/staff");
}

/** Назначить техспеца — владелец и сам техспец (растить себе команду можно вдвоём). */
export async function promoteToTechAction(fd: FormData) {
  await requireAdmin();
  const email = String(fd.get("techEmail") ?? "").trim().toLowerCase();
  if (!email) throw new Error("Укажите почту");
  const user = await getAppUserByEmail(email);
  if (!user) throw new Error("Такого email нет среди зарегистрированных пользователей");
  if (user.role === "owner") throw new Error("Уже владелец");
  await setUserRole(user.id, "tech");
  revalidatePath("/admin/staff");
}

/** Владелец передаёт права владельца напрямую — подтверждения не требуется, он и так полностью доверен. */
export async function grantOwnerDirectAction(fd: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Передать права владельца может только владелец");
  const email = String(fd.get("ownerEmail") ?? "").trim().toLowerCase();
  if (!email) throw new Error("Укажите почту");
  const user = await getAppUserByEmail(email);
  if (!user) throw new Error("Такого email нет среди зарегистрированных пользователей");
  await setUserRole(user.id, "owner");
  revalidatePath("/admin/staff");
}

/** Техспец только предлагает кандидата — нужно подтверждение владельца. */
export async function requestOwnerAction(fd: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "tech") throw new Error("Предложить кандидата может только техспец");
  const email = String(fd.get("candidateEmail") ?? "").trim().toLowerCase();
  if (!email) throw new Error("Укажите почту");
  const user = await getAppUserByEmail(email);
  if (!user) throw new Error("Такого email нет среди зарегистрированных пользователей");
  if (user.role === "owner") throw new Error("Уже владелец");
  await createOwnerRequest(admin.id, user.id);
  revalidatePath("/admin/staff");
}

export async function decideOwnerRequestAction(requestId: string, approve: boolean) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Решение по заявке принимает только владелец");
  await decideOwnerRequest(requestId, admin.id, approve);
  revalidatePath("/admin/staff");
}
