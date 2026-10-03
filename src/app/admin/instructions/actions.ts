"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/user-session";
import { createLesson, deleteLesson, markWatched, moveLesson, updateLesson, getLesson, LESSON_MAX_BYTES } from "@/lib/lessons-db";

export type LessonFormState = { error: string | null };

/** Уроки правят только владелец и техспец — по настоящей роли, а не по режиму просмотра. */
async function requireManager() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/instructions");
  if (staff.role !== "owner" && staff.role !== "tech") redirect("/admin/instructions");
  return staff;
}

function refresh(id?: string) {
  revalidatePath("/admin/instructions");
  if (id) revalidatePath(`/admin/instructions/${id}`);
}

/** Создать урок (id = null) или сохранить изменения. */
export async function saveLessonAction(
  id: string | null,
  _prev: LessonFormState,
  fd: FormData,
): Promise<LessonFormState> {
  const staff = await requireManager();

  const title = String(fd.get("title") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const videoPath = String(fd.get("videoPath") ?? "").trim() || null;
  const videoUrl = String(fd.get("videoUrl") ?? "").trim() || null;
  const sizeRaw = Number(fd.get("videoSize") ?? 0);
  const isPublished = fd.get("isPublished") === "on";

  if (title.length < 2) return { error: "Напишите название урока" };
  if (videoPath && !/^lessons\/[\w.-]+$/.test(videoPath)) return { error: "Не удалось определить загруженный файл" };
  if (videoUrl && !/^https?:\/\//i.test(videoUrl)) return { error: "Ссылка на видео должна начинаться с http:// или https://" };
  if (isPublished && !videoPath && !videoUrl) {
    return { error: "Чтобы показать урок координаторам, загрузите видео или вставьте ссылку на него" };
  }

  const input = {
    title,
    description,
    // Если загружен файл, ссылка не нужна — чтобы не было двух источников.
    videoPath,
    videoUrl: videoPath ? null : videoUrl,
    videoSize: videoPath && sizeRaw > 0 && sizeRaw <= LESSON_MAX_BYTES ? Math.round(sizeRaw) : null,
    isPublished,
  };

  if (id) {
    const existing = await getLesson(id);
    if (!existing) return { error: "Урок не найден" };
    const ok = await updateLesson(id, input, existing.videoPath);
    if (!ok) return { error: "Не получилось сохранить урок" };
    refresh(id);
  } else {
    const newId = await createLesson(input, staff.id);
    if (!newId) return { error: "Не получилось создать урок" };
    refresh();
  }
  redirect("/admin/instructions");
}

export async function deleteLessonAction(id: string): Promise<void> {
  await requireManager();
  await deleteLesson(id);
  refresh(id);
  redirect("/admin/instructions");
}

export async function moveLessonAction(id: string, dir: "up" | "down"): Promise<void> {
  await requireManager();
  await moveLesson(id, dir);
  refresh();
}

/** Отметка «урок просмотрен» — для любого сотрудника, на себя. */
export async function markLessonWatchedAction(lessonId: string): Promise<void> {
  const staff = await getCurrentStaff();
  if (!staff) return;
  await markWatched(lessonId, staff.id);
  refresh(lessonId);
}
