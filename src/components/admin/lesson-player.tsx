"use client";

import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { markLessonWatchedAction } from "@/app/admin/instructions/actions";

/**
 * Проигрыватель урока. Урок помечается просмотренным сам, когда видео доиграно
 * (или просмотрено больше 90%); для видео по ссылке (YouTube, VK) такой
 * отметки нет, поэтому рядом есть кнопка, которой координатор отмечает сам.
 */
export function LessonPlayer({
  lessonId,
  src,
  embed,
  externalUrl,
  watched: initiallyWatched,
}: {
  lessonId: string;
  /** Подписанная ссылка на файл из хранилища. */
  src: string | null;
  /** Адрес для встраивания чужого видеоплеера. */
  embed: string | null;
  /** Ссылка, которую не умеем встраивать, — покажем кнопкой. */
  externalUrl: string | null;
  watched: boolean;
}) {
  const [watched, setWatched] = useState(initiallyWatched);
  const sent = useRef(initiallyWatched);

  function mark() {
    if (sent.current) return;
    sent.current = true;
    setWatched(true);
    void markLessonWatchedAction(lessonId);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-black shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)]">
        {src ? (
          <video
            controls
            playsInline
            preload="metadata"
            src={src}
            className="aspect-video w-full bg-black"
            onEnded={mark}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration > 0 && v.currentTime / v.duration > 0.9) mark();
            }}
          />
        ) : embed ? (
          <iframe
            src={embed}
            className="aspect-video w-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            title="Видео урока"
          />
        ) : externalUrl ? (
          <div className="grid aspect-video place-items-center p-6 text-center">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#16233F]"
            >
              Открыть видео в новой вкладке
            </a>
          </div>
        ) : (
          <div className="grid aspect-video place-items-center text-sm text-white/60">Видео пока не загружено</div>
        )}
      </div>

      <div className="mt-3">
        {watched ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#2FA36B]/20 px-3 py-1.5 text-sm font-semibold text-[#9FE3C0]">
            <CheckCircle2 className="size-4" /> Урок просмотрен
          </p>
        ) : (
          <button
            type="button"
            onClick={mark}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Отметить как просмотренный
          </button>
        )}
      </div>
    </div>
  );
}
