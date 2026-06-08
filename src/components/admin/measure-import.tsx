"use client";

import { useState } from "react";
import { Sparkles, Upload, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { MeasureForm } from "@/components/admin/measure-form";
import { createMeasureAction } from "@/app/admin/_actions";
import type { MeasureAdminRow } from "@/lib/measures-admin";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const inputCls =
  "w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function MeasureImport() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<MeasureAdminRow | null>(null);

  async function handleExtract() {
    setError(null);
    if (!file && !text.trim()) {
      setError("Прикрепите файл или вставьте текст меры.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (text.trim()) fd.append("text", text.trim());

      const res = await fetch("/api/admin/extract-measure", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as
        | { draft: MeasureAdminRow }
        | { error: string };

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Не удалось разобрать документ.");
        return;
      }
      setDraft(data.draft);
    } catch {
      setError("Сбой соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setDraft(null);
    setFile(null);
    setText("");
    setError(null);
  }

  if (draft) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Это черновик от AI — проверьте всё.</p>
            <p className="mt-0.5 text-amber-800">
              Особенно суммы, регион и условия. Мера сохранится{" "}
              <b>неопубликованной</b> — включите публикацию вручную, когда
              убедитесь, что всё верно.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-4" /> Разобрать другой документ
        </button>

        {/* key — чтобы форма перемонтировалась с новыми defaultValue */}
        <MeasureForm
          key={draft.slug || "draft"}
          initial={draft}
          action={createMeasureAction}
          submitLabel="Сохранить меру"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
        <label className="text-xs font-medium text-muted-foreground">
          Документ меры (PDF, фото; до 10 МБ)
        </label>
        <div className="mt-2 flex items-center gap-3">
          <label
            className={cn(
              buttonVariants({ variant: "outline" }),
              "cursor-pointer gap-2",
            )}
          >
            <Upload className="size-4" />
            {file ? "Заменить файл" : "Выбрать файл"}
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {file && (
            <span className="truncate text-sm text-muted-foreground">
              {file.name}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Word — сохраните как PDF. Можно вместо файла вставить текст ниже.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          …или вставьте текст меры
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Скопируйте сюда описание меры поддержки…"
          className={cn(inputCls, "mt-1")}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleExtract}
        disabled={loading}
        className={cn(buttonVariants(), "h-11 w-full gap-2 text-base")}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> AI разбирает документ…
          </>
        ) : (
          <>
            <Sparkles className="size-4" /> Разобрать и заполнить форму
          </>
        )}
      </button>
    </div>
  );
}
