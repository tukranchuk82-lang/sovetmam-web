"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  uploadedAt: Date;
}

function iconForMime(mime: string) {
  if (mime.startsWith("image/")) return <ImageIcon className="size-5" />;
  if (mime.startsWith("video/")) return <Film className="size-5" />;
  if (mime.startsWith("audio/")) return <Music className="size-5" />;
  return <FileText className="size-5" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeUploadStub() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      sizeBytes: f.size,
      type: f.type || "application/octet-stream",
      uploadedAt: new Date(),
    }));
    setFiles((prev) => [...arr, ...prev]);
  }

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-primary/50",
        )}
      >
        <Upload className="size-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">Перетащите файлы сюда</p>
        <p className="mt-1 text-xs text-muted-foreground">
          или нажмите, чтобы выбрать. PDF, DOC, JPG, PNG, MP4, MP3
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,image/*,video/mp4,audio/mpeg"
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Загружено в этой сессии ({files.length})
          </h2>
          <ul className="mt-2 space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {iconForMime(f.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(f.sizeBytes)} ·{" "}
                    {f.uploadedAt.toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((x) => x.id !== f.id))
                  }
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Удалить"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
