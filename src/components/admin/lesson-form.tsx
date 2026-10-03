"use client";

import { useActionState, useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { LessonVideoUploader } from "@/components/admin/lesson-video-uploader";
import type { LessonFormState } from "@/app/admin/instructions/actions";

/**
 * Мини-конструктор урока: название, описание, видео (файл или ссылка) и
 * переключатель «показывать координаторам». Пока урок не опубликован, он
 * виден только владельцу и техспецу.
 */
export function LessonForm({
  action,
  initial,
}: {
  action: (prev: LessonFormState, fd: FormData) => Promise<LessonFormState>;
  initial?: {
    title: string;
    description: string;
    videoPath: string | null;
    videoUrl: string | null;
    videoSize: number | null;
    isPublished: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [uploading, setUploading] = useState(false);

  const field =
    "mt-1.5 w-full rounded-xl border border-transparent bg-[#F1F3F6] px-3.5 py-2.5 text-[15px] text-[#20242c] outline-none placeholder:text-[#6f7580] focus:border-white [color-scheme:light]";

  return (
    <form action={formAction} className="space-y-6">
      <label className="block">
        <span className="text-sm font-semibold">Название урока</span>
        <input
          name="title"
          required
          defaultValue={initial?.title}
          placeholder="Например: Как ответить человеку в чате"
          className={field}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold">Описание</span>
        <span className="mt-0.5 block text-xs text-white/55">О чём урок и что координатор узнает после просмотра.</span>
        <textarea
          name="description"
          rows={5}
          defaultValue={initial?.description}
          placeholder="Коротко опишите содержание урока"
          className={field}
        />
      </label>

      <div>
        <span className="text-sm font-semibold">Видео</span>
        <div className="mt-1.5">
          <LessonVideoUploader
            initialPath={initial?.videoPath ?? null}
            initialSize={initial?.videoSize ?? null}
            onBusyChange={setUploading}
          />
        </div>

        <label className="mt-4 block">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/65">
            <Link2 className="size-3.5" /> Или вставьте ссылку на видео (YouTube, RuTube, VK Видео)
          </span>
          <input
            name="videoUrl"
            type="url"
            defaultValue={initial?.videoUrl ?? ""}
            placeholder="https://"
            className={field}
          />
          <span className="mt-1 block text-xs text-white/45">Если загружен файл, ссылка не используется.</span>
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.07] p-3.5">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={initial?.isPublished}
          className="mt-0.5 size-5 accent-[#2FA36B]"
        />
        <span>
          <span className="block text-sm font-semibold">Показывать координаторам</span>
          <span className="block text-xs text-white/55">
            Без галочки урок остаётся черновиком — его видите только вы.
          </span>
        </span>
      </label>

      {state.error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-200">{state.error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#2FA36B] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#28915E] disabled:opacity-60"
        >
          {(pending || uploading) && <Loader2 className="size-4 animate-spin" />}
          {uploading ? "Идёт загрузка видео…" : initial ? "Сохранить урок" : "Добавить урок"}
        </button>
      </div>
    </form>
  );
}
