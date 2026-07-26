import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { listMeasuresIndexForAdmin } from "@/lib/measures-admin";
import { CATEGORIES, REGIONS } from "@/lib/measures";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MeasuresList } from "@/components/admin/measures-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Каталог мер" };
export const dynamic = "force-dynamic";

export default async function AdminMeasuresPage() {
  const measures = await listMeasuresIndexForAdmin();

  // В фильтре показываем только те регионы, по которым меры действительно есть,
  // иначе список из 89 пунктов наполовину пустой.
  const usedRegions = REGIONS.filter((r) => measures.some((m) => m.region === r));

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<LayoutGrid />}
        title="Каталог мер"
        description="Все меры поддержки: и опубликованные, и черновики. Нажмите на меру, чтобы отредактировать её или прикрепить материалы."
        action={
          <Link
            href="/admin/measures/new"
            className={cn(buttonVariants(), "h-10 gap-1.5 px-3 text-sm")}
          >
            <Plus className="size-4" /> Добавить
          </Link>
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
