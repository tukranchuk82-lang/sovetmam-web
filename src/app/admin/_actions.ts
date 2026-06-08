"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteMeasure as dbDeleteMeasure,
  insertMeasure,
  updateMeasure,
  type MeasureInput,
} from "@/lib/measures-admin";

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

  const minChildren = getOptionalString(fd, "criteria_minChildren");
  if (minChildren) c.minChildren = Number(minChildren);

  const maxAge = getOptionalString(fd, "criteria_maxYoungestChildAgeYears");
  if (maxAge) c.maxYoungestChildAgeYears = Number(maxAge);

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
  revalidatePath(`/admin/measures/${slug}`);
  // Сегменты затронуты любой правкой — перевалидируем все.
  revalidatePath("/segment/[id]", "page");
}

export async function createMeasureAction(fd: FormData) {
  const input = buildInput(fd);
  if (!input.slug || !input.title) {
    throw new Error("Заполните хотя бы slug и название");
  }
  await insertMeasure(input);
  revalidate(input.slug);
  redirect(`/admin/measures/${input.slug}`);
}

export async function updateMeasureAction(originalSlug: string, fd: FormData) {
  const input = buildInput(fd);
  if (!input.slug || !input.title) {
    throw new Error("Заполните хотя бы slug и название");
  }
  await updateMeasure(originalSlug, input);
  revalidate(input.slug);
  if (originalSlug !== input.slug) revalidate(originalSlug);
  redirect(`/admin/measures/${input.slug}`);
}

export async function deleteMeasureAction(slug: string) {
  await dbDeleteMeasure(slug);
  revalidate(slug);
  redirect("/admin");
}
