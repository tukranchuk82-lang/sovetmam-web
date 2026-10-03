import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { LessonForm } from "@/components/admin/lesson-form";
import { saveLessonAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Новый урок" };

export default async function NewLessonPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/instructions/new");
  if (staff.role !== "owner" && staff.role !== "tech") redirect("/admin/instructions");

  return (
    <div className="px-4 pb-10 pt-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/admin/instructions" className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white">
          <ArrowLeft className="size-4" /> Все уроки
        </Link>
        <h1 className="mt-3 text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Новый урок
        </h1>
        <div className="mt-6">
          <LessonForm action={saveLessonAction.bind(null, null)} />
        </div>
      </div>
    </div>
  );
}
