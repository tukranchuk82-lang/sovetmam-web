import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, MapPin, MessageCircle } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { listConversationsByRegion } from "@/lib/coordinator-chat-db";
import { Avatar } from "@/components/avatar";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Чат с регионом" };
export const dynamic = "force-dynamic";

export default async function RegionChatPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/region-chat");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  if (scope !== "coordinator") redirect("/admin");

  const region = await resolveRegion(staff, scope);
  const conversations = await listConversationsByRegion(region);
  const unreadCount = conversations.filter((c) => c.unread).length;

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<MessageCircle />}
        title="Чат с регионом"
        description={
          region
            ? `Личные переписки с людьми из региона «${region}»: ${conversations.length}${unreadCount > 0 ? `, непрочитанных: ${unreadCount}` : ""}.`
            : `Вы видите эту страницу по своему региону. Выберите регион справа сверху, чтобы посмотреть его вживую, — пока ниже беседы по всем регионам сразу.`
        }
      />

      {conversations.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-muted/40 px-4 py-10 text-center">
          <p className="text-sm font-medium">Пока никто не писал</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Когда человек напишет координатору в личном кабинете — переписка появится здесь
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.userId}
              href={`/admin/region-chat/${c.userId}`}
              className="block rounded-2xl border bg-card p-3 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start gap-3">
                <Avatar name={c.userName} color="#1B3A6B" size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold leading-snug">{c.userName}</p>
                    {!region && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                        <MapPin className="size-3" />
                        {c.region}
                      </span>
                    )}
                    {c.unread && (
                      <span className="rounded-full bg-[#E4374B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        новое
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {c.lastAuthor === "coordinator" ? "Вы: " : ""}
                    {c.lastMessage}
                  </p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
