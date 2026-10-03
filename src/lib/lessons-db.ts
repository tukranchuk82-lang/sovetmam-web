import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Инструкции для координаторов: видео-уроки (таблица lessons, миграция 0038).
 *
 * Файл видео лежит в закрытом хранилище lesson-videos (до 500 МБ) и отдаётся
 * по временной подписанной ссылке. Вместо файла можно указать ссылку на видео,
 * выложенное в другом месте.
 */

export const LESSON_BUCKET = "lesson-videos";
export const LESSON_MAX_BYTES = 500 * 1024 * 1024;

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoPath: string | null;
  videoUrl: string | null;
  videoSize: number | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

interface Row {
  id: string;
  title: string;
  description: string;
  video_path: string | null;
  video_url: string | null;
  video_size: number | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

const FIELDS = "id, title, description, video_path, video_url, video_size, sort_order, is_published, created_at";

function fromRow(r: Row): Lesson {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    videoPath: r.video_path,
    videoUrl: r.video_url,
    videoSize: r.video_size,
    sortOrder: r.sort_order,
    isPublished: r.is_published,
    createdAt: r.created_at,
  };
}

export async function listLessons(opts: { publishedOnly: boolean }): Promise<Lesson[]> {
  const sb = createSupabaseAdminClient();
  let q = sb.from("lessons").select(FIELDS).order("sort_order").order("created_at");
  if (opts.publishedOnly) q = q.eq("is_published", true);
  const { data } = await q;
  return ((data as Row[] | null) ?? []).map(fromRow);
}

export async function getLesson(id: string): Promise<Lesson | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("lessons").select(FIELDS).eq("id", id).maybeSingle();
  return data ? fromRow(data as Row) : null;
}

export interface LessonInput {
  title: string;
  description: string;
  videoPath: string | null;
  videoUrl: string | null;
  videoSize: number | null;
  isPublished: boolean;
}

export async function createLesson(input: LessonInput, createdBy: string): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  const { data: last } = await sb.from("lessons").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const next = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;
  const { data, error } = await sb
    .from("lessons")
    .insert({
      title: input.title,
      description: input.description,
      video_path: input.videoPath,
      video_url: input.videoUrl,
      video_size: input.videoSize,
      is_published: input.isPublished,
      sort_order: next,
      created_by: createdBy,
    })
    .select("id")
    .single();
  return error || !data ? null : (data.id as string);
}

export async function updateLesson(id: string, input: LessonInput, previousPath: string | null): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("lessons")
    .update({
      title: input.title,
      description: input.description,
      video_path: input.videoPath,
      video_url: input.videoUrl,
      video_size: input.videoSize,
      is_published: input.isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return false;
  // Заменили файл — старый больше не нужен, не копим мусор в хранилище.
  if (previousPath && previousPath !== input.videoPath) {
    await sb.storage.from(LESSON_BUCKET).remove([previousPath]);
  }
  return true;
}

export async function deleteLesson(id: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  const lesson = await getLesson(id);
  await sb.from("lessons").delete().eq("id", id);
  if (lesson?.videoPath) await sb.storage.from(LESSON_BUCKET).remove([lesson.videoPath]);
}

/** Меняет урок местами с соседним (вверх или вниз). */
export async function moveLesson(id: string, dir: "up" | "down"): Promise<void> {
  const sb = createSupabaseAdminClient();
  const all = await listLessons({ publishedOnly: false });
  const i = all.findIndex((l) => l.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) return;
  // Переписываем порядок заново подряд: так номера не «слипаются» после удалений.
  const order = all.map((l) => l.id);
  [order[i], order[j]] = [order[j], order[i]];
  await Promise.all(order.map((lid, idx) => sb.from("lessons").update({ sort_order: idx + 1 }).eq("id", lid)));
}

export async function getWatchedIds(userId: string): Promise<Set<string>> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("lesson_progress").select("lesson_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.lesson_id as string));
}

export async function markWatched(lessonId: string, userId: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb.from("lesson_progress").upsert({ lesson_id: lessonId, user_id: userId }, { onConflict: "lesson_id,user_id" });
}

/** Временная ссылка на файл видео (3 часа) — хватает на просмотр и перемотку. */
export async function signedVideoUrl(path: string): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.storage.from(LESSON_BUCKET).createSignedUrl(path, 3 * 60 * 60);
  return data?.signedUrl ?? null;
}

/**
 * Ссылка на видео из другого места → адрес для встраивания в страницу.
 * Знаем YouTube, RuTube и VK Видео; остальное показываем обычной ссылкой.
 */
export function embedUrlFor(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
    if (host === "rutube.ru") {
      const m = u.pathname.match(/\/(?:video|play\/embed)\/([0-9a-f]+)/i);
      if (m) return `https://rutube.ru/play/embed/${m[1]}`;
    }
    if (host === "vk.com" || host === "vkvideo.ru" || host === "vk.ru") {
      if (u.pathname.includes("video_ext.php")) return url;
      const m = u.pathname.match(/video(-?\d+)_(\d+)/);
      if (m) return `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2`;
    }
  } catch {
    // не ссылка — вернём null
  }
  return null;
}
