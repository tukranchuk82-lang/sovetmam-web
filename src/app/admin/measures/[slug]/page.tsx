import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2, ExternalLink } from "lucide-react";
import { MeasureForm } from "@/components/admin/measure-form";
import { getMeasureForAdmin } from "@/lib/measures-admin";
import {
  deleteMeasureAction,
  updateMeasureAction,
} from "@/app/admin/_actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `Правка: ${slug}` };
}

export default async function EditMeasurePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const measure = await getMeasureForAdmin(slug);
  if (!measure) notFound();

  const update = updateMeasureAction.bind(null, slug);
  const remove = deleteMeasureAction.bind(null, slug);

  return (
    <div className="px-4 py-5">
      <Link
        href="/admin"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку мер
      </Link>

      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight">
            {measure.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">/{measure.slug}</p>
        </div>
        <Link
          href={`/catalog/${measure.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          Открыть <ExternalLink className="size-3" />
        </Link>
      </div>

      <div className="mt-5">
        <MeasureForm
          initial={measure}
          action={update}
          submitLabel="Сохранить"
        />
      </div>

      <form action={remove} className="mt-8 border-t pt-5">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4" /> Удалить меру
        </button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Действие необратимо. Все прикреплённые материалы будут удалены вместе
          с мерой.
        </p>
      </form>
    </div>
  );
}
