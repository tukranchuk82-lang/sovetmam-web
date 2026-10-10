import { Inbox } from "lucide-react";
import { listBotHelpRequests } from "@/lib/bot-help";
import { RequestsList } from "@/components/admin/requests-list";
import { AdminPageHeader } from "@/components/admin/page-header";
import { isReadOnlyViewer } from "@/lib/user-session";
import { ReadOnlyZone } from "@/components/admin/ui/read-only-zone";

export const metadata = { title: "Заявки на кабинет" };
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const items = await listBotHelpRequests();
  const readOnly = await isReadOnlyViewer();
  const open = items.filter((r) => r.status === "new").length;

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<Inbox />}
        title="Заявки на кабинет"
        description="Люди, которым не дошёл код на почту, и они написали нам в бота. Заведите кабинет — ссылка для входа уйдёт им в тот же чат."
      />

      {open > 0 && (
        <p className="mt-4 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-sm">
          <b>{open}</b>{" "}
          {open === 1 ? "человек ждёт" : open < 5 ? "человека ждут" : "человек ждут"}{" "}
          входа в приложение.
        </p>
      )}

      <ReadOnlyZone readOnly={readOnly}>
        <RequestsList items={items} />
      </ReadOnlyZone>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Ссылка для входа одноразовая и живёт сутки. Когда срок выйдет, она
        просто откроет приложение — человек сможет запросить код обычным путём,
        а вы можете прислать новую ссылку кнопкой в разобранных заявках.
      </p>
    </div>
  );
}
