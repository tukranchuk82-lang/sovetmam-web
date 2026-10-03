import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutGrid,
  MessageSquare,
  MessageCircle,
  FolderInput,
  Share2,
  CalendarCheck,
  Users,
  Gauge,
  Inbox,
  HelpCircle,
  Landmark,
  Heart,
  ShieldCheck,
  LifeBuoy,
  UserPlus,
  LogOut,
  Map,
  ClipboardList,
  Eye,
} from "lucide-react";
import { countNewInquiries } from "@/lib/inquiries-db";
import { getChatInquiryCounts } from "@/lib/coordinator-insights";
import { countNewBotHelpRequests } from "@/lib/bot-help";
import { countOpenDisputes } from "@/lib/measure-disputes";
import { countUnreadForCoordinator as countSupportUnread, countWaitingForTech } from "@/lib/support-chat-db";
import { getCurrentStaff } from "@/lib/user-session";
import { ALLOWED_VIEW_MODES, effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { ROLE_LABELS } from "@/lib/onboarding-db";
import { logout } from "@/app/(app)/login/onboarding-actions";
import { AdminNavLink } from "@/components/admin/nav-link";
import { AdminTopbar } from "@/components/admin/topbar";
import { MobileAdminRail, type NavGroup } from "@/components/admin/mobile-rail";
import { ViewModeSwitch } from "@/components/view-mode-switch";
import { OrgName } from "@/components/org-name";

export const metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Тёмно-синий сайдбар — единственная тёмная поверхность в админке, поэтому
// цвета заданы здесь напрямую, а не через токены темы (см. .admin-shell
// в globals.css — это про светлую рабочую область).
const SIDEBAR_BG = "linear-gradient(180deg, #16233F 0%, #101A30 100%)";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Доступ для владельца, техспеца и координатора. Остальных — на вход (там
  // уже залогиненного, но не-сотрудника, перекинет в личный кабинет).
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin");

  const mode = await getViewMode(staff.role);
  const scope = effectiveAdminScope(staff.role, mode);
  // У владельца/техспеца, пробующих режим координатора «на себе», своего
  // региона нет — resolveRegion берёт тот, что выбран в PreviewRegionPicker
  // (или ничего не выбрано — тогда данные по всем регионам разом).
  const region = await resolveRegion(staff, scope);

  const newInquiries = await countNewInquiries(scope === "coordinator" ? (region ?? undefined) : undefined);
  // Кружок «Обращений»: сколько бесед ждут ответа — то же число, что на сводке.
  const unreadChat = scope === "coordinator" ? (await getChatInquiryCounts(region)).waiting : 0;
  // Заявки на кабинет и спорные меры — общая, не региональная очередь.
  // Кружок «Техподдержки»: у координатора — непрочитанные ответы, у техспеца и
  // владельца — сколько координаторов ждут ответа.
  const supportBadge =
    staff.role === "coordinator"
      ? await countSupportUnread(staff.id)
      : staff.role === "tech" || staff.role === "owner"
        ? await countWaitingForTech()
        : 0;
  const newRequests = scope !== "coordinator" ? await countNewBotHelpRequests() : 0;
  const openDisputes = scope !== "coordinator" ? await countOpenDisputes() : 0;

  const isCoordinatorScope = scope === "coordinator";
  const initials = `${staff.firstName?.[0] ?? ""}${staff.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const userName = `${staff.firstName} ${staff.lastName}`.trim();

  // Пункты меню — один список данных на сайдбар широкого экрана и на бар
  // телефона (MobileAdminRail): раньше приходилось держать в порядке две (а
  // сейчас были бы три) копии одной и той же разметки.
  const navGroups: NavGroup[] = isCoordinatorScope
    ? [
        {
          items: [
            { href: "/admin", label: "Сводка", icon: <Gauge />, exact: true },
            { href: "/admin/region-chat", label: "Обращения", icon: <MessageCircle />, badge: unreadChat },
            { href: "/admin/measures", label: "Меры региона", icon: <LayoutGrid /> },
            { href: "/admin/region-survey", label: "Пользователи региона", icon: <Users /> },
            { href: "/admin/region-saved", label: "Избранное региона", icon: <Heart /> },
            { href: "/admin/region-views", label: "Что смотрят", icon: <Eye /> },
            { href: "/admin/invite", label: "Пригласить пользователя", icon: <UserPlus /> },
            { href: "/admin/support", label: "Техподдержка", icon: <LifeBuoy />, badge: supportBadge },
          ],
        },
      ]
    : [
        {
          title: "Аудитория",
          items: [
            { href: "/admin", label: "Обзор", icon: <Gauge />, exact: true },
            { href: "/admin/users", label: "Люди", icon: <Users /> },
            { href: "/admin/share", label: "Откуда приходят", icon: <Share2 /> },
            { href: "/admin/regions", label: "Регионы", icon: <Map /> },
          ],
        },
        {
          title: "Поведение",
          items: [
            { href: "/admin/views", label: "Что смотрят", icon: <Eye /> },
            { href: "/admin/surveys", label: "Анкеты", icon: <ClipboardList /> },
            { href: "/admin/saved", label: "Избранное", icon: <Heart /> },
          ],
        },
        {
          title: "Работа",
          items: [
            { href: "/admin/inquiries", label: "Обращения", icon: <MessageSquare />, badge: newInquiries },
            { href: "/admin/requests", label: "Заявки на кабинет", icon: <Inbox />, badge: newRequests },
            { href: "/admin/disputes", label: "Спорные меры", icon: <HelpCircle />, badge: openDisputes },
            { href: "/admin/verification", label: "Сверка", icon: <CalendarCheck /> },
            { href: "/admin/measures", label: "Каталог мер", icon: <LayoutGrid /> },
            { href: "/admin/representatives", label: "Координаторы в регионах", icon: <Landmark /> },
            { href: "/admin/knowledge", label: "База знаний", icon: <FolderInput /> },
            { href: "/admin/support", label: "Техподдержка", icon: <LifeBuoy />, badge: supportBadge },
            // Сотрудники: координаторы по регионам, техспецы, владельцы и
            // передача прав. Видно и владельцу, и техспецу.
            { href: "/admin/staff", label: "Сотрудники", icon: <ShieldCheck /> },
          ],
        },
      ];

  return (
    <div className="admin-shell flex min-h-dvh w-full bg-background text-foreground">
      {/* ── Сайдбар — широкий экран ─────────────────────────────────────── */}
      <aside
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto px-3.5 py-5 md:flex"
        style={{ background: SIDEBAR_BG }}
      >
        <div className="px-2 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
            Админ-панель
            {isCoordinatorScope && region ? ` · ${region}` : ""}
          </p>
          <Link href="/admin" className="block truncate font-bold leading-tight text-white hover:text-white/85">
            <OrgName />
          </Link>
        </div>

        <nav className="flex flex-col gap-0.5">
          {navGroups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-0.5">
              {gi > 0 && <div className="my-2.5 h-px bg-white/10" />}
              {group.title && (
                <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => (
                <AdminNavLink key={item.href} href={item.href} icon={item.icon} badge={item.badge} exact={item.exact}>
                  {item.label}
                </AdminNavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 px-2 pt-4">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-white/[0.14] text-[11px] font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-white">{userName}</p>
            <p className="text-[11px] text-white/50">{ROLE_LABELS[staff.role]}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Выйти"
              className="grid size-[30px] shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/[0.1] hover:text-white"
            >
              <LogOut className="size-4" strokeWidth={1.8} />
            </button>
          </form>
        </div>
      </aside>

      {/* ── Узкий бар-иконки — телефон; разворачивается по нажатию ──────── */}
      <MobileAdminRail
        groups={navGroups}
        region={isCoordinatorScope ? region : null}
        userInitials={initials}
        userName={userName}
        userRoleLabel={ROLE_LABELS[staff.role]}
        logoutAction={logout}
      />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col pl-14 md:pl-0">
        {/* ── Верхняя полоса: где я (раздел) слева, режим просмотра справа ── */}
        <AdminTopbar backToSummary={isCoordinatorScope} sections={navGroups.flatMap((g) => g.items).map((i) => ({ href: i.href, label: i.label }))}>
          <span className="hidden text-xs text-muted-foreground sm:inline">Режим:</span>
          <ViewModeSwitch mode={mode} available={ALLOWED_VIEW_MODES[staff.role]} />
        </AdminTopbar>

        {/* Единая колонка контента: на широком экране строки не растягиваются
            на весь монитор — читать и сканировать глазом проще. */}
        <main className="mx-auto w-full max-w-[1280px] flex-1">{children}</main>
      </div>
    </div>
  );
}
