import Link from "next/link";
import { Landmark, Plus, Eye, EyeOff } from "lucide-react";
import { listRepresentativesForAdmin } from "@/lib/representatives-db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleRepresentativePublishedAction } from "./actions";

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
            <div
              key={r.id}
              className="flex items-center gap-2 rounded-2xl border bg-card p-3.5 hover:border-primary/40"
            >
              <Link href={`/admin/representatives/${r.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate font-semibold leading-snug">{r.name}</p>
                  {!r.isPublished && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      <EyeOff className="size-3" /> отключён
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.region}</p>
              </Link>

              {/* Быстрое включение/отключение — без похода в форму. Отдельно
                  от Link, чтобы клик по кнопке не уводил на страницу. */}
              <form
                action={toggleRepresentativePublishedAction.bind(null, r.id, !r.isPublished)}
              >
                <button
                  type="submit"
                  title={r.isPublished ? "Отключить представителя" : "Включить представителя"}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium",
                    r.isPublished
                      ? "text-muted-foreground hover:bg-muted"
                      : "border-primary/40 bg-primary/10 text-primary",
                  )}
                >
                  {r.isPublished ? (
                    <>
                      <EyeOff className="size-3.5" /> Отключить
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" /> Включить
                    </>
                  )}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
