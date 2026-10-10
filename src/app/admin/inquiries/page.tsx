import { Mail, MessageSquare } from "lucide-react";
import { redirect } from "next/navigation";
import { listAllInquiries, listInquiryRegions } from "@/lib/inquiries-db";
import { resendAllNewInquiriesAction } from "./actions";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { InquiriesTable } from "@/components/admin/inquiries-table";

export const metadata = { title: "Обращения" };
export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; region?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/inquiries");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  const isCoordinator = scope === "coordinator";

  const { sent } = await searchParams;
  // Координатор видит только свой регион — что бы ни было в адресной строке.
  // У владельца/техспеца регион — тот, что выбран в PreviewRegionPicker
  // (см. lib/preview-region.ts); ничего не выбрано — весь список.
  const region = isCoordinator ? ((await resolveRegion(staff, scope)) ?? undefined) : undefined;
  const [inquiries, regions] = await Promise.all([
    listAllInquiries(region),
    listInquiryRegions(),
  ]);
  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <AdminPage
      icon={<MessageSquare />}
      title="Обращения"
      description="Вопросы, идеи и уточнения от пользователей. Откройте обращение, чтобы ответить."
      actions={
        newCount > 0 && staff.role !== "analyst" ? (
          <form action={resendAllNewInquiriesAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium shadow-[0_1px_2px_rgba(32,36,44,0.04)] transition-colors hover:bg-muted"
            >
              <Mail className="size-3.5" />
              Отправить письмом новые ({newCount})
            </button>
          </form>
        ) : undefined
      }
    >
      {sent && (
        <p className="mb-3 rounded-lg border border-emerald-300/60 bg-emerald-50/70 px-3 py-2 text-[13px] text-emerald-800">
          Письма поставлены в отправку: {sent}. Дойдут в течение минуты.
        </p>
      )}
      <InquiriesTable inquiries={inquiries} regions={regions} showRegionFilter={!isCoordinator} />
    </AdminPage>
  );
}
