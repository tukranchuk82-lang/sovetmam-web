import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutGrid,
  MessageSquare,
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
} from "lucide-react";
import { countNewInquiries } from "@/lib/inquiries-db";
import { countNewBotHelpRequests } from "@/lib/bot-help";
import { countOpenDisputes } from "@/lib/measure-disputes";
import { getCurrentStaff } from "@/lib/user-session";
import { ALLOWED_VIEW_MODES, effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { ROLE_LABELS } from "@/lib/onboarding-db";
import { AdminNavLink } from "@/components/admin/nav-link";
import { MobileAdminRail, type RailNavItem } from "@/components/admin/mobile-rail";
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
  // У владельца/техспеца, пробующих режим координатора «на себе», региона
  // нет — тогда координаторский экран показывает данные по всем регионам
  // разом, а не пустоту.
  const region = scope === "coordinator" ? staff.region : null;

  const newInquiries = await countNewInquiries(scope === "coordinator" ? (region ?? undefined) : undefined);
  // Заявки на кабинет и спорные меры — общая, не региональная очередь.
  const newRequests = scope !== "coordinator" ? await countNewBotHelpRequests() : 0;
  const openDisputes = scope !== "coordinator" ? await countOpenDisputes() : 0;

  const isCoordinatorScope = scope === "coordinator";
  const initials = `${staff.firstName?.[0] ?? ""}${staff.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const userName = `${staff.firstName} ${staff.lastName}`.trim();

  // Пункты меню — один список данных на сайдбар широкого экрана и на бар
  // телефона (MobileAdminRail): раньше приходилось держать в порядке две (а
  // сейчас были бы три) копии одной и той же разметки.
  const navGroups: RailNavItem[][] = isCoordinatorScope
    ? [
        [
          { href: "/admin", label: "Сводка", icon: <Gauge />, exact: true },
          { href: "/admin/inquiries", label: "Обращения", icon: <MessageSquare />, badge: newInquiries },
          { href: "/admin/measures", label: "Меры региона", icon: <LayoutGrid /> },
          { href: "/admin/region-survey", label: "Анкеты региона", icon: <Users /> },
          { href: "/admin/region-saved", label: "Избранное региона", icon: <Heart /> },
        ],
      ]
    : [
        [
          { href: "/admin", label: "Сводка", icon: <Gauge />, exact: true },
          { href: "/admin/measures", label: "Каталог мер", icon: <LayoutGrid /> },
          { href: "/admin/users", label: "Пользователи", icon: <Users /> },
        ],
        [
          { href: "/admin/representatives", label: "Координаторы в регионах", icon: <Landmark /> },
          { href: "/admin/inquiries", label: "Обращения", icon: <MessageSquare />, badge: newInquiries },
          { href: "/admin/requests", label: "Заявки на кабинет", icon: <Inbox />, badge: newRequests },
          { href: "/admin/verification", label: "Сверка", icon: <CalendarCheck /> },
          { href: "/admin/disputes", label: "Спорные меры", icon: <HelpCircle />, badge: openDisputes },
        ],
        [
          { href: "/admin/share", label: "Откуда приходят", icon: <Share2 /> },
          { href: "/admin/knowledge", label: "База знаний", icon: <FolderInput /> },
          // Управление ролями — технический раздел: аккаунты координаторов,
          // техспецов, передача прав владельца. Видно только в режиме
          // техспеца; владелец доберётся сюда, переключившись.
          ...(scope === "tech"
            ? [{ href: "/admin/staff", label: "Доступ и роли", icon: <ShieldCheck /> }]
            : []),
        ],
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
              {group.map((item) => (
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
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-white">{userName}</p>
            <p className="text-[11px] text-white/50">{ROLE_LABELS[staff.role]}</p>
          </div>
        </div>
      </aside>

      {/* ── Узкий бар-иконки — телефон; разворачивается по нажатию ──────── */}
      <MobileAdminRail
        groups={navGroups}
        region={isCoordinatorScope ? region : null}
        userInitials={initials}
        userName={userName}
        userRoleLabel={ROLE_LABELS[staff.role]}
      />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col pl-14 md:pl-0">
        {/* ── Тонкая шапка: только переключатель режима — название уже в
            сайдбаре/баре, заголовок раздела рисует сама страница ── */}
        <div className="sticky top-0 z-10 flex items-center justify-end border-b bg-card/70 px-3 py-2.5 backdrop-blur md:px-6">
          <ViewModeSwitch mode={mode} available={ALLOWED_VIEW_MODES[staff.role]} userTo="/" />
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
