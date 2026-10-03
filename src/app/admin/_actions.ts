"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteMeasure as dbDeleteMeasure,
  getMeasureForAdmin,
  insertMeasure,
  updateMeasure,
  type MeasureAdminRow,
  type MeasureInput,
} from "@/lib/measures-admin";
import { getCurrentAdmin, getCurrentStaff } from "@/lib/user-session";
import type { AppUser } from "@/lib/onboarding-db";

function getString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function getOptionalString(fd: FormData, key: string): string | null {
  const v = getString(fd, key);
  return v.length > 0 ? v : null;
}

function getList(fd: FormData, key: string): string[] {
  return getString(fd, key)
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getSegments(fd: FormData): string[] {
  // Чекбоксы: каждый с name="segment" и value=id.
  return fd.getAll("segment").map((v) => String(v));
}

function getCriteria(fd: FormData): MeasureInput["criteria"] {
  const c: MeasureInput["criteria"] = {};
  if (fd.get("criteria_requiresPregnancy")) c.requiresPregnancy = true;
  if (fd.get("criteria_requiresChildren")) c.requiresChildren = true;
  if (fd.get("criteria_requiresLowIncome")) c.requiresLowIncome = true;
  if (fd.get("criteria_requiresDisabledChild")) c.requiresDisabledChild = true;
  if (fd.get("criteria_requiresMortgageIntent")) c.requiresMortgageIntent = true;
  if (fd.get("criteria_requiresSvoFamily")) c.requiresSvoFamily = true;
  if (fd.get("criteria_requiresSingleParent")) c.requiresSingleParent = true;
  if (fd.get("criteria_requiresStudent")) c.requiresStudent = true;
  if (fd.get("criteria_requiresParentUnder35")) c.requiresParentUnder35 = true;
  if (fd.get("criteria_requiresDisabledParent")) c.requiresDisabledParent = true;
  if (fd.get("criteria_requiresFosterParent")) c.requiresFosterParent = true;
  if (fd.get("criteria_requiresSelfEmployed")) c.requiresSelfEmployed = true;
  if (fd.get("criteria_requiresEntrepreneur")) c.requiresEntrepreneur = true;
  if (fd.get("criteria_requiresTeacher")) c.requiresTeacher = true;

  const gender = getOptionalString(fd, "criteria_gender");
  if (gender === "female" || gender === "male") c.gender = gender;

  const minChildren = getOptionalString(fd, "criteria_minChildren");
  if (minChildren) c.minChildren = Number(minChildren);

  const maxAge = getOptionalString(fd, "criteria_maxYoungestChildAgeYears");
  if (maxAge) c.maxYoungestChildAgeYears = Number(maxAge);

  // Шкала дохода: только 1 / 1.5 / 2 ПМ — иначе движок правил сравнивает
  // с порогом, которого нет ни в одном варианте анкеты.
  const maxIncomePm = getOptionalString(fd, "criteria_maxIncomePm");
  if (maxIncomePm === "1" || maxIncomePm === "1.5" || maxIncomePm === "2") {
    c.maxIncomePm = Number(maxIncomePm) as 1 | 1.5 | 2;
  }

  const regions = getList(fd, "criteria_regions");
  if (regions.length > 0) c.regions = regions;

  return c;
}

function buildInput(fd: FormData): MeasureInput {
  const level = getString(fd, "level") as "federal" | "regional";
  return {
    slug: getString(fd, "slug"),
    title: getString(fd, "title"),
    shortDescription: getString(fd, "shortDescription"),
    level,
    region: getOptionalString(fd, "region"),
    category: getString(fd, "category"),
    amount: getOptionalString(fd, "amount"),
    segments: getSegments(fd),
    criteria: getCriteria(fd),
    eligibility: getOptionalString(fd, "eligibility"),
    howToApply: getList(fd, "howToApply"),
    documents: getList(fd, "documents"),
    tips: getList(fd, "tips"),
    sourceUrl: getString(fd, "sourceUrl"),
    sourceName: getString(fd, "sourceName"),
    updatedAtLabel: getOptionalString(fd, "updatedAtLabel"),
    isPublished: fd.get("isPublished") === "on",
    sortOrder: Number(getString(fd, "sortOrder") || "0"),
  };
}

function revalidate(slug: string) {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/measures");
  revalidatePath(`/admin/measures/${slug}`);
  // Сегменты затронуты любой правкой — перевалидируем все.
  revalidatePath("/segment/[id]", "page");
}

/**
 * Координатор правит содержание меры своего региона, но не логику подбора и
 * не её классификацию — иначе он мог бы (случайно или нет) перекинуть меру в
 * другой регион или сломать критерии, от которых зависит вся выдача подбора.
 * Поле формы для этих полей координатору вообще не показываем (см.
 * MeasureForm mode="coordinator"), но это только удобство: здесь, на
 * сервере, — настоящая граница. Что бы ни пришло в fd, технические поля
 * берём из уже сохранённой меры, а не из запроса.
 */
function lockTechnicalFields(input: MeasureInput, original: MeasureAdminRow): MeasureInput {
  return {
    ...input,
    slug: original.slug,
    level: original.level,
    region: original.region ?? null,
    segments: original.segments,
    criteria: original.criteria,
    sortOrder: original.sortOrder,
  };
}

/** Координатор — только если мера уже принадлежит его региону; иначе — полный админ. */
async function authorizeMeasureEdit(originalSlug: string): Promise<{
  admin: AppUser;
  original: MeasureAdminRow;
}> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/measures");

  const original = await getMeasureForAdmin(originalSlug);
  if (!original) throw new Error("Мера не найдена");

  if (staff.role === "coordinator") {
    if (!staff.region || original.region !== staff.region) {
      throw new Error("Эта мера не в вашем регионе — правка недоступна");
    }
  } else if (staff.role !== "owner" && staff.role !== "tech") {
    redirect("/login?next=/admin/measures");
  }

  return { admin: staff, original };
}

export async function createMeasureAction(fd: FormData) {
  // Создавать новые меры может только полный админ — координатор правит то,
  // что уже есть в его регионе, но не заводит новое.
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin/measures");

  const input = buildInput(fd);
  if (!input.slug || !input.title) {
    throw new Error("Заполните хотя бы slug и название");
  }
  await insertMeasure(input);
  revalidate(input.slug);
  redirect(`/admin/measures/${input.slug}`);
}

export async function updateMeasureAction(originalSlug: string, fd: FormData) {
  const { admin, original } = await authorizeMeasureEdit(originalSlug);

  let input = buildInput(fd);
  if (admin.role === "coordinator") input = lockTechnicalFields(input, original);
  if (!input.slug || !input.title) {
    throw new Error("Заполните хотя бы slug и название");
  }
  await updateMeasure(originalSlug, input);
  revalidate(input.slug);
  if (originalSlug !== input.slug) revalidate(originalSlug);
  redirect(`/admin/measures/${input.slug}`);
}

export async function deleteMeasureAction(slug: string) {
  // Удалять меры может только полный админ.
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin/measures");

  await dbDeleteMeasure(slug);
  revalidate(slug);
  redirect("/admin/measures");
}
