import Link from "next/link";
import { Landmark, Plus, EyeOff } from "lucide-react";
import { listRepresentativesForAdmin } from "@/lib/representatives-db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Представители в регионах" };
export const dynamic = "force-dynamic";

export default async function RepresentativesPage() {
  const representatives = await listRepresentativesForAdmin();

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<Landmark />}
        title="Представители в регионах"
        description="Аккредитованные организации, к которым человек может обратиться по мерам своего региона. Показываются в подборке и в карточках региональных мер."
        action={
          <Link
            href="/admin/representatives/new"
            className={cn(buttonVariants(), "h-10 gap-1.5 px-3 text-sm")}
          >
            <Plus className="size-4" /> Добавить
          </Link>
        }
      />

      {representatives.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
          <p className="font-semibold">Пока нет ни одного представителя</p>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {representatives.map((r) => (
            <Link
              key={r.id}
              href={`/admin/representatives/${r.id}`}
              className="block rounded-2xl border bg-card p-3.5 hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold leading-snug">{r.name}</p>
                {!r.isPublished && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                    <EyeOff className="size-3" /> скрыто
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{r.region}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
