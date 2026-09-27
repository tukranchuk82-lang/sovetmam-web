import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { listMeasuresIndexForAdmin } from "@/lib/measures-admin";
import { CATEGORIES, REGIONS } from "@/lib/measures";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MeasuresList } from "@/components/admin/measures-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata = { title: "Каталог мер" };
export const dynamic = "force-dynamic";

export default async function AdminMeasuresPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/measures");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  const region = scope === "coordinator" ? staff.region : null;

  const all = await listMeasuresIndexForAdmin();
  // Координатор видит только меры своего региона — владелец/техспец,
  // пробующие этот режим «на себе», без региона видят всё как есть.
  const measures = region ? all.filter((m) => m.region === region) : all;

  // В фильтре показываем только те регионы, по которым меры действительно есть,
  // иначе список из 89 пунктов наполовину пустой.
  const usedRegions = REGIONS.filter((r) => measures.some((m) => m.region === r));

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<LayoutGrid />}
        title={scope === "coordinator" ? "Меры региона" : "Каталог мер"}
        description={
          scope === "coordinator"
            ? "Меры вашего региона — опубликованные и черновики. Заводить новые и удалять нельзя, только править содержание."
            : "Все меры поддержки: и опубликованные, и черновики. Нажмите на меру, чтобы отредактировать её или прикрепить материалы."
        }
        action={
          scope !== "coordinator" ? (
            <Link
              href="/admin/measures/new"
              className={cn(buttonVariants(), "h-10 gap-1.5 px-3 text-sm")}
            >
              <Plus className="size-4" /> Добавить
            </Link>
          ) : undefined
        }
      />

      <MeasuresList
        measures={measures}
        regions={[...usedRegions]}
        categories={[...CATEGORIES]}
      />
    </div>
  );
}
