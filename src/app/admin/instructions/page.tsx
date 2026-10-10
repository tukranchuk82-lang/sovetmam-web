import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, Eye, EyeOff, Pencil, PlayCircle, Plus } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { getWatchedIds, listLessons } from "@/lib/lessons-db";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { moveLessonAction } from "./actions";

export const metadata = { title: "Инструкции" };
export const dynamic = "force-dynamic";

/** Цвета полосок на карточках — те же, что у категорий мер, чтобы страница не была монохромной. */
const STRIPES = ["#1B3A6B", "#5B4B8A", "#2E7D5B", "#B58A24", "#2F6DB3", "#6E4FA3", "#4a9590"];

function mb(n: number): string {
  return `${(n / 1024 / 1024).toFixed(0)} МБ`;
}

export default async function InstructionsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/instructions");

  const manager = staff.role === "owner" || staff.role === "tech";
  // Аналитик видит всё — и черновики тоже, — но без кнопок управления.
  const viewsAll = manager || staff.role === "analyst";
  // Служебные пометки («Видят координаторы», «Черновик», размер видео — только в
  // режиме владельца и техспеца. В режиме «Координатор» экран выглядит так, как
  // его увидит настоящий координатор, — в том числе на записи обучающего видео.
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  const showMarks = viewsAll && scope !== "coordinator";
  const [lessons, watched] = await Promise.all([
    listLessons({ publishedOnly: !viewsAll }),
    getWatchedIds(staff.id),
  ]);

  return (
    <AdminPage
      icon={<PlayCircle />}
      title="Инструкции"
      description={
        manager
          ? "Видео-уроки для координаторов. Добавляйте уроки, меняйте их порядок и решайте, что показывать."
          : "Короткие видео о том, как работать с кабинетом координатора. Смотрите по порядку."
      }
      actions={
        manager ? (
          <Link
            href="/admin/instructions/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#2FA36B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#28915E]"
          >
            <Plus className="size-4" /> Добавить урок
          </Link>
        ) : undefined
      }
    >
      {lessons.length === 0 ? (
        <div className="light-surface rounded-2xl border bg-card px-6 py-12 text-center">
          <PlayCircle className="mx-auto size-10 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="mt-3 font-semibold">{manager ? "Пока нет ни одного урока" : "Уроки скоро появятся"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {manager ? "Нажмите «Добавить урок», загрузите видео и напишите, о чём оно." : "Мы добавляем видео-инструкции."}
          </p>
        </div>
      ) : (
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
          {lessons.map((l, i) => {
            const stripe = STRIPES[i % STRIPES.length];
            const done = watched.has(l.id);
            return (
              <li key={l.id}>
                <div className="relative flex h-full overflow-hidden rounded-2xl bg-white text-[#20242c] shadow-[0_8px_24px_-14px_rgba(0,0,0,0.6)]">
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: stripe }} />
                  <Link
                    href={`/admin/instructions/${l.id}`}
                    className="group flex min-w-0 flex-1 gap-4 p-4 pl-6 transition-colors hover:bg-[#FBF8F3]"
                  >
                    <span
                      className="grid size-14 shrink-0 place-items-center rounded-xl text-white"
                      style={{ background: stripe }}
                    >
                      <PlayCircle className="size-7" strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[11.5px] font-bold uppercase tracking-wide" style={{ color: stripe }}>
                          Урок {i + 1}
                        </span>
                        {done && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            <CheckCircle2 className="size-3" /> Просмотрено
                          </span>
                        )}
                        {showMarks && !l.isPublished && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 ring-1 ring-inset ring-stone-300">
                            <EyeOff className="size-3" /> Черновик
                          </span>
                        )}
                        {showMarks && l.isPublished && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                            <Eye className="size-3" /> Видят координаторы
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-[17px] font-bold leading-snug">{l.title}</span>
                      {l.description && (
                        <span className="mt-1 line-clamp-2 block text-[13.5px] leading-snug text-[#5d6470]">
                          {l.description}
                        </span>
                      )}
                      {showMarks && l.videoSize ? (
                        <span className="mt-1.5 block text-xs text-[#8a8f98]">Видео · {mb(l.videoSize)}</span>
                      ) : null}
                    </span>
                  </Link>

                  {manager && (
                    <div className="flex shrink-0 flex-col items-center justify-center gap-1 border-l border-[#E8E1D4] px-2">
                      <form action={moveLessonAction.bind(null, l.id, "up")}>
                        <button
                          type="submit"
                          disabled={i === 0}
                          aria-label="Поднять выше"
                          title="Поднять выше"
                          className="grid size-8 place-items-center rounded-lg text-[#5d6470] hover:bg-[#F1ECE2] disabled:opacity-30"
                        >
                          <ArrowUp className="size-4" />
                        </button>
                      </form>
                      <Link
                        href={`/admin/instructions/${l.id}/edit`}
                        aria-label="Изменить урок"
                        title="Изменить"
                        className="grid size-8 place-items-center rounded-lg text-[#1B3A6B] hover:bg-[#E4EBF7]"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <form action={moveLessonAction.bind(null, l.id, "down")}>
                        <button
                          type="submit"
                          disabled={i === lessons.length - 1}
                          aria-label="Опустить ниже"
                          title="Опустить ниже"
                          className="grid size-8 place-items-center rounded-lg text-[#5d6470] hover:bg-[#F1ECE2] disabled:opacity-30"
                        >
                          <ArrowDown className="size-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </AdminPage>
  );
}
