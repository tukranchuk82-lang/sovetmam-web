import { redirect } from "next/navigation";
import { Bookmark, FileText, Heart, MessageCircle, Users } from "lucide-react";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { countSurveyFillersByRegion, listSurveyFillersByRegion } from "@/lib/region-insights";
import Link from "next/link";
import { getRegionPeopleSummary } from "@/lib/coordinator-insights";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { RegionSurveyList } from "@/components/admin/region-survey-list";
import { describeSurvey } from "@/lib/survey-describe";
import { StatCard } from "@/components/admin/ui/primitives";
import { BarList } from "@/components/admin/ui/charts";

export const metadata = { title: "Пользователи региона" };
export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function RegionSurveyPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/region-survey");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));
  if (scope !== "coordinator") redirect("/admin");

  const region = await resolveRegion(staff, scope);
  const allUsers = await listSurveyFillersByRegion(region);
  // Без региона (просмотр «на себе» у владельца/техспеца) людей набирается
  // больше тысячи — у настоящего координатора их по одному региону в разы
  // меньше, но список всё равно нужно чем-то ограничить. «Всего» считаем
  // отдельным count-запросом: PostgREST сам режет выборку на 1000 строк,
  // так что длина allUsers для реального общего числа не годится.
  const PREVIEW_LIMIT = 150;
  const users = region ? allUsers : allUsers.slice(0, PREVIEW_LIMIT);
  const total = region ? users.length : await countSurveyFillersByRegion(null);
  const sum = await getRegionPeopleSummary(region);
  const f = sum.families;

  return (
    <AdminPage
      icon={<Users />}
      title="Пользователи региона"
      description={
        region
          ? `Кто в регионе «${region}» заполнил анкету подбора мер, что сохраняет в избранное и где с ним можно связаться.`
          : "Сводка по людям всех регионов сразу."
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Заполнили анкету" value={sum.surveyed} icon={<FileText />} color="rose" />
        <StatCard label="Подключили мессенджер" value={sum.messenger} icon={<MessageCircle />} color="sky" />
        <StatCard label="Сохраняли меры в избранное" value={sum.savedPeople} icon={<Heart />} color="blue" />
        <StatCard label="Всего сохранённых мер" value={sum.savedTotal} icon={<Bookmark />} color="green" />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
          <h2 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Мессенджеры</h2>
          <BarList
            total={sum.surveyed}
            tone="navy"
            items={[
              { label: "Telegram", value: sum.telegram },
              { label: "MAX", value: sum.max },
              { label: "ВКонтакте", value: sum.vk },
            ].filter((i) => i.value > 0)}
            emptyText="Пока никто не подключил мессенджер"
          />
        </section>
        <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
          <h2 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Какие семьи</h2>
          <BarList
            total={sum.surveyed}
            items={[
              { label: "С детьми", value: f.withChildren },
              { label: "Многодетные (3 и более)", value: f.large },
              { label: "Один родитель", value: f.singleParent },
              { label: "Семьи участников СВО", value: f.svo },
              { label: "Ребёнок с инвалидностью", value: f.disabledChild },
              { label: "Ждут ребёнка", value: f.pregnant },
            ].filter((i) => i.value > 0)}
            emptyText="Нет данных"
          />
        </section>
        <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)] lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Что чаще всего сохраняют</h2>
            <Link href="/admin/region-saved" className="text-[12.5px] font-medium text-primary hover:underline">
              Всё избранное региона →
            </Link>
          </div>
          <BarList
            tone="navy"
            items={sum.topSaved.map((m) => ({ label: m.title, value: m.count, href: `/catalog/${m.slug}` }))}
            emptyText="Пока никто не сохранял меры"
          />
        </section>
      </div>

      <h2 className="mb-2 mt-7 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {region ? "Заполнили анкету" : `Самые свежие анкеты: ${users.length} из ${total}`}
      </h2>
      <RegionSurveyList
        users={users.map((u) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim() || u.email,
          email: u.email,
          date: formatDate(u.surveyUpdatedAt),
          rows: describeSurvey(u.survey),
        }))}
      />
    </AdminPage>
  );
}
