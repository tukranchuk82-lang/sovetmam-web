import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { listMeasuresIndexForAdmin } from "@/lib/measures-admin";
import { CATEGORIES, REGIONS } from "@/lib/measures";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { MeasuresList } from "@/components/admin/measures-list";
import { MeasureFeedbackNote } from "@/components/admin/measure-feedback-note";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata = { title: "Каталог мер" };
export const dynamic = "force-dynamic";

export default async function AdminMeasuresPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/measures");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  const region = await resolveRegion(staff, scope);

  const all = await listMeasuresIndexForAdmin();
  // Координатор видит только меры своего региона — владелец/техспец,
  // пробующие этот режим «на себе», без региона видят всё как есть.
  const measures = region ? all.filter((m) => m.region === region) : all;

  // В фильтре показываем только те регионы, по которым меры действительно есть,
  // иначе список из 89 пунктов наполовину пустой.
  const usedRegions = REGIONS.filter((r) => measures.some((m) => m.region === r));

  return (
    <AdminPage
      icon={<LayoutGrid />}
      title={scope === "coordinator" ? "Меры региона" : "Каталог мер"}
      description={
        scope === "coordinator"
          ? region
            ? `Меры вашего региона — «${region}»: опубликованные и черновики. Нажмите на меру, чтобы открыть её целиком.`
            : "Меры всех регионов."
          : "Все меры поддержки: и опубликованные, и черновики. Нажмите на меру, чтобы отредактировать её или прикрепить материалы."
      }
      actions={
        scope !== "coordinator" && staff.role !== "analyst" ? (
          <Link
            href="/admin/measures/new"
            className={cn(buttonVariants(), "h-9 gap-1.5 px-3.5 text-[13px]")}
          >
            <Plus className="size-4" /> Добавить меру
          </Link>
        ) : undefined
      }
    >
      {scope === "coordinator" && <MeasureFeedbackNote className="mb-4" />}
      <MeasuresList
        measures={measures}
        regions={[...usedRegions]}
        categories={[...CATEGORIES]}
        hideLevelAndRegion={scope === "coordinator"}
      />
    </AdminPage>
  );
}
