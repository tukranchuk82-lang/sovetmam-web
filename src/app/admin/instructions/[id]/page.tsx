import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { embedUrlFor, getLesson, getWatchedIds, listLessons, signedVideoUrl } from "@/lib/lessons-db";
import { LessonPlayer } from "@/components/admin/lesson-player";

export const dynamic = "force-dynamic";
export const metadata = { title: "Инструкции" };

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getCurrentStaff();
  if (!staff) redirect(`/login?next=/admin/instructions/${id}`);
  const manager = staff.role === "owner" || staff.role === "tech";
  const viewsAll = manager || staff.role === "analyst";

  const lesson = await getLesson(id);
  // Черновик координатору не показываем — как будто его нет.
  if (!lesson || (!lesson.isPublished && !viewsAll)) notFound();

  const [lessons, watched] = await Promise.all([listLessons({ publishedOnly: !viewsAll }), getWatchedIds(staff.id)]);
  const index = lessons.findIndex((l) => l.id === id);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;

  const src = lesson.videoPath ? await signedVideoUrl(lesson.videoPath) : null;
  const embed = !src && lesson.videoUrl ? embedUrlFor(lesson.videoUrl) : null;

  return (
    <div className="px-4 pb-10 pt-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/instructions" className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white">
          <ArrowLeft className="size-4" /> Все уроки
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-white/55">Урок {index + 1}</p>
            <h1 className="mt-0.5 text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {lesson.title}
            </h1>
          </div>
          {manager && (
            <Link
              href={`/admin/instructions/${lesson.id}/edit`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[13px] font-semibold hover:bg-white/20"
            >
              <Pencil className="size-3.5" /> Изменить
            </Link>
          )}
        </div>

        <div className="mt-4">
          <LessonPlayer
            lessonId={lesson.id}
            src={src}
            embed={embed}
            externalUrl={!src && !embed ? lesson.videoUrl : null}
            watched={watched.has(lesson.id)}
          />
        </div>

        {lesson.description && (
          <div className="light-surface mt-5 whitespace-pre-line rounded-2xl border bg-card p-5 text-[15px] leading-relaxed">
            {lesson.description}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          {prev ? (
            <Link
              href={`/admin/instructions/${prev.id}`}
              className="inline-flex min-w-0 items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="truncate">Предыдущий</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/admin/instructions/${next.id}`}
              className="inline-flex min-w-0 items-center gap-2 rounded-xl bg-[#2FA36B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#28915E]"
            >
              <span className="truncate">Следующий урок</span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
