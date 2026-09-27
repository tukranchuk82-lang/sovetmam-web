import Link from "next/link";
import { redirect } from "next/navigation";
import { MeasureForm } from "@/components/admin/measure-form";
import { createMeasureAction } from "@/app/admin/_actions";
import { getCurrentAdmin } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";

export const metadata = { title: "Новая мера" };
export const dynamic = "force-dynamic";

export default async function NewMeasurePage() {
  // Заводить новые меры может только полный админ — координатор здесь
  // делать нечего, редиректим к списку (уже своего региона).
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin/measures");
  const scope = effectiveAdminScope(admin.role, await getViewMode(admin.role));

  return (
    <div className="px-4 py-5 md:px-6">
      <Link
        href="/admin/measures"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку мер
      </Link>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight">
        Новая мера поддержки
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Заполните минимум обязательные поля. После сохранения попадёте на
        страницу редактирования.
      </p>
      <div className="mt-5">
        <MeasureForm
          initial={null}
          action={createMeasureAction}
          submitLabel="Создать меру"
          mode={scope === "tech" ? "tech" : "owner"}
        />
      </div>
    </div>
  );
}
