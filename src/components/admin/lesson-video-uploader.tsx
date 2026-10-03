"use client";

import { useEffect, useRef, useState } from "react";
import { Upload as TusUpload } from "tus-js-client";
import { CheckCircle2, FileVideo, Loader2, Trash2, UploadCloud, X } from "lucide-react";

const MAX_BYTES = 500 * 1024 * 1024;
const CHUNK = 6 * 1024 * 1024; // хранилище принимает куски ровно по 6 МБ

function mb(n: number): string {
  return `${(n / 1024 / 1024).toFixed(n > 10 * 1024 * 1024 ? 0 : 1)} МБ`;
}

/**
 * Загрузка видео урока: выбрали файл — он уходит кусками по 6 МБ (tus), есть
 * полоса выполнения и отмена. Если связь оборвалась, загрузка сама продолжится с
 * того места. Готовый путь к файлу едет в форму скрытыми полями.
 */
export function LessonVideoUploader({
  initialPath,
  initialSize,
  onBusyChange,
}: {
  initialPath: string | null;
  initialSize: number | null;
  /** Сообщает форме, что идёт загрузка, — чтобы кнопка «Сохранить» подождала. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [size, setSize] = useState<number | null>(initialSize);
  const [fileName, setFileName] = useState<string | null>(initialPath ? "Видео загружено" : null);
  const [progress, setProgress] = useState<{ done: number; total: number; speed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<TusUpload | null>(null);
  const startedAt = useRef(0);

  const busy = progress !== null;
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  function start(file: File) {
    setError(null);
    if (!file.type.startsWith("video/")) {
      setError("Выберите видеофайл (mp4, mov, webm).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Файл больше 500 МБ (${mb(file.size)}). Сожмите видео или вставьте ссылку на него.`);
      return;
    }
    const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "mp4";
    const objectName = `lessons/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    startedAt.current = Date.now();
    setFileName(file.name);
    setProgress({ done: 0, total: file.size, speed: 0 });

    const upload = new TusUpload(file, {
      endpoint: "/api/lesson-upload",
      chunkSize: CHUNK,
      retryDelays: [0, 2000, 5000, 10000, 20000],
      removeFingerprintOnSuccess: true,
      uploadDataDuringCreation: false,
      headers: { "x-upsert": "true" },
      metadata: {
        bucketName: "lesson-videos",
        objectName,
        contentType: file.type || "video/mp4",
        cacheControl: "3600",
      },
      onProgress: (done, total) =>
        setProgress({ done, total, speed: done / 1024 / 1024 / Math.max(1, (Date.now() - startedAt.current) / 1000) }),
      onError: (e) => {
        setProgress(null);
        setFileName(null);
        setError(`Не получилось загрузить видео: ${e.message.slice(0, 160)}`);
      },
      onSuccess: () => {
        setProgress(null);
        setPath(objectName);
        setSize(file.size);
      },
    });
    uploadRef.current = upload;
    upload.start();
  }

  function cancel() {
    void uploadRef.current?.abort(true);
    uploadRef.current = null;
    setProgress(null);
    setFileName(null);
  }

  function remove() {
    setPath(null);
    setSize(null);
    setFileName(null);
  }

  const pct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0;
  const speed = progress?.speed ?? 0;

  return (
    <div>
      <input type="hidden" name="videoPath" value={path ?? ""} />
      <input type="hidden" name="videoSize" value={size ?? ""} />

      {busy ? (
        <div className="rounded-xl border border-white/20 bg-white/[0.07] p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 shrink-0 animate-spin text-white/80" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{fileName}</p>
              <p className="text-xs text-white/60">
                {mb(progress!.done)} из {mb(progress!.total)} · {speed.toFixed(1)} МБ/с
              </p>
            </div>
            <span className="text-lg font-bold tabular-nums">{pct}%</span>
            <button
              type="button"
              onClick={cancel}
              aria-label="Отменить загрузку"
              className="grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[#2FA36B] transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/55">Не закрывайте страницу, пока идёт загрузка.</p>
        </div>
      ) : path ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#2FA36B]/50 bg-[#2FA36B]/10 p-3.5">
          <CheckCircle2 className="size-5 shrink-0 text-[#6FD9A6]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{fileName ?? "Видео загружено"}</p>
            {size ? <p className="text-xs text-white/60">{mb(size)}</p> : null}
          </div>
          <label className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">
            Заменить
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && start(e.target.files[0])}
            />
          </label>
          <button
            type="button"
            onClick={remove}
            aria-label="Убрать видео"
            className="grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/10"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/25 bg-white/[0.04] px-4 py-8 text-center transition-colors hover:border-white/50 hover:bg-white/[0.08]">
          <UploadCloud className="size-8 text-white/70" strokeWidth={1.5} />
          <span className="text-sm font-semibold">Выберите видео с компьютера или телефона</span>
          <span className="inline-flex items-center gap-1 text-xs text-white/55">
            <FileVideo className="size-3.5" /> mp4, mov, webm — до 500 МБ
          </span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && start(e.target.files[0])}
          />
        </label>
      )}

      {error && <p className="mt-2 text-sm font-medium text-red-300">{error}</p>}
    </div>
  );
}
