import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { getLesson } from "@/lib/lessons-db";
import { LessonForm } from "@/components/admin/lesson-form";
import { deleteLessonAction, saveLessonAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Изменить урок" };

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getCurrentStaff();
  if (!staff) redirect(`/login?next=/admin/instructions/${id}/edit`);
  if (staff.role !== "owner" && staff.role !== "tech") redirect("/admin/instructions");

  const lesson = await getLesson(id);
  if (!lesson) notFound();

  return (
    <div className="px-4 pb-10 pt-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/admin/instructions" className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white">
          <ArrowLeft className="size-4" /> Все уроки
        </Link>
        <h1 className="mt-3 text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Изменить урок
        </h1>
        <div className="mt-6">
          <LessonForm
            action={saveLessonAction.bind(null, lesson.id)}
            initial={{
              title: lesson.title,
              description: lesson.description,
              videoPath: lesson.videoPath,
              videoUrl: lesson.videoUrl,
              videoSize: lesson.videoSize,
              isPublished: lesson.isPublished,
            }}
          />
        </div>

        <form action={deleteLessonAction.bind(null, lesson.id)} className="mt-10 border-t border-white/10 pt-5">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="size-4" /> Удалить урок
          </button>
          <p className="mt-1.5 text-xs text-white/50">Урок и загруженное видео будут удалены без возможности восстановления.</p>
        </form>
      </div>
    </div>
  );
}
