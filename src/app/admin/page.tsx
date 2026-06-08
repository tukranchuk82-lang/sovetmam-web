import Link from "next/link";
import { Plus, FileText, Eye, EyeOff } from "lucide-react";
import { listMeasuresForAdmin } from "@/lib/measures-admin";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const measures = await listMeasuresForAdmin();

  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-extrabold tracking-tight">Меры поддержки</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Всего в базе: {measures.length}. Здесь можно добавлять, править и
        прикреплять материалы.
      </p>

      <Link
        href="/admin/measures/new"
        className={cn(buttonVariants(), "mt-4 h-11 w-full gap-2 px-4 text-sm")}
      >
        <Plus className="size-4" /> Добавить меру
      </Link>

      <div className="mt-5 space-y-2">
        {measures.map((m) => (
          <Link
            key={m.slug}
            href={`/admin/measures/${m.slug}`}
            className={cn(
              "block rounded-xl border p-3 transition-all hover:border-primary/50",
              // Опубликованные — обычная карточка; черновики — бледные, на сером фоне,
              // полупрозрачные; при наведении возвращаются в полный цвет
              m.isPublished
                ? "bg-card"
                : "bg-muted/60 opacity-45 hover:opacity-100",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={m.level === "federal" ? "default" : "secondary"}
                  >
                    {m.level === "federal" ? "Федеральная" : m.region ?? "Региональная"}
                  </Badge>
                  {m.isPublished ? (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="size-3" /> опубликовано
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <EyeOff className="size-3" /> черновик
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 font-semibold leading-snug">{m.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  /{m.slug}
                </p>
              </div>
              <FileText className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
