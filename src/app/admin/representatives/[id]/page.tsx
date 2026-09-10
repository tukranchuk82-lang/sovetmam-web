import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { RepresentativeForm } from "@/components/admin/representative-form";
import { getRepresentativeForAdmin } from "@/lib/representatives-db";
import {
  updateRepresentativeAction,
  deleteRepresentativeAction,
} from "@/app/admin/representatives/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const representative = await getRepresentativeForAdmin(id);
  return { title: representative ? `Правка: ${representative.name}` : "Представитель" };
}

export default async function EditRepresentativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const representative = await getRepresentativeForAdmin(id);
  if (!representative) notFound();

  const update = updateRepresentativeAction.bind(null, id);
  const remove = deleteRepresentativeAction.bind(null, id);

  return (
    <div className="px-4 py-5 md:px-6">
      <Link
        href="/admin/representatives"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку представителей
      </Link>

      <h1 className="mt-2 text-xl font-extrabold leading-tight tracking-tight">
        {representative.name}
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">{representative.region}</p>

      <div className="mt-5">
        <RepresentativeForm
          initial={representative}
          action={update}
          submitLabel="Сохранить"
        />
      </div>

      <form action={remove} className="mt-8 border-t pt-5">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4" /> Удалить представителя
        </button>
      </form>
    </div>
  );
}
