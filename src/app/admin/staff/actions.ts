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

/**
 * Результат формы на странице сотрудников. Ошибки возвращаем текстом, а не
 * бросаем: брошенная ошибка уводила на страницу сбоя, из которой в
 * установленном приложении не вернуться.
 */
export type StaffFormState = { error: string | null; done: string | null };

const NOT_REGISTERED =
  "Такого email нет среди зарегистрированных. Сначала человек должен один раз войти в приложение по этой почте — после этого его можно назначить.";

/** Назначить существующего пользователя координатором региона. */
export async function promoteToCoordinatorAction(_prev: StaffFormState, fd: FormData): Promise<StaffFormState> {
  await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const region = String(fd.get("region") ?? "").trim();
  if (!email || !region) return { error: "Укажите почту и выберите регион.", done: null };

  const user = await getAppUserByEmail(email);
  if (!user) return { error: NOT_REGISTERED, done: null };
  if (user.role === "owner") {
    return { error: "Нельзя понизить владельца назначением координатором — сначала снимите с него роль владельца.", done: null };
  }

  await setUserRole(user.id, "coordinator", region);
  revalidatePath("/admin/staff");
  return { error: null, done: `${email} назначен координатором: ${region}.` };
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
export async function promoteToTechAction(_prev: StaffFormState, fd: FormData): Promise<StaffFormState> {
  await requireAdmin();
  const email = String(fd.get("techEmail") ?? "").trim().toLowerCase();
  if (!email) return { error: "Укажите почту.", done: null };
  const user = await getAppUserByEmail(email);
  if (!user) return { error: NOT_REGISTERED, done: null };
  if (user.role === "owner") return { error: "Этот человек уже владелец.", done: null };
  await setUserRole(user.id, "tech");
  revalidatePath("/admin/staff");
  return { error: null, done: `${email} назначен техспецом.` };
}

/** Владелец передаёт права владельца напрямую — подтверждения не требуется, он и так полностью доверен. */
export async function grantOwnerDirectAction(_prev: StaffFormState, fd: FormData): Promise<StaffFormState> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") return { error: "Передать права владельца может только владелец.", done: null };
  const email = String(fd.get("ownerEmail") ?? "").trim().toLowerCase();
  if (!email) return { error: "Укажите почту.", done: null };
  const user = await getAppUserByEmail(email);
  if (!user) return { error: NOT_REGISTERED, done: null };
  await setUserRole(user.id, "owner");
  revalidatePath("/admin/staff");
  return { error: null, done: `${email} теперь владелец.` };
}

/** Техспец только предлагает кандидата — нужно подтверждение владельца. */
export async function requestOwnerAction(_prev: StaffFormState, fd: FormData): Promise<StaffFormState> {
  const admin = await requireAdmin();
  if (admin.role !== "tech") return { error: "Предложить кандидата может только техспец.", done: null };
  const email = String(fd.get("candidateEmail") ?? "").trim().toLowerCase();
  if (!email) return { error: "Укажите почту.", done: null };
  const user = await getAppUserByEmail(email);
  if (!user) return { error: NOT_REGISTERED, done: null };
  if (user.role === "owner") return { error: "Этот человек уже владелец.", done: null };
  await createOwnerRequest(admin.id, user.id);
  revalidatePath("/admin/staff");
  return { error: null, done: "Заявка отправлена — её должен подтвердить владелец." };
}

export async function decideOwnerRequestAction(requestId: string, approve: boolean) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Решение по заявке принимает только владелец");
  await decideOwnerRequest(requestId, admin.id, approve);
  revalidatePath("/admin/staff");
}

/** Назначить аналитика — видит всю админку, но ничего не меняет. */
export async function promoteToAnalystAction(_prev: StaffFormState, fd: FormData): Promise<StaffFormState> {
  await requireAdmin();
  const email = String(fd.get("analystEmail") ?? "").trim().toLowerCase();
  if (!email) return { error: "Укажите почту.", done: null };
  const user = await getAppUserByEmail(email);
  if (!user) return { error: NOT_REGISTERED, done: null };
  if (user.role === "owner" || user.role === "tech") {
    return { error: "Этот человек владелец или техспец — у него и так полный доступ. Сначала снимите с него эту роль.", done: null };
  }
  await setUserRole(user.id, "analyst");
  revalidatePath("/admin/staff");
  return { error: null, done: `${email} назначен аналитиком: видит всё, менять ничего не может.` };
}

/** Снять роль аналитика — обратно в обычного пользователя. */
export async function demoteAnalystAction(userId: string) {
  await requireAdmin();
  await setUserRole(userId, "user");
  revalidatePath("/admin/staff");
}
