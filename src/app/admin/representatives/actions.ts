"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRepresentative,
  updateRepresentative,
  deleteRepresentative,
  type RepresentativeInput,
} from "@/lib/representatives-db";

function buildInput(fd: FormData): RepresentativeInput {
  const str = (key: string) => {
    const v = String(fd.get(key) ?? "").trim();
    return v || null;
  };
  return {
    region: String(fd.get("region") ?? "").trim(),
    name: String(fd.get("name") ?? "").trim(),
    description: str("description"),
    address: str("address"),
    phone: str("phone"),
    email: str("email"),
    website: str("website"),
    isPublished: fd.get("isPublished") === "on",
  };
}

function revalidate() {
  revalidatePath("/admin/representatives");
  revalidatePath("/podbor");
  revalidatePath("/catalog");
  revalidatePath("/catalog/[slug]", "page");
  revalidatePath("/segment/[id]", "page");
  revalidatePath("/situation/[key]", "page");
  revalidatePath("/topic/[key]", "page");
  revalidatePath("/class/[key]", "page");
  revalidatePath("/family/[count]", "page");
}

export async function createRepresentativeAction(fd: FormData) {
  const input = buildInput(fd);
  if (!input.region || !input.name) {
    throw new Error("Заполните регион и название организации");
  }
  const id = await createRepresentative(input);
  revalidate();
  redirect(`/admin/representatives/${id}`);
}

export async function updateRepresentativeAction(id: string, fd: FormData) {
  const input = buildInput(fd);
  if (!input.region || !input.name) {
    throw new Error("Заполните регион и название организации");
  }
  await updateRepresentative(id, input);
  revalidate();
  redirect(`/admin/representatives/${id}`);
}

export async function deleteRepresentativeAction(id: string) {
  await deleteRepresentative(id);
  revalidate();
  redirect("/admin/representatives");
}
