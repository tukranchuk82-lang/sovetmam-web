import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Trash2, ExternalLink } from "lucide-react";
import { MeasureForm } from "@/components/admin/measure-form";
import { getMeasureForAdmin } from "@/lib/measures-admin";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { MeasureFeedbackNote } from "@/components/admin/measure-feedback-note";
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
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/measures");

  const measure = await getMeasureForAdmin(slug);
  if (!measure) notFound();

  // Координатор — только мера его региона; чужой регион он даже открыть не
  // должен (совпадает с тем, что уже проверяет updateMeasureAction на сервере).
  if (staff.role === "coordinator" && measure.region !== staff.region) notFound();

  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));

  // Координатор меру только читает: правки и новые меры принимает председатель.
  if (scope === "coordinator" || staff.role === "analyst") {
    return (
      <div className="px-4 py-5 md:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/admin/measures" className="text-sm text-muted-foreground hover:text-foreground">
            ← К списку мер
          </Link>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight tracking-tight">{measure.title}</h1>
            <Link
              href={`/catalog/${measure.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              Как видят люди <ExternalLink className="size-3" />
            </Link>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {measure.isPublished ? "Опубликована" : "Черновик — людям не показывается"}
            {measure.amount ? ` · ${measure.amount}` : ""}
          </p>

          {scope === "coordinator" && <MeasureFeedbackNote className="mt-4" />}

          <div className="mt-5 space-y-5 light-surface rounded-2xl border bg-card p-5 text-[14px] leading-relaxed">
            <ReadBlock title="Кратко">{measure.shortDescription}</ReadBlock>
            {measure.eligibility && <ReadBlock title="Кому положено">{measure.eligibility}</ReadBlock>}
            <ReadList title="Как оформить" items={measure.howToApply} ordered />
            <ReadList title="Документы" items={measure.documents} />
            <ReadList title="Советы" items={measure.tips ?? []} />
            {measure.sourceUrl && (
              <ReadBlock title="Источник">
                <a href={measure.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  {measure.sourceName || measure.sourceUrl}
                </a>
              </ReadBlock>
            )}
          </div>
        </div>
      </div>
    );
  }

  const update = updateMeasureAction.bind(null, slug);
  const remove = deleteMeasureAction.bind(null, slug);

  return (
    <div className="px-4 py-5 md:px-6">
      <Link
        href="/admin/measures"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку мер
      </Link>

      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight">
            {measure.title}
          </h1>
          {scope === "tech" && (
            <p className="mt-1 text-xs text-muted-foreground">/{measure.slug}</p>
          )}
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
          mode={scope}
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

function ReadBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="mt-1 whitespace-pre-line">{children}</div>
    </section>
  );
}

function ReadList({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  if (items.length === 0) return null;
  const Tag = ordered ? "ol" : "ul";
  return (
    <section>
      <h2 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <Tag className={ordered ? "mt-1 list-decimal space-y-1 pl-5" : "mt-1 list-disc space-y-1 pl-5"}>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </Tag>
    </section>
  );
}
